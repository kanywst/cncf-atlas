# recon: OpenFGA

調査メモ。Zanzibar 系の fine-grained authorization エンジン (ReBAC + ABAC)。出典は `(n)` で sources.md の番号と対応。

## 基本情報

- repo: openfga/openfga
- pinned commit: `9a556d8a134db308a7690f328dade79104922c8a` (2026-06-18, `docs: fix changelog entry (#3177)`)
- 近いタグ: `v1.18.0` (tag sha `81089a31698505b4d5f01311c04e83b9adfcf383`, 2026-06-17)。HEAD はこのタグの 1 コミット後 (changelog の docs 修正のみ)。
- 言語 / ビルド: Go (`go 1.25.7`, toolchain `go1.26.4`, `go.mod`) / `make build` (`./dist/openfga` を生成)
- ライセンス: Apache-2.0 (リポジトリ `LICENSE` を確認、`Apache License Version 2.0` 本文。GitHub も Apache-2.0 表示) (1)
- CNCF 成熟度: Incubating (2022-09-14 に Sandbox 受理、2025-10-28 に Incubating 昇格、2025-11-11 に公式発表) (3)(4)(5)
- カテゴリ (tools.ts CATEGORY_ORDER): Identity & Policy
- 主エントリポイント: `cmd/openfga/main.go`。`cobra` の root に `run` / `migrate` / `validate-models` / `version` サブコマンドをぶら下げる。サーバ起動本体は `cmd/run/run.go`。

```text
HTTP/gRPC Request -> Middleware -> Server Handler -> Command -> Graph Resolution -> Storage -> Response
```

(上記フローは同梱の `AGENTS.md` のアーキ節と実コードで一致を確認。)

## 歴史の素材

- Auth0 (後に Okta が買収) の内部 authorization システムが起源。Auth0 FGA として 2021-12 から本番稼働、2022-06 に OSS 化して公開発表 (2)。
- 動機: Airbnb / Carta などが各社で Zanzibar 風システムを作り直していた状況に対し、「誰でも使える 1 つの実装」を提供する。Google Zanzibar 論文 (ReBAC, trillions of ACL, p95 < 10ms) の着想を取り入れつつ、RBAC/ABAC のユースケースも DSL で表現できるようにした (2)。
- CNCF: 2022-09-14 に Sandbox 受理。2025-10-28 に TOC 投票で Incubating へ昇格、2025-11-11 にブログで公式発表 (3)(4)(5)。
- 現在は Okta / Grafana のエンジニアらが共同でメンテ。Auth0 FGA 商用版が引き続き OpenFGA 上に構築されている (2)(3)。

## アーキテクチャの素材

トップレベルのパッケージ所有範囲 (実ディレクトリ確認):

- `cmd/` : CLI。`run`(サーバ起動/設定/graceful shutdown), `migrate`(DB マイグレーション), `validatemodels`。
- `pkg/server/` : gRPC/HTTP ハンドラ。`check.go`, `batch_check.go`, `list_objects.go`, `list_users.go`, `expand.go`, `write.go`, `read.go` ほか。AuthZEN 互換エンドポイントも `authzen.go` にある。
- `pkg/server/commands/` : トランスポートから切り離したビジネスロジック層 (`check_command.go` など)。
- `internal/graph/` : 認可チェックの中核エンジン。`LocalChecker` と resolver チェーン。
- `internal/planner/` : resolver 選択のための Thompson Sampling プランナ。
- `pkg/typesystem/` : 認可モデルのパース/検証。`weighted_graph.go` でクエリ経路最適化。
- `pkg/storage/` : `OpenFGADatastore` インタフェースと実装 (`memory`, `postgres`, `mysql`, `sqlite`)。
- `internal/validation/`, `internal/authn/`, `internal/authz/` : tuple/リクエスト検証、認証 (None/Preshared Key/OIDC) と API 認可。

### resolver チェーンは循環リンクリスト

resolver は設定により条件付きで合成され、最後の resolver が先頭に委譲し直す「循環リンクリスト」になっている (構築は `internal/graph/builder.go`、インタフェースは `internal/graph/interface.go:13` の `CheckResolver`)。

```text
[CachedCheckResolver]? -> [DispatchThrottlingCheckResolver]? -> [ShadowResolver | LocalChecker] (loop back)
```

`CheckResolver.ResolveCheck` は「問題木の 1 ノード (部分問題)」を解く再帰関数で、`Delegate` 経由の呼び出しが無限再帰にならないことが契約 (`internal/graph/interface.go:13-46`)。

## 内部実装の素材

### Check を端から端まで追う

1. `pkg/server/check.go:37` `(*Server).Check`。trace 開始、リクエスト検証、`checkAuthz` で API 認可 (`check.go:63`)。
2. feature flag `ExperimentalWeightedGraphCheck` が有効なら新しい v2 経路 `s.v2Check` を試す (`check.go:70-71`)。v2 が非タイムアウト系エラーを返したら後方互換のため v1 にフォールバック (`check.go:73-152`)。
3. v1 経路: `getCheckResolverBuilder(storeID).Build()` で resolver チェーンを構築 (`check.go:156`)、`resolveTypesystem` でモデル解決 (`check.go:162`)、`commands.NewCheckCommand(...)` を生成 (`check.go:168`)、`checkQuery.Execute(...)` を呼ぶ (`check.go:182`)。
4. `pkg/server/commands/check_command.go:102` `(*CheckQuery).Execute`。リクエスト検証 (`:103`)、consistency が HIGHER_CONSISTENCY 以外ならキャッシュ無効化時刻を解決 (`:110`)、`graph.NewResolveCheckRequest(...)` を組み立て (`:114`)、tuple キャッシュ付き datastore wrapper を context に積む (`:129`, `:146-147`)、`c.checkResolver.ResolveCheck(ctx, ...)` を実行 (`:150`)。
5. `internal/graph/check.go:395` `(*LocalChecker).ResolveCheck`。解決深度上限チェック (`:415`)、`hasCycle` でサイクル検出 (`:419`、検出時は `Allowed:false, CycleDetected:true`)、self-defining tuple は即 true (`:434`)、`typesys.PathExists` でモデルグラフ上に到達経路が無ければ即 false で枝刈り (`:455-463`)、最後に `c.CheckRewrite(ctx, req, rel.GetRewrite())(ctx)` を呼ぶ (`:465`)。
6. `internal/graph/check.go:1041` `(*LocalChecker).CheckRewrite` が rewrite 種別で分岐 (`:1046-1063`): `Userset_This` -> `checkDirect`、`ComputedUserset` -> `checkComputedUserset`、`TupleToUserset` -> `checkTTU`、`Union`/`Intersection`/`Difference` -> `checkSetOperation` に集合演算子 (`union`/`intersection`/`exclusion`) を渡す。
7. 集合演算は並行実行。`union` (`internal/graph/check.go:160`) は goroutine プールで全ハンドラを走らせ、最初に `Allowed:true` を返した時点で短絡 (`:206-209`) し `defer cancel()` で残りを止める。`intersection` (`:222`) は最初の偽で打ち切り、`exclusion` (`:295`) は base が真かつ subtract が偽で真。

### 中核データ構造

1. `TupleKey` (object, relation, user) : 関係タプルの基本単位。`pkg/tuple/tuple.go:17-26` で proto `openfgav1.TupleKey` をラップ。例 `document:1 # viewer @ user:alice`。
2. `ResolveCheckRequest` / `ResolveCheckResponse` : チェック木の 1 ノードを表す内部リクエスト/レスポンス。`VisitedPaths` (サイクル検出用 map)、解決メタデータ (DispatchCount, DatastoreQueryCount など) を持つ。`internal/graph/resolve_check_request.go`, `resolve_check_response.go`。
3. Userset rewrite (proto): `Userset_This` / `ComputedUserset` / `TupleToUserset` / `Union` / `Intersection` / `Difference`。モデルの関係定義を集合演算木として表現し、`CheckRewrite` がこれを評価する (`internal/graph/check.go:1046-1063`)。
4. `TypeSystem` + `WeightedAuthorizationModelGraph` : 認可モデルを保持し、重み付きグラフで経路の有無/最短経路を判定。`pkg/typesystem/typesystem.go:184` に `authzWeightedGraph` フィールド、`:242` で `graph.NewWeightedAuthorizationModelGraphBuilder()`。`PathExists` による枝刈りがここに効く。
5. `ThompsonStats` / `PlanConfig` : resolver 戦略ごとの遅延ベイズ統計 (Normal-gamma 分布)。`internal/planner/thompson.go:13`, `internal/planner/config.go`。

### 非自明な設計判断: Thompson Sampling で resolver 戦略を選ぶ

ある部分問題に対してどの resolver 戦略を使うかを、固定ルールではなくオンライン学習で選ぶ。`internal/planner/plan.go:46` `(*keyPlan).Select` が各戦略の信念分布から遅延サンプルを引き、最小サンプル時間の戦略を選ぶ (Thompson Sampling の決定則)。実測遅延でベイズ更新 (`UpdateStats`)。各戦略は `PlanConfig` の `InitialGuess`(初期遅延の事前)、`Lambda`(事前への信頼度)、`Alpha`/`Beta`(分散の事前) で特徴づけられ、設計意図がコメントとして `internal/planner/config.go:5-43` に詳述されている。要するに「探索 (exploration) と活用 (exploitation) のバランスを取りながら、クエリ経路ごとに低レイテンシな解決戦略へ収束する」エンジン内部の自己最適化機構。

補足の非自明点: v2 (`ExperimentalWeightedGraphCheck`) は重み付きモデルグラフを使った新しい Check 実装で、表現不能なモデルだと v1 に自動フォールバックする (`pkg/server/check.go:73-152`)。`PathExists` 枝刈り (`internal/graph/check.go:455`) も「グラフ上で到達不能なら DB を引かず即 false」という最適化。

### storage

`pkg/storage/storage.go:152` `RelationshipTupleReader` インタフェース (`ReadUserTuple` / `ReadUsersetTuples` / `ReadStartingWithUser` など)。実装は `memory`(インメモリ、開発用)、`postgres`、`mysql`、`sqlite`。マイグレーションは `pkg/storage/migrate` と `cmd/migrate`。

## 採用事例の素材

CNCF 昇格ブログ (2025-11-11) に出典あり (3):

- 本番利用を公に表明している企業は 37 社、と記載。
- 名前付きで言及: Okta (originator)、Auth0 (商用 FGA)、Grafana Labs (SQLite ストレージアダプタを寄贈、メンテナ輩出)、GitPod (エンジニアが公式メンテナに)、TwinTag (MySQL アダプタを寄贈)。個人コントリビュータ Maurice Ackel が Terraform Provider を寄贈。
- 別の二次情報では Grafana / Docker / Canonical が利用と記載されるが、Docker/Canonical は CNCF ブログ本文では名指しされていない (一次出典は未確認のため「二次情報のみ」と明記) (3)。

## 代替・エコシステム

- 直接の代替 (いずれも Zanzibar 系 ReBAC) (7):
  - SpiceDB (AuthZed): 最も機能豊富で完全な Zanzibar consistency モデル (zookie/at_least_as_fresh)、複数ストレージ (Postgres/MySQL/CockroachDB/Spanner)、Watch API。ただし管理 UI/監査などは薄め。Apache-2.0。
  - Ory Keto: Ory エコシステム (Kratos など) に統合された Go 実装。シンプルだが consistency 制御は粗め。
  - OpenFGA の差別化: DSL とデベロッパ体験 (Playground, CLI, 5 SDK)、ステートレスで水平スケール、self-host と Auth0/Okta FGA マネージドの両提供、CNCF backing。デフォルト consistency は緩め (`HIGHER_CONSISTENCY` はオプトイン)。
- 隣接 (別パラダイム): OPA/Rego は policy-as-code (ABAC) でグラフ走査型ではない。Cedar (AWS) はポリシー言語型。
- エコシステム/統合 (3)(1): SDK 5 言語 (Go, .NET, JS, Java, Python)、VS Code / IntelliJ 拡張、CLI (`fga` モデルテスト)、Helm Charts (Artifact Hub)、Terraform Provider、OpenTelemetry / Prometheus / Grafana 連携。AuthZEN 互換エンドポイント (`pkg/server/authzen.go`)。

## 最小セットアップ (README で確認) (1)

```bash
# Docker (インメモリ、playground 付き、最速)
docker run -p 8080:8080 -p 3000:3000 openfga/openfga run

# Homebrew
brew install openfga
openfga run

# go install
go install github.com/openfga/openfga/cmd/openfga
openfga run
```

デフォルトはインメモリストア。永続化する場合は `openfga migrate` で DB スキーマを作成し `--datastore-engine postgres` 等を指定する。HTTP は 8080、gRPC は 8081、playground は 3000。
