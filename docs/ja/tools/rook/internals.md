# 内部実装

> コミット `63eed4e` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/rook` | CLI エントリ。`main()` が cobra コマンドを配線する (`cmd/rook/main.go:27`) |
| `cmd/rook/ceph` | `ceph operator` サブコマンドと、その実行関数 `startOperator` (`cmd/rook/ceph/operator.go:54`) |
| `pkg/apis/ceph.rook.io/v1` | `CephCluster` などの CRD Go 型 (`pkg/apis/ceph.rook.io/v1/types.go:50`) |
| `pkg/operator/ceph` | オペレータプロセスとコントローラ登録 (`pkg/operator/ceph/operator.go`, `pkg/operator/ceph/cr_manager.go`) |
| `pkg/operator/ceph/cluster` | CephCluster コントローラとデーモンのオーケストレーション (`pkg/operator/ceph/cluster/controller.go`, `pkg/operator/ceph/cluster/cluster.go`) |
| `pkg/daemon/ceph/client` | 実行時のクラスタ identity と Ceph クライアントヘルパ (`pkg/daemon/ceph/client/info.go`) |

## 中核データ構造

`CephCluster` がトップレベルの CRD である (`pkg/apis/ceph.rook.io/v1/types.go:50`)。`Spec ClusterSpec` と `Status ClusterStatus` を持ち、kubebuilder マーカで short name `ceph` と Health・FSID の print column が付く (`pkg/apis/ceph.rook.io/v1/types.go:49`)。`ClusterSpec` は宣言的設定の塊で、`CephVersion`・`Storage`・`Network`・`Placement`・`Resources` などを持つ (`pkg/apis/ceph.rook.io/v1/types.go:100`)。

`ClusterInfo` はクラスタの実行時 identity である (`pkg/daemon/ceph/client/info.go:38`)。`FSID`・monitor secret・Ceph credential・内部および外部の monitor マップ・検出された Ceph バージョンを持つ。さらに `Context context.Context` フィールドを埋め込む (`pkg/daemon/ceph/client/info.go:62`)。

`cluster` は namespace 単位のオーケストレーション状態である (`pkg/operator/ceph/cluster/cluster.go:64`)。`ClusterInfo`・spec・mon cluster・`monitoringRoutines` マップ・observed generation を束ねる。`ClusterController` はそれらの上に位置し、namespace をキーにした `clusterMap` を保持して複数の CephCluster を同時に扱う (`pkg/operator/ceph/cluster/controller.go:86`)。

## 追う価値のあるパス

エンドツーエンドの作成パスは `reconcileCephDaemons` にある (`pkg/operator/ceph/cluster/cluster.go:98`)。mon を起動し、クラスタ identity の確立を確認し、続いて mgr と OSD を順に立ち上げる。

```go
clusterInfo, err := c.mons.Start(c.ClusterInfo, rookImage, cephVersion, *c.Spec)
// ...
// The cluster Identity must be established at this point
if err := c.ClusterInfo.IsInitialized(); err != nil {
    return errors.Wrap(err, "the cluster identity was not established")
}

if c.ClusterInfo.Context.Err() != nil {
    return c.ClusterInfo.Context.Err()
}
```

これは `pkg/operator/ceph/cluster/cluster.go:117` から `pkg/operator/ceph/cluster/cluster.go:130` までである。mon の後、`mgr.New(...).Start()` が manager を立ち上げ (`pkg/operator/ceph/cluster/cluster.go:145`)、`osd.New(...).Start()` が OSD を立ち上げる (`pkg/operator/ceph/cluster/cluster.go:160`)。各段階で `controller.UpdateCondition` を呼び、CR の `status.conditions` を "Configuring Ceph Mons" のような人間可読なメッセージとともに `Progressing` へ更新する (`pkg/operator/ceph/cluster/cluster.go:116`)。

呼び出しチェーンは上から下へ次の通り。

```text
ReconcileCephCluster.Reconcile   controller.go:311
  -> reconcile                   controller.go:320
    -> reconcileCephCluster      controller.go:456
      -> reconcileCephDaemons    cluster.go:98
        -> mons.Start            cluster.go:117
        -> mgr.New().Start       cluster.go:145
        -> osd.New().Start       cluster.go:160
```

## 読んで驚いた点

特に目を引く選択が 2 つあり、どちらもキャンセルに関するものだ。

1 つ目。オペレータは破壊によってリロードする。`SIGHUP` を受けると稼働中の reconciler にパッチを当てず、controller-runtime manager 全体を破棄して新しいものを作り直し、その途中で "cancelling all orchestrations!" とログする (`pkg/operator/ceph/operator.go:110`)。設定変更は確実に波及するが、進行中のオーケストレーションは放棄される。

2 つ目。`ClusterInfo` は共有 clusterd context を使わず、意図的に自前の `context.Context` を持つ。コメントが理由を説明している。この context は "cannot be in main clusterd context since this is a pointer passed through the entire life cycle of the operator. If the context is cancelled it will immediately be re-created, thus existing reconcile loops will not be cancelled." である。context がキャンセルされると即再生成される `ClusterInfo` 側に context を載せることで、キャンセルがそれの属する reconcile ループを実際に止められるようになる (`pkg/daemon/ceph/client/info.go:55`)。だから mon 起動パスは `c.ClusterInfo.Context.Err()` を直接チェックする (`pkg/operator/ceph/cluster/cluster.go:128`)。
