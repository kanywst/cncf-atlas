# recon: Carina

調査メモ。出典は URL 付き。コードは clone (`research/carina/src`) を実際に開いて `path:line` で確認した。

## 基本情報

- repo: `carina-io/carina` (<https://github.com/carina-io/carina>)
- pinned commit: `aec3a9f09d97d71af9dc2aa366494d1f0088708d` (2025-04-15) / 近いタグ: `v0.14.0`
- 言語 / ビルド: Go 1.19 (`go.mod:3`) / `make manager` でバイナリ、`make docker-build` でイメージ (`Makefile:37`, `Makefile:74`)
- ライセンス: Apache License 2.0 (`LICENSE:1` の `Apache License Version 2.0` を確認、GitHub API の `spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Sandbox (受理 2022-12-14、<https://www.cncf.io/projects/carina/>)
- カテゴリ: Storage & Database
- エントリポイント: `cmd/carina-node/main.go:27` (ノードエージェント) と `cmd/carina-controller/main.go` (コントロールプレーン)、`scheduler/cmd/main.go` (スケジューラ拡張)。CSI ドライバ名は `carina.storage.io` (`constants.go:23`)

CSI (Container Storage Interface、Kubernetes のストレージプラグイン規格) 準拠の LVM (Logical Volume Manager、Linux の論理ボリューム管理) ベースのローカルストレージ。分散ストレージではなく、各ノードのベアディスクをそのまま使う。

## 歴史の素材

- リポジトリ作成は 2021-08-18 (GitHub API `created_at`)。元は bocloud / BeyondCent の社内プロジェクト (ソースのコピーライトが `Copyright @ 2021 bocloud <fushaosong@beyondcent.com>`、例 `api/v1/logicvolume_types.go:2`)。
- 課題意識は README の Background に明記。ステートフルなDB/ミドルウェアがクラウドネイティブに移行する中で、分散ストレージはレプリケーションや整合性をアプリと二重に行い容量・性能を浪費する。Carina は「DB の隣でローカルディスクの生性能を出す」ことに振った (`README.md` Background 節)。
- CNCF Sandbox 受理は 2022-12-14 (<https://www.cncf.io/projects/carina/>)。オンボーディング issue は cncf/sandbox #204 と cncf/toc #974。
- 最新リリースは `v0.14.0` (2025-04-16、<https://github.com/carina-io/carina/releases>)。pin した commit はその直前。最終 push も 2025-04-16 で、それ以降ほぼ動いていない (後述、活動低下シグナル)。

## アーキテクチャの素材

3 コンポーネント構成 (README / deploy マニフェスト `deploy/kubernetes/` で確認)。

- carina-controller: クラスタ単位の CSI コントローラ。PVC を受けて `LogicVolume` CRD を作る。`pkg/csidriver/driver/controller.go`。
- carina-node: 各ノードの DaemonSet。自ノード宛の `LogicVolume` を reconcile し、実際に LVM/パーティション/ホストディレクトリを操作する。`controllers/logicvolume_controller.go` + `pkg/devicemanager/`。
- carina-scheduler: kube-scheduler のフレームワークプラグイン (Filter/Score)。ノードの空き容量で binpack / spreadout する。`scheduler/schedulerplugin/localstorage/storage-plugins.go`。

非自明な設計判断: **CSI コントローラは一切ディスクに触らない**。`controllerService.CreateVolume` (`pkg/csidriver/driver/controller.go:54`) はノード選定後 `LogicVolume` CRD を作って (`pkg/csidriver/driver/k8s/logicvolume_service.go:195`)、`.status.volumeID` が埋まるまで 100ms ポーリングするだけ (`logicvolume_service.go:210` の `for` ループ、`:224` で完了判定)。実際の `lvcreate` は対象ノードの carina-node が `LogicVolume` を見て実行する。**Kubernetes API server がコントローラとノードエージェント間のメッセージバス**になっている。ノードエージェントは `logicVolumeFilter` (`controllers/logicvolume_controller.go:356`、`:364` で `lv.Spec.NodeName == f.nodeName` 判定) で自ノード宛の CRD だけを拾う。この CRD 仲介パターンは TopoLVM 由来 (LVM ローカル CSI の同系統。README も同じ語彙)。

代表オペレーション (PVC → ローカル LV 作成) のエンドツーエンド:

1. `controllerService.CreateVolume` (`pkg/csidriver/driver/controller.go:54`)。access mode は `SINGLE_NODE_WRITER` のみ許可 (`:109`)。容量を GiB に切り上げ (`:115`, `convertRequestCapacity` は `controller.go:452`、`(requestBytes-1)>>30 + 1`)。
2. ノード/デバイスグループ選定。スケジューラ済みなら `HaveSelectedNode` (`:122`)、未定なら `SelectNode` で controller 側選定 (`:170`)。
3. `s.lvService.CreateVolume(...)` 呼び出し (`controller.go:192`)。
4. `LogicVolumeService.CreateVolume` (`pkg/csidriver/driver/k8s/logicvolume_service.go:161`) が `LogicVolume` オブジェクトを組み (`:164`)、finalizer を付け (`:182`)、`s.Create` (`:195`)。その後 `.status.volumeID` をポーリング (`:210`〜`:237`)。
5. 対象ノードの `LogicVolumeReconciler.Reconcile` (`controllers/logicvolume_controller.go:60`) が発火。`VolumeID == ""` なら `createLV` (`:74`)。`createLV` (`:153`) は annotation の volume type で分岐し、LVM 型なら `r.dm.VolumeManager.CreateVolume(lv.Name, lv.Spec.DeviceGroup, uint64(reqBytes), 1)` を最大 3 回リトライ (`:165`)。成功時 `lv.Status.VolumeID = carina.VolumePrefix + lv.Name` を書き status 更新 (`:178`, `:262`)。
6. `LocalVolumeImplement.CreateVolume` (`pkg/devicemanager/volume/volume.go:48`)。グローバルロック取得 (`:49`)、`VGDisplay` で VG 空き確認 (`:55`)、予約領域チェック `vgInfo.VGFree-size < DefaultReservedSpace-DefaultEdgeSpace` で足りなければ `ResourceExhausted` (`:65`)。最後に `v.Lv.LVCreateFromVG(name, vgName, size, ...)` (`:79`)。
7. `Lvm2Implement.LVCreateFromVG` (`pkg/devicemanager/lvmd/lvm.go:258`) が `lvcreate -n <lv> -L <GiB>g -W y -y ... <vg>` を組み立て、`lv2.Executor.ExecuteCommand("lvcreate", args...)` でシェル実行 (`:259`, `:274`)。容量は `size>>30` で整数 GiB 粒度。

ノード側はこの `NodeStorageResource` CRD に各ノードの VG / ディスク / RAID 状態を定期同期して publish し、controller/scheduler はそれを読んで容量判定する。`DeviceManager` (`pkg/devicemanager/manager.go:54`) が `VolumeManager` / `Partition` / `Host` の 3 実装を束ね (`:58`-`:61`)、`NewDeviceManager` で `lvmd.Lvm2Implement` 等に `exec.CommandExecutor` を注入 (`:67`, `:73`)。

スケジューリング: `LocalStorage.Score` (`scheduler/schedulerplugin/localstorage/storage-plugins.go:153`)。すでに PV が乗るノードは `MaxScore` (`:161`)。spreadout は `1.0 - request/allocatable` (`:200`)、binpack は `request/allocatable` (`:203`)。`Filter` は `:93`。

## 内部実装の素材

中核データ構造:

- `LogicVolume` CRD (`api/v1/logicvolume_types.go:63`、Spec は `:29`)。スコープは Cluster (`:60` `scope=Cluster,shortName=lv`)。Spec に `NodeName` / `Size` / `DeviceGroup` / `Pvc` / `NameSpace`、Status に `VolumeID` / `Code` (gRPC code) / `CurrentSize` / `DeviceMajor` / `DeviceMinor` (`:40`-`:50`)。1 PVC = 1 LogicVolume。`IsCompatibleWith` で同名同サイズの冪等性判定 (`:72`)。
- `NodeStorageResource` CRD (`api/v1beta1/nodestorageresource_types.go:65`、Status は `:36`)。各ノードの `Capacity` / `Allocatable` (`map[string]resource.Quantity`)、`VgGroups []api.VgGroup`、`Disks []api.Disk`、`RAIDs []api.Raid` を保持 (`:45`-`:55`)。スケジューラ/controller の容量判定の真実源。
- `api.VgGroup` (`api/api.go:4`) と `api.PVInfo` (`api/api.go:15`): LVM の VG/PV を Go 構造体化。`VGFree` (`:10`) が容量判定で効く。
- `api.Disk` (`api/api.go:25`): 物理ディスクのモデル。`Type` (HDD/SSD/NVMe)、`Attachment`、`Partitions`、`UdevInfo` を持つ。RAID 自動構築と自動階層化の入力。
- `DeviceManager` (`pkg/devicemanager/manager.go:54`): ノードエージェントの中枢。`VolumeManager` (LVM)、`Partition` (raw disk)、`Host` (hostPath) の 3 ボリュームタイプを切替える。`VolumeEvent` / `Trigger` (`:41`-`:52`) で容量再計算を notify する内部イベントバス。

3 つのボリュームタイプ (`createLV` の switch、`controllers/logicvolume_controller.go:163`):

- `LvmVolumeType`: VG から LVM ボリュームを切る (上記トレース)。
- `RawVolumeType`: ディスクにパーティションを切る (`r.dm.Partition.CreatePartition`、`:198`)。`exclusively-raw-disk` annotation で専有可。
- `HostVolumeType`: ホストディレクトリを使う (`r.dm.Host.CreateVolume`、`:231`)。

bcache による自動階層化: `cache-disk-ratio` パラメータがあると `CreateBcacheVolume` (`controller.go:472`) に分岐し、backend (大容量低速) と cache (小容量高速) の 2 つの LVM ボリュームを作って bcache で重ねる。cache は backend を owner にして連動削除 (`:557`)。ポリシーは writethrough/writeback/writearound (`:496`)。

## 採用事例の素材

- ADOPTERS ファイルは存在しない (`ls ADOPTERS*` でヒットなし)。引用可能な実名採用組織は未確認。捏造しない。
- GitHub シグナル (GitHub API、参照 2026-06-26): star 724、fork 86、contributors 約 20、open issues 40。最新リリース `v0.14.0` (2025-04-16)、最終 push も 2025-04-16。2025-04 以降コミットが止まっており活動低下が見える。
- OpenSSF Best Practices 登録あり (badge project 6908、`README.md` のバッジ)。FOSSA ライセンススキャンバッジも掲示。

## 代替・エコシステム

- 直接の同系統 (LVM ローカル CSI): TopoLVM (CRD 仲介 + スケジューラ拡張の元ネタとなった設計)、OpenEBS の LocalPV-LVM、HwameiStor。HwameiStor の比較表が OpenEBS / Carina / TopoLVM を同枠で並べている。
- 分散ストレージ (設計が別物): Rook/Ceph、Longhorn、CubeFS。これらはネットワーク越しレプリケーションで可用性を取りに行く。Carina は逆に「DB が自前でレプリケーションするのだから storage 層は生ディスク性能だけ出せ」という思想 (README Background)。
- 本質的な差別化点: (1) DB ワークロード特化を明言、(2) RAID 自動構築 (ディスク差すだけ)、(3) bcache ベースの自動階層化 (HDD+SSD を 1 つの storageclass に)、(4) ノードの容量だけでなく IO 性能も意識したスケジューリング、(5) LVM / raw partition / hostPath の 3 ボリュームタイプを 1 ドライバで提供。
- 統合先: 標準 CSI (`provisioner: carina.storage.io`、`deploy/kubernetes/storageclass-lvm.yaml:6`)、kube-scheduler framework plugin、Prometheus (`pkg/metrics`、`deploy/kubernetes/prometheus-service-monitor.yaml`)、Linux LVM2 / bcache カーネルモジュール。

## インストールと最小構成

前提 (README Running Environments): ノード OS は Linux、各ノードに 10GiB 超のベアディスク 1..N 本、fs は ext4/xfs、kubelet がコンテナ化されているなら `/dev:/dev` をマウント、bcache カーネルモジュール (無ければ FAQ 参照で yaml を修正)。

最小手順 (`deploy/kubernetes/deploy.sh` が実体):

1. リポジトリ取得とディレクトリ移動。

    ```bash
    git clone https://github.com/carina-io/carina.git
    cd carina/deploy/kubernetes
    ```

2. インストールスクリプト実行 (configmap / CRD / RBAC / controller / node / scheduler / storageclass を順に `kubectl apply`)。

    ```bash
    ./deploy.sh
    ```

3. 起動確認。

    ```bash
    kubectl get pods -n kube-system | grep carina
    ```

4. StorageClass は `csi-carina-sc` が入る (`provisioner: carina.storage.io`、`volumeBindingMode: WaitForFirstConsumer`、`allowVolumeExpansion: true`、`deploy/kubernetes/storageclass-lvm.yaml`)。PVC で `storageClassName: csi-carina-sc` を指定すれば、Pod スケジュール後にローカル LV が切られる。
