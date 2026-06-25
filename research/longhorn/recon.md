# recon: Longhorn

調査メモ。Longhorn は Kubernetes 上で動く分散ブロックストレージ。既存ストレージを束ねるのではなく、ボリュームごとに専用のエンジン (controller) とレプリカを軽量プロセスとして立てる "microservice per volume" 型が本質。control plane は longhorn-manager (CRD + controller 群)、data plane は longhorn-engine / longhorn-instance-manager。

## 基本情報

- project umbrella repo: `longhorn/longhorn` (<https://github.com/longhorn/longhorn>)。Shell + deploy yaml + Helm chart + docs/e2e の傘 repo。star / コミュニティはここで数える
- 本調査でクローンした主実装 repo: `longhorn/longhorn-manager` (<https://github.com/longhorn/longhorn-manager>)。Go 製の control plane。CRD 定義と全 controller がここ。コードの深掘りはこの repo を読む
- pinned commit: `3b8885a0edb5c1bef3a0dac7d8c5eeb08a0414de` (committer date 2026-06-23, master HEAD, `--depth 1` graft)。Internals/Architecture は全てこの commit に対して検証
- 近いリリースタグ: `v1.12.0` (2026-06-02, `longhorn/longhorn` の latest release)。HEAD はそれ以降の master 開発断面。shallow clone なので `git describe` は不可
- 言語 / ビルド: Go (`go 1.26.0`, `go.mod:3`) / `make` (`Makefile:13` `build`, 実体は `scripts/build`)。`src/` は gitignored
- ライセンス: Apache-2.0。`gh api repos/longhorn/longhorn-manager` の `spdx_id` = `Apache-2.0`。`LICENSE` 冒頭も Apache License Version 2.0 で確認 (ただしテンプレ未差し込みで `Copyright {yyyy} {name of copyright owner}` のまま)
- CNCF 成熟度: Incubating (2021-11-04 昇格)。CNCF プロジェクトページで確認
- カテゴリ (tools.ts の CATEGORY_ORDER から): Storage & Database
- main entrypoint: `main.go:25` の `main()`。`urfave/cli` で複数サブコマンドを束ねる単一バイナリ。control plane 本体は `app.DaemonCmd()` (`main.go:64`) で、`app/daemon.go:250` `startManager` が `controller.StartControllers` (`app/daemon.go:332`) を呼ぶ。他に `csi` / `recurring-job` / `pre-upgrade` / `post-upgrade` / `uninstall` などのサブコマンドを内包 (`main.go:63-74`)
- tagline (en): Kubernetes-native distributed block storage that gives every volume its own lightweight engine and replicas.
- tagline (ja): ボリュームごとに専用エンジンとレプリカを持たせる、Kubernetes ネイティブの分散ブロックストレージ。

## 歴史の素材

- 2017-04: Rancher Labs が Longhorn を発表。共同創業者 Sheng Liang が "container 向けの新しい分散ブロックストレージ" として紹介。`longhorn/longhorn` repo の `created_at` は 2017-04-14 (`gh api`)、`longhorn/longhorn-engine` は 2016-04-08 と更に古い。出典: <https://www.cncf.io/projects/longhorn/> / <https://www.rancher.com/blog/2019/longhorn-accepted-into-cncf/>
- 2019-10-11: Rancher Labs が CNCF に寄贈し Sandbox プロジェクトとして受理。寄贈時点の version は 0.6.2 (snapshot / backup-restore / live upgrade / DR / one-click install / GUI を既に持つ)。出典: <https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/> / <https://devclass.com/2019/10/29/cncf-welcomes-longhorn-to-its-sandbox/>
- 2020: Rancher が SUSE に買収される。以降 Longhorn の主スポンサーは SUSE。商用版は "SUSE Storage (powered by Longhorn)"。出典: <https://www.suse.com/c/persistent-block-storage-for-kubernetes-suse-storage-powered-by-longhorn/>
- 2021-11-04: CNCF TOC が Incubating へ昇格を承認。寄贈以降の成長として contributor 200 (30 社) から 800+ (120+ 社)、committer 14 (3 社) から 70+ (13+ 社)、稼働ノード 2,700 から 34,000+ (10x) を CNCF が提示。出典: <https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/>
- 設計の系譜: data plane (longhorn-engine) が先に存在し、後から Kubernetes 化のための control plane (longhorn-manager) を被せた。manager は CRD + controller pattern、data plane との通信は動的な pod 管理で組む。`README.md` も "Manager for Longhorn" とだけ書く薄さ。出典: <https://longhorn.io/>
- v2 Data Engine: 従来の v1 (longhorn-engine, iSCSI/tgt ベース) に加え、SPDK ベースの v2 data engine が近年のリリースで進展。コード全域に `IsDataEngineV1/V2` の分岐 (`controller/volume_controller.go:365` 他) と ublk frontend (`k8s/pkg/apis/longhorn/v1beta2/volume.go:257`) が入っている

## アーキテクチャの素材

トップレベル構成 (longhorn-manager, ディレクトリ単位):

- `main.go` / `app/`: CLI エントリと各サブコマンド。`app/daemon.go` が manager 常駐モードの起点
- `k8s/pkg/apis/longhorn/v1beta2/`: 全 CRD 型定義 (Volume / Engine / Replica / Node / InstanceManager / Snapshot / Backup 系 / ShareManager / BackingImage 系 / EngineImage / RecurringJob / Orphan ほか)。`register.go` で scheme 登録
- `controller/`: 中核。CRD 1 つにつき controller 1 つ (`controller/controller_manager.go:43-185` で 30+ を生成、`:191-228` で各々 `go ...Run()`)
- `datastore/`: informer cache と typed client の薄いラッパ。controller は k8s API を直接叩かず `c.ds.*` 経由
- `scheduler/`: `replica_scheduler.go`。レプリカをノード/ディスクに配置する純ロジック
- `engineapi/`: data plane への gRPC/バイナリ越しのクライアント。`instance_manager.go` が longhorn-instance-manager の `InstanceServiceClient` / `ProcessManagerClient` を保持 (`engineapi/instance_manager.go:55-56`, import は `longhorn/longhorn-instance-manager/pkg/client` を `engineapi/instance_manager.go:16`)
- `csi/`: CSI driver 実装。`webhook/`: admission/conversion webhook。`upgrade/`: バージョン間マイグレーション

分散オーナーシップ (非自明、重要):
longhorn-manager は全ノードに DaemonSet で 1 pod ずつ動く。単一の active controller を leader 選出するのではなく、CR ごとに `Status.OwnerID` を持ち、各 manager は自分が責任を持つ CR だけ reconcile する。`VolumeController.syncVolume` 冒頭で `isResponsibleFor` を呼び、false なら即 return (`controller/volume_controller.go:334-340`)。owner は基本ボリュームの attach 先ノード (`v.Spec.NodeID`) に寄せる。RWX が delinquent な時は share manager の owner ノードへ素早く付け替える (`controller/volume_controller.go:5965` 以降 `isResponsibleFor`)。これでデータ局所性 (engine と同じノードの manager が world を制御) を保ちつつ高可用を成立させる。

代表操作の end-to-end トレース = ボリューム作成 (PVC からレプリカ/エンジンプロセス起動まで):

1. CSI 経由で `Volume` CR (`k8s/pkg/apis/longhorn/v1beta2/volume.go:454`) が作られる。`VolumeController.processNextWorkItem` (`controller/volume_controller.go:252`) から `syncVolume` (`:307`) が拾う
2. `syncVolume`: namespace チェック、`c.ds.GetVolume` (`:320`)、`isResponsibleFor` で自分担当か判定 (`:334`)、owner 未設定なら自ノードを `Status.OwnerID` に書く (`:342-353`)、engine / replica / engineFrontend / snapshot を list (`:355-374`)。deletion 中なら teardown 分岐 (`:376-533`、v2 は engineFrontend から engine から replica の順に段階削除)
3. `syncVolume` 本体 (`:603-663`): `handleVolumeAttachmentCreation` から `ReconcileEngineReplicaState` (`:607`)、各種 setting 同期、`ReconcileVolumeState` (`:655`)、`cleanupReplicas` (`:659`)。最後に defer (`:550-601`) が spec を比較して engine/replica/volume の更新を一括 flush し、conflict なら requeue
4. レプリカ補充: `replenishReplicas` (`controller/volume_controller.go:3066`)。`v.Spec.NumberOfReplicas` に満たない分を作る。まず失敗レプリカの再利用を試み (`scheduler.CheckAndReuseFailedReplica` `:3118`)、無ければ `RequireNewReplica` (`:3142`) を経て `newReplicaCR` (`:3143`) で新規 Replica CR を生成
5. スケジューリング: `scheduler/replica_scheduler.go:66` `ScheduleReplica` から `FindDiskCandidates` (`:138`)、`getNodeCandidates` (`:213`, anti-affinity / zone / node selector を評価)、`getDiskCandidates` (`:301`)、`scheduleReplicaToDisk` (`:673`) でディスクを確定し `Replica.Spec.NodeID/DiskID` を埋める
6. プロセス起動: Replica/Engine CR は各々 `ReplicaController` / `EngineController` が拾い、共通の `InstanceHandler.ReconcileInstanceState` (`controller/instance_handler.go:324`) に委譲。`EngineController.Reconcile` も `ec.instanceHandler.ReconcileInstanceState` を呼ぶ (`controller/engine_controller.go:373`)
7. 実体生成: `InstanceHandler.createInstance` (`controller/instance_handler.go:544`) から controller の `CreateInstance` (`controller/engine_controller.go:630`)、`engineapi.NewInstanceManagerClient(im, false)` (`:655`)、`c.EngineInstanceCreate(...)` (`:718`) で longhorn-instance-manager に gRPC を投げ、当該ノード上に engine/replica プロセスを起動。ここで control plane (manager) から data plane (instance-manager から engine/replica) へ越境する

設計判断:

- microservice per volume: 共有プールではなく 1 ボリューム = 1 engine + N replica を独立プロセスで立てる。爆発半径をボリューム単位に閉じ込め、ボリュームごとに独立アップグレード/スケジューリングできる。代償はボリューム数に比例したプロセス数とオーバヘッド
- CRD は state machine: VolumeSpec が desired、VolumeStatus が observed。controller は spec/status を比較し data plane を収束させる reconcile ループ。実 I/O は longhorn-engine が担い、manager はそれを宣言的にオーケストレーションする
- datastore 抽象: controller は k8s client を直接持たず `datastore.DataStore` 経由 (informer cache と typed client)。test 時のモック差し替えと cache 一貫性を両立

## 内部実装の素材

中核データ構造 (全て `k8s/pkg/apis/longhorn/v1beta2/`):

- `Volume` (`volume.go:454`): ユーザが触る最上位 CRD。`VolumeSpec` (`volume.go:251`) に `Size` / `NumberOfReplicas` (`:320`) / `Frontend` (`:256`, blockdev/iscsi/ublk) / `DataEngine` (`:336`, v1 か v2) / `DataLocality` / `AccessMode` (RWO/RWX) / `Migratable` / `Encrypted` / anti-affinity 群。`VolumeStatus` (`volume.go:378`) に `OwnerID` / `State` / `Robustness` / `Conditions`
- `Engine` (`engine.go:241`): ボリューム 1 つの "controller" (data plane の単一フロントエンド)。`InstanceSpec`/`InstanceStatus` を内包し、`Status.ReplicaModeMap` で各レプリカの RW/ERR 状態を持つ。reconcile はこの map を読んでレプリカ健全性を判断 (`controller/volume_controller.go:744` `ReconcileEngineReplicaState`)
- `Replica` (`replica.go:108`, spec は `replica.go:23`): 1 レプリカ = 1 プロセス。`Spec.NodeID`/`DiskID`/`DataPath` で配置先を持つ。`InstanceSpec` を共有
- `InstanceManager` と `InstanceSpec`/`InstanceStatus` (`instancemanager.go:87`/`:108`): ノードごとに動く longhorn-instance-manager pod を表す CRD。engine/replica プロセスはこの pod 内で起動される。`InstanceSpec` は engine と replica の両方が埋め込む共通の起動仕様
- `Node` (`node.go`): Longhorn から見たノードとディスク。scheduler が `Node.Spec.Disks` の容量/予約/タグを読んでレプリカ配置を決める

追う価値があったパス: `replenishReplicas` (`controller/volume_controller.go:3066`) の失敗レプリカ再利用。新規作成の前に必ず `CheckAndReuseFailedReplica` を試し、再利用時は backoff (`c.backoff.IsInBackOffSinceUpdate` `:3124`) を挟む。ノード一時障害で剥がれたレプリカを全コピーし直さず再同期で復帰させるための最適化で、`RebuildRetryCount` (`:3130`) で無限再利用を抑える。

驚いた点 / 非自明:

- レプリカ補充は基本 1 個ずつ (`controller/volume_controller.go:3114-3116`)。`getRebuildingReplicaCount(e) != 0` なら即 return (`:3100`)。複数同時 rebuild で I/O を食い潰さないため、健全レプリカからの逐次再構築に倒している
- engine status が同期するまで補充を保留する明示的ガード (`hasEngineStatusSynced` `:3096`)。レプリカ IP 重複バグ (longhorn/longhorn#687) の回避策で、コメントに issue URL が直書きされている
- v2 (SPDK) data engine の teardown は engineFrontend から engine(raid bdev) から replica(replica bdev) の厳密な順序で、各層が完全に消えるまで次に進まない (`controller/volume_controller.go:400-473`)。`spdk_tgt` の "no such device" を避けるためで、v1 の単純削除と大きく異なる

## 採用事例の素材

CNCF Incubator 昇格ブログ (2021-11-04) に明記された本番採用組織 (出典: <https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/>):

- Cerner: 医療情報 IT 企業。永続ストレージと高可用なデータレプリケーションに Longhorn を利用
- Tribunal Regional Eleitoral do Pará: ブラジル・パラ州の選挙裁判所。Prometheus 等のストレージバックエンドに Longhorn を使用
- Tyk: OSS の API/サービス管理基盤。動的プロビジョニングされる数百のクラスタノードを Longhorn で裏付け

数値シグナル (2026-06-24 取得):

- `longhorn/longhorn`: GitHub stars 7,805 / forks 712 (`gh repo view`、pushedAt 2026-06-24)。contributors はおよそ 162 (`gh api .../contributors?per_page=1&anon=true` の last page)。longhorn org は 41 repo (`gh api orgs/longhorn/repos`)
- CNCF 昇格時点 (2021-11) で稼働ノード 34,000+、SUSE エンジニアは後に 35,000 active node と発言。出典: <https://www.altoros.com/blog/longhorn-provides-persistent-storage-for-35000-kubernetes-nodes/>
- 個別 repo star: longhorn-engine 386 / longhorn-manager 211 / longhorn-instance-manager 27 (`gh repo view`、2026-06-24)。コミュニティ計測は傘 repo に集約される点に注意

正直な注記: 全採用が成功談ではない。Replicated は kURL の標準ストレージから Longhorn を外した (drive corruption / mount 失敗 / reboot 後の復旧不能を Longhorn 起因と分析)。出典: <https://www.replicated.com/blog/why-replicated-has-moved-away-from-recommending-longhorn-for-kurl-storage>。本番では専用ディスク利用やレプリカ数調整などチューニング前提という指摘もある。出典: <https://cloudcasa.io/blog/longhorn-on-production-clusters-storage-configuration-tuning-and-gotchas>

## 代替・エコシステム

- 統合先: Kubernetes CSI (動的プロビジョニング/スナップショット/expansion)、RWX は内蔵 NFS share manager 経由、バックアップは S3/NFS ターゲット、Prometheus メトリクス、Velero 連携、Rancher/SUSE Rancher Prime からのワンクリック導入
- data plane の兄弟 repo: longhorn-engine (v1 の実ストレージコントローラ、"World's smallest storage controller")、longhorn-instance-manager (engine/replica プロセスを起動する per-node gRPC サービス)、SPDK ベースの v2 engine 系
- 代替と本質的な差:
  - Rook/Ceph: block と file と object を 1 製品で出せる代わりに CRUSH map/PG の学習コストと CPU オーバヘッドが最大。Longhorn は block 専業で運用がシンプル、edge/中規模向け
  - OpenEBS: Mayastor (NVMe-oF/SPDK で高速) と cStor/Jiva (簡易) を選べる。Longhorn は単一製品でレプリカ管理を全部内製
  - Portworx: 商用。アプリ認識スナップショットや DR が強いがライセンス費用
  - 出典: <https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025>
- 最小セットアップ: `kubectl create -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml` で `longhorn-system` namespace に manager / instance-manager / CSI / UI をデプロイ (`README.md` の Deployment 節)。前提として各ホストに `open-iscsi` (iscsiadm) と NFS client、mount propagation 有効化、ext4/XFS の file extents が必要 (`README.md` Requirements)。導入前に `environment_check.sh` で要件確認。出典: <https://longhorn.io/docs/latest/deploy/install/>
