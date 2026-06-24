# recon: KEDA

調査メモ。KEDA (Kubernetes-based Event Driven Autoscaling)。HPA を補完してイベント駆動 + 0 スケールを実現する CNCF Graduated プロジェクト。出典は `sources.md` の番号で参照。

## 基本情報

- repo: `kedacore/keda` (canonical)。周辺リポは `kedacore/keda-docs`, `kedacore/http-add-on`, `kedacore/governance` 等。コア実装は `kedacore/keda`。
- pinned commit: `c5b577cd882d7a4572787e48868ed6a82da91369` (2026-06-19, `fix(scaling): guard GetCurrentReplicas against nil ScaleTargetGVKR (#7661)`)
- 近いタグ: `v2.20.1` (2026-06-08 release)。pin は main 上で v2.20.1 の約 11 日先。pin 自体にはタグ無し。
- 言語 / ビルド: Go (`go 1.26.0`, `go.mod:3`) / `make build` (`Makefile:211` = manager + adapter + webhooks の 3 バイナリ)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭に Apache License 2.0、確認済み)
- CNCF 成熟度: Graduated (2023-08-22, 出典 [4] と [6])
- カテゴリ: Orchestration & Scheduling
- 規模: Go 約 54k LOC (`pkg controllers apis cmd`、test 除く)。scaler は 70+ 種 (`pkg/scaling/scalers_builder.go` の case 約 78、cpu/memory/external/cron 等の内蔵含む)。

## 歴史の素材

- 2019: Microsoft と Red Hat の共同 OSS として開始。サーバーレス/イベント駆動コンテナを K8s 上で動かす狙い ([4])。repo 作成は 2019-02-13 (`gh repo view` createdAt)。
- 2020-03-12: CNCF Sandbox 受理 ([4])。
- 2021-08-18: Incubating 昇格 (出典 [4] と [6])。
- 2023-08-22: Graduated 昇格。CNCF 公式アナウンス ([4])、プロジェクト側ブログ ([6])。
- v2 系で metrics adapter とコントローラを分離する設計を経て、現行も 2 コンポーネント構成 (後述)。

## アーキテクチャの素材

3 バイナリ構成。`make build` が manager(operator)/adapter/webhooks をビルド (`Makefile:211`)。

- **Operator (controller manager)**: `cmd/operator/main.go`。ScaledObject / ScaledJob / TriggerAuthentication 等の reconcile と、実際のスケーリング判断 + 0 スケール処理を担う。同プロセス内で gRPC の Metrics Service サーバを起動する (`cmd/operator/main.go:355` `metricsservice.NewGrpcServer(&scaledHandler, ...)`)。
- **Metrics Adapter**: `cmd/adapter/main.go`。Kubernetes External Metrics API (custom-metrics-apiserver) を実装し、HPA からのメトリクス問い合わせを受ける。自前で値を計算せず operator の gRPC へ委譲する (`cmd/adapter/main.go:115` `metricsservice.NewGrpcClient`, `:126` `NewProvider`)。
- **Admission Webhooks**: `cmd/webhooks/main.go`。ScaledObject/ScaledJob 等のバリデーション。

代表オペレーション = 「HPA がメトリクスを取りに来てから値が返るまで」の end-to-end:

1. HPA が External Metrics API を叩く → adapter の `KedaProvider.GetExternalMetric` (`pkg/provider/provider.go:75`)。label selector から `scaledobject.keda.sh/name` を抽出 (`provider.go:99`)。
2. adapter は値を計算せず gRPC で operator に転送: `p.grpcClient.GetMetrics(ctx, scaledObjectName, namespace, info.Metric)` (`pkg/provider/provider.go:107`)。接続未確立なら `WaitForConnectionReady` で待つ (`:87`)。
3. operator 側 gRPC ハンドラ → `scaleHandler.GetScaledObjectMetrics` (`pkg/scaling/scale_handler.go:585`)。ScalersCache を引き (`:590`)、各 trigger の scaler を goroutine で並列に回す (`:635` ループ + `:666` `wg.Add(1)`)。
4. 各 scaler は `Scaler` インターフェース (`pkg/scalers/scaler.go:44`) の `GetMetricsAndActivity` / `GetMetricSpecForScaling` を実装。具体 scaler は `buildScaler` の巨大 switch で type 文字列から生成 (`pkg/scaling/scalers_builder.go:123`、`case "apache-kafka"` 等)。
5. 値は `external_metrics.ExternalMetricValueList` で adapter → HPA に返り、HPA が 1→N のスケールを決める。

別系統で operator は **0↔1 / idle のスケールを直接行う** (HPA は最小 1 までしか落とせないため)。reconcile からの scale loop が `scaleExecutor.RequestScale` (`pkg/scaling/executor/scale_scaledobjects.go:40`) を回し、active なら `scaleFromZeroOrIdle` (`:76`)、inactive なら `scaleToZeroOrIdle` (`:104`) を呼ぶ。

ScaledObject reconcile 本体: `ScaledObjectReconciler.Reconcile` (`controllers/keda/scaledobject_controller.go:155`) → `reconcileScaledObject` (`:231`)。流れは pause 判定 (`:240`) → scaleTarget が scalable か確認 (`:280` `checkTargetResourceIsScalable`) → trigger 検証 (`:290`) → `ensureHPAForScaledObjectExists` で HPA 作成/更新 (`:301`) → generation 変化時に `requestScaleLoop` で scale loop 起動 (`:318`)。

## 内部実装の素材

重要ディレクトリ:

- `apis/keda/v1alpha1/`: CRD 型 (ScaledObject, ScaledJob, TriggerAuthentication, ClusterTriggerAuthentication, ScaleTriggers)。
- `controllers/keda/`: 各 CRD の reconciler と HPA 管理 (`hpa.go`)。
- `pkg/scaling/`: scale handler、executor、scalers cache、resolver、modifiers。スケーリングの頭脳。
- `pkg/scalers/`: 70+ の個別 scaler 実装。
- `pkg/provider/`: metrics adapter が使う External Metrics provider。
- `pkg/metricsservice/`: operator と adapter 間の gRPC。

中核データ構造:

- `ScaledObject` / `ScaledObjectSpec` (`apis/keda/v1alpha1/scaledobject_types.go:45`, `:102`)。`ScaleTargetRef`, `MinReplicaCount`(`:118`), `MaxReplicaCount`(`:121`), `IdleReplicaCount`(`:115`), `Triggers []ScaleTriggers`(`:126`)。
- `ScaleTriggers` (`apis/keda/v1alpha1/scaletriggers_types.go:28`)。`Type`(`:30`), `Metadata map[string]string`(`:36`), `AuthenticationRef`(`:38`), `MetricType`(`:40`), `UseCachedMetrics`(`:34`)。1 ScaledObject に複数 trigger。
- `Scaler` インターフェース (`pkg/scalers/scaler.go:44`): `GetMetricsAndActivity` / `GetMetricSpecForScaling` / `Close`。`PushScaler` (`:57`) は `Run(ctx, active chan<- bool)` を足したプッシュ型。全 scaler の共通契約。
- `ScalersCache` (`pkg/scaling/cache/scalers_cache.go:43`): ScaledObject ごとに scaler 群を保持。`Scalers []ScalerBuilder`, `ScalableObjectGeneration`, `CompiledFormula *vm.Program` (scaling modifiers の式)。`ScalerBuilder` (`:92`) は scaler + config + 再生成用 `Factory` を持つ。
- `TriggerAuthenticationSpec` (`apis/keda/v1alpha1/triggerauthentication_types.go:75`): `PodIdentity`, `SecretTargetRef`, `HashiCorpVault`, `AzureKeyVault` 等、認証情報の解決元。

非自明な設計判断:

- **operator と metrics adapter の分離 + gRPC 委譲**。adapter は External Metrics API サーバを名乗るが値は持たず、`GetMetrics` で operator に丸投げする (`pkg/provider/provider.go:107`)。スケーリング状態を operator に一元化し、adapter をステートレスに保つため。
- **0↔1 は HPA でなく operator が直接やる**。HPA は最小 1 までしか落とせない仕様なので、activation/deactivation を `RequestScale` の分岐 (`scale_scaledobjects.go:73-117`) で operator が肩代わりし、1→N は HPA に任せる。この役割分担が KEDA の肝。
- **`ScalersCache.acquireReader` の ReaderDrainBudget** (`pkg/scaling/cache/scalers_cache.go:56-90`)。ctx を無視するサードパーティ SDK で reader が固まっても、タイマーで activeReaders スロットを強制解放し `cache.Close()` がブロックしないようにする防御。コードを読まないと見えない配慮。

エントリポイント: operator=`cmd/operator/main.go` (`func main` `:69`), adapter=`cmd/adapter/main.go` (`:226`), webhooks=`cmd/webhooks/main.go`。

## 採用事例の素材

CNCF Graduation アナウンス ([4]) が本番採用組織として明記:

- FedEx
- Grafana Labs
- KPMG
- Reddit
- Xbox
- Zapier

「45 以上の組織が本番採用」「scaler 60+」「認証プロバイダ 9」とも記載 ([4])。リポ内に `ADOPTERS.md` は無く、採用者リストは keda.sh / keda-docs 側で管理 (`README.md:66-68`)。

採用シグナル (2026-06-22 時点, `gh api repos/kedacore/keda`):

- GitHub stars: 10,310
- forks: 1,441
- contributors: 約 455 (contributors API last page, per_page=1)

## 代替・エコシステム

- **エコシステム / 統合**: HPA (External Metrics API 経由でネイティブ統合)、Prometheus / Kafka / RabbitMQ / NATS / AWS SQS,Kinesis,CloudWatch / Azure Service Bus,Event Hub,Queue / GCP Pub/Sub 等 70+ scaler。認証は `TriggerAuthentication` + Vault/Azure Key Vault/Pod Identity。OpenShift は KEDA を Custom Metrics Autoscaler としてダウンストリーム同梱 (`openshift/kedacore-keda`)。HTTP ワークロード向けに `kedacore/http-add-on`。
- **代替**:
  - 素の Kubernetes HPA + custom/external metrics adapter (Prometheus Adapter 等): KEDA は scaler を内蔵し 0 スケールに対応する点が差。
  - Knative Serving: HTTP/リクエスト駆動の 0 スケールに強いが、汎用イベントソース対応は KEDA が広い。
  - Karpenter / Cluster Autoscaler: こちらはノードスケール。KEDA は Pod スケールでレイヤーが違う (併用可)。
  - クラウド固有のオートスケーラ (各社マネージド): ベンダーロックインに対し KEDA はベンダー中立 ([4])。

## タグライン案

- EN: Event-driven autoscaling for Kubernetes, including scale-to-zero, by feeding any external event source into the HPA.
- JA: 任意の外部イベントソースを HPA に橋渡しし、ゼロスケールまで含めた Kubernetes のイベント駆動オートスケールを実現する。
