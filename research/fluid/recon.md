# recon: Fluid

調査メモ。Fluid は Kubernetes 上で「データセット」を一級リソースに昇格させ、分散キャッシュ (Alluxio / JuiceFS / Vineyard など) を運用・高速化する Operator。出典は末尾の sources.md と対応。

## 基本情報

- repo: [fluid-cloudnative/fluid](https://github.com/fluid-cloudnative/fluid)
- pinned commit: `25531595e9233cb9340a3c544eb284b400b82d50` (committer date 2026-06-23) / 近いタグ: `v1.0.8` (2025-10-30, この commit より前の最新リリース。HEAD は master で v1.0.8 より先)
- 言語 / ビルド: Go (`go 1.24.12`, `go.mod:2`) / `make` で `go build cmd/<comp>/main.go` を各バイナリごとに実行 (`Makefile:214-256`)
- ライセンス: Apache-2.0 (`LICENSE:1-4` に Apache License Version 2.0、モジュールは `github.com/fluid-cloudnative/fluid`、GitHub API も `apache-2.0`)
- CNCF 成熟度: Incubating (2026 昇格、後述)
- カテゴリ (報告用): Storage & Database

## 成果物 (ビルドされるバイナリ)

`cmd/` 配下に複数の main がある。1 リポジトリで複数の controller/プラグインをビルドする構成。

- `cmd/dataset/main.go`: dataset-controller (Dataset CRD と各 Runtime をまとめて reconcile するメインコントローラ)
- `cmd/alluxio`, `cmd/juicefs`, `cmd/jindo`, `cmd/thin`, `cmd/vineyard`, `cmd/efc`, `cmd/cache`: 各キャッシュエンジン用 runtime controller
- `cmd/csi/main.go`: fluid-csi (CSI ドライバ。FUSE マウントを Pod に渡す)
- `cmd/webhook/main.go`: fluid-webhook (mutating admission。データアフィニティ等を Pod に注入)
- `cmd/fluidapp/main.go`: application-controller

エントリポイントは cobra コマンド。例: `cmd/dataset/main.go:27` が `app.NewDatasetCommand()` を `Execute()`。

## アーキテクチャの素材

Kubernetes Operator パターン。中心は CRD 群と「Engine 抽象」。

CRD (`api/v1alpha1/`):

- `Dataset` (`dataset_types.go:301`): ユーザが向き合う主リソース。`Mounts` (UFS = under file system のマウント点)、`NodeAffinity`、`Runtimes` を持つ。`status.phase` は `Bound`/`NotBound`/`Failed`/`Updating`/`DataMigrating` (`dataset_types.go:36-51`)。
- 各種 Runtime: `AlluxioRuntime`, `JuiceFSRuntime`, `JindoRuntime`, `ThinRuntime`, `VineyardRuntime`, `EFCRuntime`, `CacheRuntime` (`api/v1alpha1/*runtime_types.go`)。Dataset と同名の Runtime を作るとバインドされる。
- データ操作 CRD: `DataLoad`, `DataBackup`, `DataMigrate`, `DataProcess` (`api/v1alpha1/data*_types.go`)。

Engine 抽象 (`pkg/ddc/`):

- `base.Engine` インターフェース (`pkg/ddc/base/engine.go:32-56`): `Setup` / `Sync` / `CreateVolume` / `DeleteVolume` / `Shutdown` / `Validate` を定義。
- `base.Implement` インターフェース (`pkg/ddc/base/engine.go:69-155`): 各エンジンが実装すべき細粒度メソッド群 (`SetupMaster` / `SetupWorkers` / `CheckMasterReady` / `BindToDataset` / `PrepareUFS` など)。`TemplateEngine` がこの Implement を埋め込んでテンプレートメソッドパターンで駆動する。
- 実装: `pkg/ddc/alluxio`, `pkg/ddc/juicefs`, `pkg/ddc/jindocache` ほか。`pkg/ddc/factory.go` がランタイム種別から engine を生成。

コントローラの土台 (`pkg/controllers/runtime_controller.go`):

- 各 runtime controller (例 `pkg/controllers/v1alpha1/alluxio/alluxio_runtime_controller.go:75`) は共通の `RuntimeReconciler` (`pkg/controllers/runtime_controller.go:79` の `ReconcileInternal`) に委譲する。
- 共通ユーティリティ `pkg/ctrl/` (master.go / worker.go / fuse.go / affinity.go) が StatefulSet/DaemonSet のレプリカ・アフィニティを扱う。

データ消費の経路: dataset-controller が PV/PVC を作る (`engine.CreateVolume`) → アプリ Pod がその PVC を mount → fluid-csi の `NodePublishVolume` (`pkg/csi/plugins/nodeserver.go:67`) がキャッシュ FUSE をターゲットパスへ bind mount。webhook が Pod にデータアフィニティ (キャッシュのある node へ寄せる) を注入する。

## 内部実装の素材: 代表操作を端から端まで

題材: 「Dataset + AlluxioRuntime を作ると、キャッシュシステムが立ち上がり Dataset が Bound になる」。

1. AlluxioRuntime の調整要求が来る。`RuntimeReconciler.Reconcile` (`pkg/controllers/v1alpha1/alluxio/alluxio_runtime_controller.go:75`) がランタイムを load し、`ctx.EngineImpl` を決めて共通 reconcile へ。

   ```go
   ctx.EngineImpl = ddc.InferEngineImpl(runtime.Status, common.AlluxioEngineImpl)
   return r.ReconcileInternal(ctx)
   ```

2. `ReconcileInternal` (`pkg/controllers/runtime_controller.go:79`) が engine を取得し (`GetOrCreateEngine`, :101)、同名 Dataset を取得 (`GetDataset`, :114)。Dataset が無ければ 5 秒後に requeue (:177)。`CanbeBound` で他ランタイムに既にバインド済みでないか確認 (:150)。OwnerReference と Finalizer を付けて `ReconcileRuntime` へ (:181)。

3. `ReconcileRuntime` (`pkg/controllers/runtime_controller.go:254`) が `engine.Validate` → `engine.Setup` → `engine.CreateVolume` → `engine.Sync` を順に呼ぶ。Setup 未完なら 20 秒後 requeue (:283-285)。

   ```go
   if !utils.IsSetupDone(ctx.Dataset) {
       ready, err := engine.Setup(ctx)
       // ...
       if !ready { return utils.RequeueAfterInterval(20 * time.Second) }
   }
   ```

4. `TemplateEngine.Setup` (`pkg/ddc/base/setup.go:25`) がテンプレートメソッドで段階実行: `ShouldSetupMaster`→`SetupMaster` (:42-52) → `CheckMasterReady` (:55) → `ShouldCheckUFS`→`PrepareUFS` (:65-77) → `ShouldSetupWorkers`→`SetupWorkers` (:80-93) → `CheckWorkersReady` (:96) → `CheckAndUpdateRuntimeStatus` (:107) → `BindToDataset` (:119)。すべて満たして `ready = true` (:126)。

5. Alluxio 実装の `SetupMaster` (`pkg/ddc/alluxio/master.go:75`): master StatefulSet が無ければ `setupMasterInternal` (`pkg/ddc/alluxio/master_internal.go:32`) へ。ここが核心の設計判断 (下記)。Runtime spec から Helm の values を生成し (`generateAlluxioValueFile`, :42)、Helm リリースが未インストールなら install。

   ```go
   chartName := utils.GetChartsDirectory() + "/" + common.AlluxioChart
   // ...
   return helm.InstallRelease(e.name, e.namespace, valueFileName, chartName)
   ```

6. `helm.InstallRelease` (`pkg/utils/helm/utils.go:44`) は Go の helm SDK を使わず、`ddc-helm` という外部バイナリを `exec` する。`var helmCmd = []string{"ddc-helm"}` (:41)、`args := []string{"install", "-f", valueFile, "--namespace", namespace, name, chartName}` (:60)、`cmdguard.Command(...).CombinedOutput()` (:69-75)。失敗時は `DeleteReleaseIfExists` でロールバック (:82)。これで master/worker StatefulSet と FUSE DaemonSet が実際に展開される。

7. 全 worker ready 後 `BindToDataset` が Dataset の `status.phase` を `Bound` に更新。以後 `engine.Sync` が定期的にキャッシュ容量・ヒット率を `status.cacheStates` に反映する。

## 中核データ構造 (3-5)

- `Dataset` / `DatasetSpec` / `DatasetStatus` (`api/v1alpha1/dataset_types.go:126,195,301`): `Mounts []Mount`, `NodeAffinity`, `status.phase`, `status.cacheStates`, `OperationRef map[string]string` (同一 Dataset への同種データ操作の排他ロック, :230)。
- `Mount` (`api/v1alpha1/dataset_types.go:80`): UFS のマウント定義。`MountPoint`, `Options`, `EncryptOptions` (Secret 参照で資格情報を渡す, :112)。
- `base.Engine` / `base.Implement` (`pkg/ddc/base/engine.go:32,69`): エンジン抽象。Implement の細粒度メソッドを TemplateEngine が呼ぶテンプレートメソッドパターン。新エンジン追加はこの Implement を満たすだけ。
- `cruntime.ReconcileRequestContext` (`pkg/runtime/context.go:31`): reconcile 1 回分の文脈。`Dataset`/`Runtime`/`Client`/`Log`/`EngineImpl` を 1 構造体に束ねて引き回す。embed フィールド多用 (context, NamespacedName, Category, `*Dataset`, Client)。
- `AlluxioRuntimeSpec` (`api/v1alpha1/alluxioruntime_types.go:172`): `Master`/`Worker`/`Fuse` の `AlluxioCompTemplateSpec`, `TieredStore` (メモリ/SSD/HDD の階層キャッシュ), `Properties map[string]string` (Alluxio 設定の素通し)。
- `common.CacheStateList = map[CacheStateName]string` (`pkg/common/types.go:34`): cached / cacheCapacity / cachedPercentage / cacheHitRatio を文字列マップで保持。

## 非自明な設計判断

Fluid のコントローラはキャッシュシステムの Pod/StatefulSet/DaemonSet を **Go クライアントで直接 apply せず**、Runtime CRD から Helm values を生成して `ddc-helm` 外部バイナリを `exec` し Helm chart を install する (`pkg/utils/helm/utils.go:41,44,60` と `pkg/ddc/alluxio/master_internal.go:32-57`)。`charts/` 配下に alluxio/juicefs/jindo 等の chart を同梱。利点はキャッシュエンジンごとの複雑なマニフェストを chart に閉じ込め、エンジン追加を「chart + Implement 実装」で済ませられること。代償として実行環境に helm バイナリ (`ddc-helm`) が必要で、失敗時は出力パースとロールバックを自前で書いている。

## 歴史の素材

- 2020-09: Nanjing University + Alibaba Cloud + Alluxio コミュニティが発端 (CNCF blog)。repo 最初のリリース `v0.1.0` は 2020-08-30 (GitHub Releases API)。
- 2021: CNCF Sandbox 入り。CNCF プロジェクトページは「accepted to CNCF on April 28, 2021」、昇格 blog は「sandbox: May 2021」と記す (どちらも 2021 年。TOC 受理日と告知月の差と思われる)。
- 2024-12: CNCF 2024 Technology Landscape Radar で "Adopt" 区分 (昇格 blog)。
- 2026: CNCF Incubating 昇格。CNCF プロジェクトページは「moved to Incubating on January 8, 2026」、CNCF blog の告知は 2026-03-24。
- リリース: 最新タグ `v1.0.8` (2025-10-31 公開, GitHub Releases API)。v1.0.8 で ThinRuntime 経由の 3FS / Curvine ストレージ対応を追加。

## 採用事例の素材 (出典付き、捏造なし)

CNCF 昇格 blog が名指しする adopter: Xiaomi, Alibaba Group, NetEase, China Telecom, Horizon, Weibo, Bilibili, 360, Zuoyebang, Inceptio Technology, Huya, OPPO, Unisound, DP Technology, JoinQuant。

repo の `ADOPTERS.md` でも Production フェーズとして記載: Alibaba Cloud PAI (Deep Learning Containers), Weibo, bilibili, Qihoo 360, Huya, OPPO, Inceptio, Metabit Trading, DPTechnology, JoinQuant, liblibai, HappyElements, 网易互娱(NetEase Games), 天翼云(China Telecom Cloud) ほか。Testing/Staging に Tencent Cloud, Baidu AI Cloud, Xiaomi など。

## 採用シグナル (数値 + 取得日 2026-06-24)

- GitHub stars: 1,942 / forks: 1,265 (GitHub API, 2026-06-24)。CNCF blog は "1.9k stars" と一致。
- contributors: CNCF blog は 979 (DevStats ベース、ドキュメント等含む all-time と思われる)。GitHub contributors API では約 480 (2026-06-24)。
- リリース数: CNCF blog "28 releases"。

## 代替・エコシステム

- 統合先 (キャッシュ/ストレージエンジン): Alluxio, JuiceFS, JindoFS/JindoCache (Alibaba), Vineyard (v6d.io, インメモリ中間データ), EFC (Alibaba 弾性ファイルキャッシュ), ThinRuntime 経由で 3FS / Curvine など。UFS は S3/OSS/HDFS/NFS 等。
- 連携: Kubernetes scheduler (データアフィニティ), CSI, Prometheus (メトリクス), Arena/KubeDL 等の AI 学習ジョブ管理。
- 代替・隣接: 素の CSI ドライバ + Alluxio/JuiceFS を手運用する構成 (Fluid は CRD で宣言的に統一)。クラウドの CSI (EFS/FSx/OSS) は永続ストレージを提供するが、Fluid の本質は「リモートデータの node ローカルキャッシュ + データアフィニティスケジューリング + マルチエンジン抽象」で、ストレージ実装そのものではなくオーケストレーション層である点が差。

## install + 最小構成

- Helm でインストール: chart リポジトリ `https://fluid-cloudnative.github.io/charts` を add し `helm install fluid fluid/fluid -n fluid-system --create-namespace` (公式ドキュメント)。CRD と各 controller / csi / webhook が入る。
- 最小動作: (1) `Dataset` を作る (mounts に S3/OSS などの UFS を記載)、(2) 同名の `AlluxioRuntime` (または JuiceFSRuntime 等) を作る → Dataset が `Bound` になり PVC が生える、(3) アプリ Pod でその PVC を mount すると FUSE 経由でキャッシュ付きアクセス。`samples/` に例あり。
- 任意でデータのプリフェッチ: `DataLoad` CRD を作るとキャッシュにデータを先読み。
