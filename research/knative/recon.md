# recon: Knative (Serving)

調査メモ。Knative は複数リポに分かれる (serving / eventing / func / client / networking)。deep-dive の主対象はサーバーレスの中核である `knative/serving`。本ファイルは serving のコードを実読した記録。出典は末尾 sources.md と対応。

## 基本情報

- repo: `knative/serving` (Knative プロジェクト本体の主実装リポ。`knative/eventing` は別軸でイベント駆動を担当)
- pinned commit: `6fb71ff2ecf40bdad90fcc41a11374611bc3f121` (committer date 2026-06-19) / 近いタグ: `knative-v1.22.0` (main 上でこのコミットは 1.22.0 から 46 commits ahead, 0 behind)。リリースブランチ上の `knative-v1.22.1` / `v0.49.1` とは diverged (ahead 46 / behind 1)。
- 言語 / ビルド: Go (`go.mod` の `go 1.25.0`) / `go build` + `ko` ベースのイメージ生成。ローカル開発は `hack/` と `DEVELOPMENT.md`。
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認、GitHub API の `license.spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Graduated (2025-09-11 graduated、2025-10-08 公式アナウンス。Incubating は 2022-03-02)
- カテゴリ (CATEGORY_ORDER から): Orchestration & Scheduling

## 歴史の素材

- 2018 に Google 社内で発足。IBM / Red Hat / VMware / SAP が初期から参加 (CNCF アナウンス / New Stack)。
- 初期は Build / Serving / Eventing の 3 本柱。Build は後に Tekton へ発展し分離、中核は Serving と Eventing の 2 本柱に整理。
- 2021 に v1.0 を出し production ready を宣言。
- 2022-03-02 に CNCF Incubating 受理。
- 2025-09-11 に Graduated 昇格、2025-10-08 に CNCF 公式アナウンス (約 7 年かけて卒業)。同時期に Knative 1.20 をリリース。
- 直近の方向性: ネットワークスタックを Gateway API へ寄せる、コンテナの安全側デフォルト強化、メトリクス/トレースを OpenTelemetry へ移行 (CNCF アナウンス記載)。

## アーキテクチャの素材

Serving は「コントロールプレーン (reconciler 群)」と「データプレーン (activator + queue-proxy)」に分かれる。

コントロールプレーンのプロセスは単一バイナリ `cmd/controller` が複数 reconciler を相乗りで起動する。`cmd/controller/main.go:56-66` の `ctors` に登録されているのが実際に動く controller 一覧:

- `configuration`, `revision`, `route`, `service`, `serverlessservice`, `labeler`, `gc`, `nscert`, `domainmapping`。加えて条件付きで `certificate` (`cmd/controller/main.go:81-90` で cert-manager CRD があれば追加)。

`cmd/` 配下の独立プロセス (= デプロイされる Pod):

- `cmd/controller` … 上記 reconciler 群
- `cmd/autoscaler` … KPA (Knative Pod Autoscaler) 本体
- `cmd/autoscaler-hpa` … HPA クラス用の橋渡し
- `cmd/activator` … スケールゼロ時にリクエストをバッファし pod 起動を待つデータプレーン要素 (`cmd/activator/main.go`)
- `cmd/queue` … 各ユーザ Pod に sidecar 注入される queue-proxy。並行数を計測して autoscaler に stat を送る
- `cmd/webhook` … admission / defaulting / conversion webhook
- `cmd/default-domain`, `cmd/schema-tweak` … 補助

CRD 4 種の関係 (`pkg/apis/serving/v1/service_types.go:31-87`): `Service` は `Configuration` と `Route` を束ねるトップレベル抽象。`ServiceSpec` は `ConfigurationSpec` をそのまま inline し、`RouteSpec` を webhook で制限付き inline する (`service_types.go:78-87`)。Configuration を更新するたびに immutable な `Revision` が 1 つ生まれ、`Route` がリビジョン群へトラフィックを %分割する。

データプレーンの肝は `ServerlessService` (SKS) で、これが「activator をリクエストパスに挟むか (Proxy mode)」「Pod へ直結するか (Serve mode)」を切り替える。SKS 型自体は vendor 化された `knative.dev/networking` 側 (`vendor/knative.dev/networking/pkg/apis/networking/v1alpha1/serverlessservice_types.go`) に定義。

## 内部実装の素材

### 代表オペレーションを端から端まで: `Service` 適用 → Revision/Route 生成

1. ユーザが `Service` を apply。`service` reconciler が `ReconcileKind` を受ける: `pkg/reconciler/service/service.go:72`。最初に `pkgreconciler.DefaultTimeout` で ctx を切る (`service.go:73`)。
2. `c.Config(ctx, service)` (`service.go:129`) が子の `Configuration` を取得。無ければ `createConfiguration` → `resources.MakeConfiguration(service)` で生成 (`service.go:202-205`)。既存なら owner 確認 (`metav1.IsControlledBy`, `service.go:142`) の上 `reconcileConfiguration` で spec を desired に clobber (`service.go:222-246`)。差分判定は `kmp.SafeDiff` + `equality.Semantic.DeepEqual` (`service.go:207-220`)。
3. Configuration の generation が status.ObservedGeneration に追いつくまで Service status を `MarkConfigurationNotReconciled` で保留 (`service.go:83-92`)。BYO-Revision 名指定時はここで return して直列化する。
4. 別プロセスの `configuration` reconciler が走り `ReconcileKind` (`pkg/reconciler/configuration/configuration.go:59`)。テンプレートに対応する Revision が無ければ `createRevision` (`configuration.go:69`、実体は `:299` の `resources.MakeRevision(ctx, config, clock.Now())`)。生成後 `SetLatestCreatedRevisionName` (`configuration.go:96`)、Ready になったものを `findAndSetLatestReadyRevision` で `LatestReadyRevisionName` に昇格 (`configuration.go:138-151`)。
5. Service reconciler に戻り `c.route(ctx, service)` (`service.go:152`) が `Route` を取得/生成 (`MakeRoute`, `service.go:248-251`)。
6. 最後に `checkRoutesNotReady` (`service.go:175-200`) が Route の spec.Traffic と status.Traffic を比較し、`configuration` ターゲットを `LatestReadyRevisionName` に置換した上で diff が無いか検証。差分があれば `MarkRouteNotYetReady`。
7. Revision の Ready 化に伴い `revision` / `serverlessservice` reconciler が Deployment と SKS を作り、データプレーンが立ち上がる。

### 中核データ構造 (3-5)

- `v1.Service` / `ServiceSpec` / `ServiceStatus` (`pkg/apis/serving/v1/service_types.go:43-127`): ConfigurationSpec を inline、status は ConfigurationStatusFields と RouteStatusFields を inline する duck-typed (`duckv1.KRShaped`) リソース。
- `Configuration` / `Revision` / `Route` (`pkg/apis/serving/v1/`): Revision は immutable スナップショット。Configuration が世代ごとに作る。
- `autoscaler` struct (`pkg/autoscaler/scaling/autoscaler.go:44-64`): `panicTime` / `maxPanicPods` / `delayWindow` / `deciderSpec` を保持する per-revision のスケール計算器。
- `DeciderSpec` (`pkg/autoscaler/scaling/`): TargetValue / PanicThreshold / StableWindow / MaxScaleUpRate / TargetBurstCapacity / Reachable / ActivationScale など、スケール判断の入力一式。
- `ScaleResult` (`autoscaler.go:308-312`): `DesiredPodCount` / `ExcessBurstCapacity` / `ScaleValid`。EBC が activator を残すかの判断に使われる。

### 非自明な設計判断: 二重ウィンドウ (stable + panic) オートスケール

KPA は「stable window」と「panic window」の 2 つの観測窓を同時に回す。`pkg/autoscaler/scaling/autoscaler.go:149` の `Scale` が両方の観測値 (`StableAndPanicConcurrency` / `StableAndPanicRPS`, `autoscaler.go:166-173`) を取り、`dppc/readyPodsCount >= PanicThreshold` を満たすと panic に入る (`autoscaler.go:220-226`)。panic 中は:

- スケールダウンしない (増加だけ反映、`autoscaler.go:247-254` の `maxPanicPods` ラチェット)。
- panic 状態は閾値を下回って StableWindow 経過するまで解除しない (`autoscaler.go:230-236`)。

デフォルト (`pkg/autoscaler/config/config.go:53-58`): `StableWindow=60s`、`PanicWindowPercentage=10` (= panic 窓 6s)、`PanicThresholdPercentage=200`、`TargetBurstCapacity=211`、`ContainerConcurrencyTargetDefault=100`、`ScaleToZeroGracePeriod=30s`、`EnableScaleToZero=true`。短い 6 秒窓で急増を即検知して一気に増やし、60 秒窓でゆっくり収束させる。これが Knative の「素早い立ち上げ + 安定した縮退」を成立させる肝。

もう一つの非自明点は Excess Burst Capacity (EBC) (`autoscaler.go:278-292`): `EBC = TotCapacity - TargetBurstCapacity - observedPanicValue`。EBC が負だとバースト余力が無いと判断し activator をリクエストパスに残す (SKS を Proxy mode に保つ)。「scale-to-zero と低レイテンシ」を両立させるための仕組みで、knee-jerk を避けるため stable 値でなく panic 値で計算している。

### main エントリポイント

- controller: `cmd/controller/main.go:68` の `main()` → `sharedmain.MainWithConfig(ctx, "controller", cfg, ctors...)` (`main.go:92`)。
- autoscaler: `cmd/autoscaler/main.go`。
- activator: `cmd/activator/main.go`。

## 採用事例の素材

出典は `knative/community` の `ADOPTERS.MD` (一部は CNCF 卒業アナウンスでも言及)。捏造なし、ファイル記載のみ:

- Alibaba Cloud (China, クラウド基盤)、Scaleway (France, クラウドサービス)、Gojek (Indonesia, CaraML MLOps) … CNCF 卒業アナウンスで名指し。
- Red Hat (OpenShift Serverless)、IBM (Cloud Code Engine)、Google Cloud (Cloud Run for Anthos)、VMware (Tanzu Application Platform / Event Broker)。
- Bloomberg L.P. (data science platform)、Box (内部 serverless PaaS)、Cisco (内部 DevX)、Cloudera (AI inference)、Optum、WP Engine (Headless WordPress)。
- KA-NABELL (Japan, EC プラットフォーム)、KubeSphere (China, OpenFunction serving)、Sinch (Sweden)、Tata Communications (India)、Telekom Deutschland / SVA (Germany)。
- AI 系: Cerebrium、Run:ai、Runhouse、deepc.ai など (ADOPTERS.MD)。

## 採用シグナル (数値)

- `knative/serving`: stars 6,063 / forks 1,227 / 言語 Go / created 2018-01-24 (GitHub API, 2026-06-23 取得)。
- contributors: GitHub contributors API のページネーション last が page=336 (per_page=1, anon 含む) → 概ね 300+ コントリビュータ規模 (2026-06-23)。
- 参考: `knative/eventing` は stars 1,550 (同日)。serving が本体としてのスター集中先。

## 代替・エコシステム

- KEDA: イベント/キュー駆動のスケール (HPA と組み合わせて 0→N)。Knative はリクエスト並行数駆動で HTTP/gRPC のレイテンシ最適。シグナルが「キュー長」か「ライブ並行数」かが本質差。
- Kubernetes HPA: CPU/メモリ駆動、単体では 1→N のみ (ゼロスケール不可)。Knative は activator バッファで 0→1 を実現。
- OpenFaaS: RPS ベースで 1 インスタンスずつ増やす軽量 FaaS。Knative は並行数ベースで複数同時増設 (ベンチで 10 インスタンス到達が速い)。
- OpenWhisk / Fission / Fn / OpenFunction (KubeSphere、Knative を内部利用): 隣接 FaaS。
- 統合: Istio / Contour / Kourier / Gateway API (ネットワーク層)、cert-manager (`cmd/controller/main.go:81-90`)、OpenTelemetry (メトリクス/トレース)、`knative/eventing` + CloudEvents (イベント軸)。

## インストール / 最小構成

- Quickstart は `knative` CLI plugin + kind/minikube。手動は YAML 適用: CRD → core → networking layer (例 Kourier) → DNS 設定。
- 最小: Kubernetes クラスタ + Serving の CRD/core を apply + ネットワーク層を 1 つ選択。`kn service create hello --image <img>` でデプロイし、無負荷時にゼロスケール、リクエストで activator 経由 cold start を確認できる。
