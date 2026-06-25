# recon: Litmus (LitmusChaos)

調査メモ。自分用の密度。出典は URL 付き。`src/` は pinned commit に対して検証済み。

## 基本情報

- repo: `litmuschaos/litmus` (<https://github.com/litmuschaos/litmus>)
- pinned commit: `97cfc6f1ee73af5f8e6b7f8c01e97b116cccfc0c` / 近いタグ: `3.30.0` (2026-06-17 リリース)
- 言語 / ビルド: Go (control plane バックエンド、`go 1.24`〜`1.26`)、TypeScript/React (web UI)。ビルドは `chaoscenter/Makefile` のターゲット (`backend-services-checks`, `web-unit-tests`, `docker.buildx`) と各サービスの `go.mod` 単位
- ライセンス: Apache License 2.0 (`src/LICENSE`、`Copyright 2019 LitmusChaos Authors`、201 行のフルテキストを確認)
- CNCF 成熟度: Incubating (受理 2020-06-25、Incubating 昇格 2022-01-11、CNCF 公式ページで確認)
- カテゴリ (tools.ts の CATEGORY_ORDER): Chaos Engineering
- メイン entrypoint: `chaoscenter/graphql/server/server.go:94` (GraphQL サーバ)。他に `chaoscenter/authentication/api/main.go`、`chaoscenter/subscriber/subscriber.go:138`、`chaoscenter/event-tracker/main.go`、`chaoscenter/upgrade-agents/control-plane/main.go`

リポジトリ構成の要点: この `litmus` リポジトリは 3.x で **ChaosCenter (コントロールプレーン)** の実装が主。実際の障害注入ロジック (Go の chaos faults) は sister repo `litmuschaos/litmus-go`、ChaosHub の実験 YAML は `litmuschaos/chaos-charts`、実行プレーンの operator は `litmuschaos/chaos-operator` に分かれている。`src/chaos-engineering/` は `.gitkeep` のみで空。

## 歴史の素材

- 2017 後半: MayaData 社内で OpenEBS コミュニティから派生する形で開始。Kubernetes 上の単純な chaos job がルーツ。出典: CNCF Q4 2025 update (<https://www.cncf.io/blog/2026/01/22/litmuschaos-q4-2025-update-community-contributions-and-project-progress/>)。GitHub repo 作成日は 2017-03-15 (GitHub API)
- 2020-06-25: CNCF Sandbox に受理 (MayaData が寄贈)。出典: CNCF project page (<https://www.cncf.io/projects/litmus/>)、Sandbox proposal は cncf/toc issue #390
- 2021-02-10: MayaData から **ChaosNative** が分社、Litmus 専任の独立企業に。CEO は Uma Mukkara。出典: PR Newswire (<https://www.prnewswire.com/news-releases/chaosnative-launches-to-accelerate-litmus-adoption-in-enterprises-301225911.html>)。ChaosNative は後に Harness に買収され、現在 UI は Harness UIcore library を使う
- 2022-01-11: CNCF Incubating に昇格。当時本番採用 25+ 組織 (Intuit, Lenskart, Orange, Red Hat, VMware など)。出典: CNCF blog (<https://www.cncf.io/blog/2022/01/11/litmuschaos-becomes-a-cncf-incubating-project/>)
- 2023-11 (KubeCon Chicago): **Litmus 3.0 GA**。ChaosCenter の全面リアーキテクチャ。UI 刷新、Environments、Chaos Studio (Monaco ベースの YAML/ビジュアルエディタ)、再利用可能な resilience probes、MongoDB 標準化、バックエンド API リファクタ。用語変更: Chaos Agents → Chaos Infrastructures、Workflows → Chaos Experiments、旧 Experiments → Chaos Faults。3.x は 2.x と非互換。出典: CNCF blog (<https://www.cncf.io/blog/2023/11/07/litmuschaos-3-0-making-chaos-engineering-robust-lean-and-developer-centric/>)、GitHub release 3.0.0
- リリースケイデンス: minor (3.x.0) は毎月 15 日、patch は需要ベース。pinned tag は 3.30.0 (2026-06-17)

## アーキテクチャの素材

二面構成。README (`src/README.md:31-52`) の用語に沿う。

- **Chaos Control Plane (ChaosCenter)**: 実験の作成・スケジュール・可視化を行う中央管理。本リポジトリの `chaoscenter/` 配下。マイクロサービス群:
  - `graphql/server` GraphQL API + gRPC。gqlgen 製スキーマ。MongoDB が状態ストア (`server.go:97-104`)
  - `authentication` REST 認証サーバ (`authentication/api/main.go`)、dex 連携あり (`dex-server/`)
  - `subscriber` 実行クラスタ側に常駐する chaos agent。コントロールプレーンへ websocket でダイヤルバックする (`subscriber/subscriber.go:159`)
  - `event-tracker`、`upgrade-agents`、`web` (React UI)
- **Chaos Execution Plane**: ターゲット K8s 上で実験を実行・監視する operator 群。`chaos-operator` が ChaosEngine CR を reconcile し、`chaos-runner` が experiment job を起動、`litmus-go` の go-runner が fault を注入、`chaos-exporter` が結果を Prometheus メトリクスに出す (別リポジトリ)

中核 CRD (README `:39-52`): **ChaosExperiment** (fault のテンプレート、BYOC 対応)、**ChaosEngine** (アプリ/インフラと fault を結びつけ、probe で steady-state を検証。chaos-operator が watch)、**ChaosResult** (検証結果と verdict を保持、exporter が読む)。Workflow object が複数 experiment を順序付けて束ねる。

### 代表操作のトレース: 既存実験の再実行 (runChaosExperiment mutation)

GraphQL mutation がコントロールプレーンから実行クラスタへ manifest を push するまで。全 anchor は pinned commit 基準。

1. `chaoscenter/graphql/server/server.go:124` gqlgen handler 構築、`:192` `router.Any("/query", authorization.Middleware(...))` で GraphQL endpoint 配線。service の依存注入は `:185` `NewChaosExperimentService(...)`
2. `chaoscenter/graphql/server/graph/chaos_experiment_run.resolvers.go:24` `RunChaosExperiment` resolver。`:31` で `authorization.ValidateRole` の RBAC チェック、`:43` で MongoDB から実験を取得、`:50` で `RunChaosWorkFlow` を呼ぶ
3. `chaoscenter/graphql/server/pkg/chaos_experiment_run/handler/handler.go:670` `RunChaosWorkFlow`。`:672` 対象インフラの active 確認、`:690` Revision を更新時刻降順ソートして最新を採用、`:694` `kind` が `cronworkflow` なら `RunCronExperiment` へ分岐 (`:696`)、それ以外は `:698` で notifyID 採番
4. `handler.go:700` Argo の `v1alpha1.Workflow` に unmarshal、`:710-711` で `notify_id` ラベルと timestamp 付き名前を注入。`:714-777` で各 template の ChaosEngine artifact を走査し、`infra_id` / `step_pod_name` / `workflow_run_id` ラベルと probe アノテーションを差し込む
5. `handler.go:820-913` MongoDB トランザクション (write concern majority、read concern snapshot)。`recent_experiment_run_details` に run detail を push (`:863-870`) し、`:878` `CreateExperimentRun` で `chaos_experiment_run` collection に Queued 状態のレコードを作成
6. `handler.go:934` `GenerateExperimentManifestWithProbes` で probe を manifest に展開、`:944` `chaos_infrastructure.SendExperimentToSubscriber(...)`
7. `chaoscenter/graphql/server/pkg/chaos_infrastructure/infra_utils.go:226` `SendExperimentToSubscriber` → `:206` `SendRequestToSubscriber`。`:219-220` で `r.ConnectedInfra[infraID] <- newAction` とインメモリ channel へ push
8. 実行クラスタ側: `chaoscenter/subscriber/subscriber.go:159` `AgentConnect` が起動時に `chaoscenter/subscriber/pkg/requests/webhook.go:30` で websocket をコントロールプレーンへ Dial し、`:17` の `subscription { infraConnect(...) }` を張る。push された action を受信し `:150` `AgentOperations` で K8s に manifest を apply
9. サーバ側の subscription resolver は `chaoscenter/graphql/server/graph/chaos_infrastructure.resolvers.go:272` `InfraConnect`。`:287` で `data_store.Store.ConnectedInfra[infraID]` に channel を登録、`:289-300` で `ctx.Done()` を待って切断時に channel 削除 + infra を inactive 化

### 非自明な設計判断

コントロールプレーンはターゲットクラスタへ **一切接続しに行かない**。逆に各実行クラスタの subscriber (agent) が起動時にコントロールプレーンへ websocket でダイヤルバックし、GraphQL subscription `infraConnect` を張りっぱなしにする (`subscriber/pkg/requests/webhook.go:30`, `chaos_infrastructure.resolvers.go:272`)。実験実行時はその開いた channel に action を push するだけ (`infra_utils.go:219-220`)。

利点: ターゲットクラスタが NAT/ファイアウォール内でも outbound だけで繋がる。マルチクラスタを 1 つの ChaosCenter から統制できる。

トレードオフ: 接続状態 (`ConnectedInfra` map of channel) は GraphQL サーバプロセスの **メモリ内 state** (`data-store/store.go:10-18`)。サーバ再起動で全 agent の接続が切れて貼り直しになり、複数レプリカ間で共有されない。`InfraConnect` resolver は同一 infraID の二重接続を検知すると既存を強制切断する (`chaos_infrastructure.resolvers.go:281-285`)。実質シングルトン前提のコントロールプレーン。

## 内部実装の素材

ディレクトリ要点 (`chaoscenter/graphql/server/`):

- `graph/` gqlgen 生成の resolver。`*.resolvers.go` がエントリ、`generated/` は生成コード、`model/` は GraphQL モデル
- `pkg/chaos_experiment/` 実験 CRUD の service (`ops/service.go`) と handler (`handler/handler.go`)
- `pkg/chaos_experiment_run/` run 管理。`handler/handler.go:670` が実行の心臓部
- `pkg/chaos_infrastructure/` agent 接続管理と subscriber への push (`infra_utils.go`, `service.go`)
- `pkg/probe/` resilience probe (http/cmd/k8s/prom)。manifest への probe 注入
- `pkg/database/mongodb/` collection ごとの operator + schema
- `pkg/authorization/` RBAC ルール (`MutationRbacRules`)、JWT
- `pkg/data-store/` プロセス内 state (channel の map)

中核データ構造:

- `pkg/data-store/store.go:10` `StateData`: `ConnectedInfra map[string]chan *model.InfraActionResponse` ほか、subscription を束ねる channel の map 群 + `*sync.Mutex`。コントロールプレーンのライブ接続状態の本体
- `pkg/database/mongodb/chaos_experiment/schema.go:31` `ChaosExperimentRequest`: 実験の永続レコード。`Revision []ExperimentRevision` で manifest のバージョン履歴、`RecentExperimentRunDetails` に直近 10 run、`ExperimentType` (`experiment` / `cronexperiment` / `chaosengine`、`:10-16`)
- `pkg/database/mongodb/chaos_experiment_run/schema.go:6` `ChaosExperimentRun`: 1 回の実行。`Phase`、`ResiliencyScore *float64`、`FaultsPassed/Failed/Awaited/Stopped/NA`、`ExecutionData` (実行状況の JSON)、`Probes`
- `pkg/database/mongodb/chaos_experiment/schema.go:46` `Probes`: `{FaultName, ProbeNames}`。どの fault にどの probe を紐付けたか
- `model.InfraActionResponse` / `ActionPayload`: agent へ push する action の中身 (`K8sManifest`, `Namespace`, `RequestType`, `ExternalData`, `Username`)。`infra_utils.go:207-216`

驚いた点 / メモ:

- バージョン互換チェックが意図的に無効化されている。`server.go:77-80` で「DB upgrader job が機能するまで」とコメントアウト。DB の version と control plane version の不一致を現状は弾かない
- 障害注入の実体は本リポジトリに無い。`litmus` repo は 3.x ではほぼコントロールプレーン + メタ repo。fault のコードを読むなら `litmus-go` (`litmuschaos/litmus-go` README: 「This repo can be viewed as an extension to litmuschaos/litmus」)
- RBAC は GraphQL mutation 単位の map (`authorization.MutationRbacRules`) で resolver 冒頭から都度 `ValidateRole` する方式

## 採用事例の素材

ADOPTERS.md (`src/ADOPTERS.md`) に出典付きで多数記載。end-user / vendor / solution provider に分類。citable な代表例:

- **Intuit**: Argo ベースの chaos workflows。出典: ADOPTERS.md + YouTube talk (<https://youtu.be/Uwqop-s99LA?t=720>)
- **Orange**: クラウドインフラの resiliency。出典: ADOPTERS.md + CNCF talk
- **Mercedes-Benz**, **Adidas**, **Lenskart**, **iFood**, **FIS**, **Halodoc**, **Kitopi**, **AB-InBev**: ADOPTERS.md に各 org のストーリー or 外部記事リンク
- **Flipkart**, **Talend**, **Delivery Hero**, **Emirates NBD**, **Amadeus**: ADOPTERS.md (litmus issue #2191 のコメントが出典)
- vendor/solution provider: **Red Hat** (OpenShift Virtualization、YouTube)、**VMware**、**NetApp**、**Okteto** (Litmus 連携記事)、**KubeSphere**、**Container Solutions**
- CNCF Incubating 昇格時点で本番 25+ 組織。出典: CNCF blog 2022-01-11

採用シグナル (GitHub API, 2026-06-24 取得):

- `litmuschaos/litmus` stars 5,466 / forks 880 / open issues 438 / contributors 約 304 (anon 含む、`per_page=1` の last page)
- 最新リリース 3.30.0 (2026-06-17)
- OpenSSF Best Practices バッジ (project 3202)、FOSSA ライセンススキャン

## 代替・エコシステム

LitmusChaos org の周辺リポジトリ (stars は 2026-06-24):

- `chaos-operator` (156) 実行プレーンの ChaosEngine reconciler
- `chaos-charts` (91) ChaosHub の実験 YAML バンドル
- `litmus-go` (83) Go 製 chaos faults 本体 (go-runner)
- `litmus-helm` (59) Helm チャート
- `chaos-exporter` (36) Prometheus メトリクス
- `litmusctl` (32) agent plane 管理 CLI
- `chaos-runner` (29)、`litmus-python` (Python faults の例)、`github-chaos-actions` (CI 連携)、`litmus-mcp-server` (18, MCP サーバ)

統合先: Argo Workflows (実験は Argo Workflow として実行)、Prometheus/Grafana (メトリクス・dashboard、`graphql/server/grafana/`)、Kubernetes RBAC、GitOps (`pkg/gitops`)、Spring Boot ALFI (アプリレベル fault injection)。

主な代替と差:

- **Chaos Mesh** (CNCF Incubating, PingCAP 発): 同じ K8s ネイティブ chaos。CRD ベースで網羅的な fault タイプ。Litmus との差は ChaosHub による実験共有モデルと、マルチクラスタを束ねる ChaosCenter コントロールプレーン + agent dial-back アーキテクチャ
- **Chaos Toolkit** (CNCF 外): 言語非依存の JSON/YAML 実験スペック。K8s 専用ではなく汎用。Litmus は K8s ネイティブで CRD + operator 駆動
- **Gremlin**: 商用 SaaS。Litmus は OSS でセルフホスト
- **AWS FIS**: マネージド、AWS リソース限定。Litmus はクラウド非依存で K8s ワークロード中心

## インストール / 最小動作セット(出典: Litmus Docs Installation, 2026-06-24)

前提: Kubernetes 1.17+、Helm 3+、PV 20GB (テストは 1GB 可)。出典: <https://docs.litmuschaos.io/docs/getting-started/installation>

```bash
helm repo add litmuschaos https://litmuschaos.github.io/litmus-helm/
kubectl create ns litmus
helm install chaos litmuschaos/litmus --namespace=litmus --set portal.frontend.service.type=NodePort
```

ローカル (minikube/kind) は UI endpoint の追加設定が要る。リモートは NodePort を外して port-forward (`kubectl port-forward svc/chaos-litmus-frontend-service 9091:9091`)。Helm チャートは MongoDB に依存 (ARM は bitnami イメージ差し替えが要る)。

## 英日タグライン案

- EN: Cloud-native chaos engineering for Kubernetes, with a central control plane and a shared hub of reusable experiments.
- JA: Kubernetes 向けのクラウドネイティブなカオスエンジニアリング。中央コントロールプレーンと再利用可能な実験を共有する ChaosHub を備える。
</content>
