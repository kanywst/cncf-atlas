# 内部実装

> コミット `3b8885a` のソースを読んだもの。ここでの主張はすべて [longhorn/longhorn-manager](https://github.com/longhorn/longhorn-manager) のファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `main.go` | CLI エントリ。`daemon` / `csi` / `recurring-job` / upgrade / uninstall サブコマンドを束ねる (`main.go:63-74`)。 |
| `app/` | 各サブコマンドの本体。`app/daemon.go` が常駐 manager とコントローラを起動する。 |
| `k8s/pkg/apis/longhorn/v1beta2/` | 全 CRD 型定義 (Volume, Engine, Replica, Node, InstanceManager ほか)。 |
| `controller/` | CRD 1 つにつき 1 コントローラ。data plane を駆動する reconcile ロジック。 |
| `datastore/` | informer cache と typed client を単一の `DataStore` ファサードに隠す。 |
| `scheduler/` | `replica_scheduler.go`、レプリカ配置の純ロジック。 |
| `engineapi/` | `longhorn-instance-manager` とエンジンへの gRPC クライアント。 |
| `csi/`, `webhook/`, `upgrade/` | CSI driver、admission/conversion webhook、バージョンマイグレーション。 |

## 中核データ構造

中核の型はすべて `k8s/pkg/apis/longhorn/v1beta2/` にある。

- **`Volume`** (`volume.go:454`) はユーザが触る最上位 CRD。`VolumeSpec` (`volume.go:251`) は `Size`、`NumberOfReplicas` (`volume.go:320`)、`Frontend` (`volume.go:256`、`blockdev`/`iscsi`/`ublk` のいずれか)、`DataEngine` (`volume.go:336`、v1 か v2)、加えて data locality、アクセスモード (RWO/RWX)、migratable、暗号化、anti-affinity 群を持つ。`VolumeStatus` (`volume.go:378`) は `OwnerID`、`State`、`Robustness`、`Conditions` を持つ。
- **`Engine`** (`engine.go:241`) はボリューム 1 つの単一フロントエンドコントローラ。`InstanceSpec`/`InstanceStatus` を内包し、`Status.ReplicaModeMap` でレプリカごとの RW/ERR 状態を公開する。volume controller はこの map を読んでレプリカ健全性を判断する (`controller/volume_controller.go:744`)。
- **`Replica`** (`replica.go:108`、spec は `replica.go:23`) は 1 レプリカ = 1 プロセス。`Spec.NodeID`、`DiskID`、`DataPath` で配置先を固定する。同じ `InstanceSpec` を共有する。
- **`InstanceManager`** と `InstanceSpec` (`instancemanager.go:87`)、`InstanceStatus` (`instancemanager.go:108`) はノードごとの instance-manager pod を表す。engine と replica の両方が共通の `InstanceSpec` を埋め込むため、1 つの起動仕様でどちらのプロセスも記述する。
- **`Node`** (`node.go`) は Longhorn から見たノードとそのディスク。scheduler は容量/予約/タグのために `Node.Spec.Disks` を読む。

## 追う価値のあるパス

`replenishReplicas` (`controller/volume_controller.go:3066`) のレプリカ補充が最も学びが多い。一時的なノード障害のあとにボリューム全体を再コピーするのを Longhorn がどう避けるかが見えるからだ。

レプリカを作る前に、一連のガードを通す。

```text
replenishReplicas (volume_controller.go:3066)
  guard: hasEngineStatusSynced(e, rs)          -> :3096  (engine status 未同期なら return)
  guard: getRebuildingReplicaCount(e) != 0     -> :3100  (rebuild 進行中なら return)
  reuse: CheckAndReuseFailedReplica(...)        -> :3118
    backoff: IsInBackOffSinceUpdate(...)        -> :3124
    bump:    RebuildRetryCount++                -> :3130
  new:   RequireNewReplica(...) == 0            -> :3142
         newReplicaCR(v, e, hardNodeAffinity)   -> :3143
```

ポイントは「新規作成の前に再利用」という順序だ。ノードが一瞬落ちてレプリカが剥がれたとき、scheduler は新しいフルコピーを割り当てる代わりに同じレプリカを呼び戻して再同期しようとする。`RebuildRetryCount` (`controller/volume_controller.go:3130`) は 1 レプリカを再利用できる回数に上限を設け、恒久的に壊れたディスクが無限ループしないようにする。backoff チェック (`controller/volume_controller.go:3124`) がリトライ間隔を空ける。

## 読んで驚いた点

- **補充は基本 1 レプリカずつ**。`getRebuildingReplicaCount(e)` が非ゼロなら `replenishReplicas` は即 return する (`controller/volume_controller.go:3100`)。つまり rebuild は逐次化される。複数同時 rebuild が I/O を食い潰すのを防ぐ意図で、復旧は健全レプリカからの逐次再構築に倒している。
- **既知のレプリカ IP 重複バグへの明示的ガード**がある。補充は engine status が同期するまで `hasEngineStatusSynced` (`controller/volume_controller.go:3096`) で保留される。コードはその理由として upstream issue (longhorn/longhorn#687) を参照している。
- **v2 (SPDK) data engine の teardown は厳密な順序で進む**。削除は engine frontend、次に engine (raid bdev)、次に replica (replica bdev) と歩き、前の層が完全に消えるまで次の層へ進まない (`controller/volume_controller.go:400-473`、`types.IsDataEngineV2` で `controller/volume_controller.go:365` がゲート)。`spdk_tgt` の "no such device" エラーを避けるためで、単純削除の v1 経路よりずっと厳格だ。
