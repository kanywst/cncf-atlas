# recon: Meshery

調査メモ。自分用の密度。出典は `sources.md` の番号 (S1 など) と対応。`path:line` は pin したコミット基準 (repo ルートからの相対パス)。

## 基本情報

- repo: `meshery/meshery` (`https://github.com/meshery/meshery`) (S1)
- pinned commit: `68d542afa9e40e15e3d032bf3ed1d10eb2347b62` (2026-11-15, `master`, PR #23661 のマージコミット)
- 近いタグ: `git describe` は `v1.0.79-569-g68d542afa9e`。最新リリースは `v1.0.79` (2026-11-13) (S3)。リリースは master から release-drafter で切るので、タグ後の master にさらにコミットが積まれている状態
- 言語: Go (server と mesheryctl) + TypeScript/React (ui、Next.js)。tokei で `server` `mesheryctl` `ui` 合計: Go 759 ファイル / 約 15.6 万行 (code)、TSX 859 ファイル / 約 11 万行、TS 322 ファイル。`go.mod` は `go 1.26.4` (S1)
- ビルド: `make server` (port 9081)、`make ui` (port 3000)、`cd mesheryctl && make` (`AGENTS.md`、S1)
- ライセンス: Apache-2.0 (GitHub API `license.spdx_id`) (S2)
- CNCF 成熟度: Incubating。Sandbox 受理 2021-06-22、Incubating 2026-09-14 (S4)(S5)(S6)
- カテゴリ (tools.ts CATEGORY_ORDER から): Provisioning & Infrastructure (理由は末尾「分類」)

## メインの構成と用語

repo 直下のディレクトリ (S1、`AGENTS.md` の表):

- `server/`: Meshery Server。Go。REST + GraphQL API、Kubernetes 管理、レジストリ、デザイン評価と配備
- `ui/`: Meshery UI。Next.js/React、Redux Toolkit、Relay (GraphQL)
- `mesheryctl/`: CLI。Go + Cobra
- `models/`: 組み込みの「モデル」定義 (JSON)。ディレクトリ 479 個、`components/*.json` 24,198 ファイル、`relationships/*.json` 6,790 ファイル (find で数えた)
- `install/`: Dockerfile、Kubernetes マニフェスト、Helm chart (`install/kubernetes/helm/meshery`, `meshery-operator`)
- `docs/`: Hugo の docs サイト (docs.meshery.io のソース)

論理概念 (S12)。ページ側で最初に導入が必要な用語:

- **Model**: 管理対象の技術 1 つ (Kubernetes、Istio、AWS の何か等) を表す単位。中に Component と Relationship を持つ
- **Component**: 管理対象の 1 種類のリソース (例: Istio の VirtualService)。JSON スキーマ付き
- **Relationship**: Component 同士の関係 (親子、エッジ、バインディング等)
- **Design**: 「インフラをどう構成すべきか」を宣言する文書。Component の宣言と Relationship の集合。コード上は `PatternFile` (旧称 Pattern の名残)
- **Registry**: Meshery が知っている全 capability (Model/Component/Relationship) の DB
- **Connection / Credential / Environment / Workspace**: 管理対象への接続、認証情報、配備先のまとまり、チームの協業単位

例: `models/istio-base/1.16.0/v1.0.0/` は `model.json` + `components/` (VirtualService.json 等) + `relationships/`。Component JSON は `schemaVersion: components.meshery.io/v1beta1`、model の registrant は Artifact Hub、`source_uri` は Helm chart の tgz (`models/istio-base/1.16.0/v1.0.0/components/VirtualService.json:1-40`)。つまり model の多くは Helm chart / CRD から自動生成されている。

## 歴史の素材

- GitHub repo 作成 2018-11-14 (S2)。最初のリリース `v0.0.1` は 2019-07-03 (S3)
- Layer5 (Lee Calcote ら) が 2019 年に作成 (S7)。当初の位置付けは「service mesh management plane」。Layer5 は「IT チームがどのサービスメッシュを使うか決めやすくする」ことを狙いとした (S8)
- 2020-06-01 CNCF Landscape に掲載 (S9)
- 2021-03-24 `v0.5.0` (S3)
- 2021-06-22 CNCF Sandbox 受理 (S4)(S5)。公表は 2021-10 の ServiceMeshCon/KubeCon NA。同時に Layer5 は Service Mesh Performance (SMP) も寄贈 (S8)
- 2022-08-24 `v0.6.0`、2023-12-08 `v0.7.0`、2024-12-20 `v0.8.0` (S3)
- 2024-03-01 Incubation 申請 (cncf/toc #1264)、2024-07-31 に #1386 として出し直し (S6)(S18)
- 2025-01 TOC レビュアが「adopter インタビュー用の提出がまだ」「roadmap 非公開」等を指摘 (S6)
- 2026-03-23 KubeCon EU (Amsterdam) で v1.0 GA を発表 (S10)。GitHub 上の `v1.0.0` リリース公開は 2026-03-24 22:32 UTC (S3)。同時に GitHub を `meshery` (コア) と `meshery-extensions` (300+ の統合) の 2 org に分割、Certified Meshery Contributor 開始 (S10)
- 2026-04-09 関係性評価エンジンを OPA/Rego から Go ネイティブへ移植するコミット (S19)
- 2026-09-14 TOC 投票で Incubating 可決 (binding 8 賛成 / 0 反対 / 1 棄権) (S6)。CNCF ブログでの公表は 2026-10-07 (S7)
- 焦点の移り変わり: service mesh 管理 (adapter で Istio/Linkerd 等を操作、SMP で性能比較) → Kubernetes と周辺の全インフラを「Design」で扱う cloud native manager へ。README の自己紹介は今や「self-service engineering platform ... cloud native manager」(S1 `README.md`)

## アーキテクチャの素材

コンポーネント (S11 の表 + コード):

| コンポーネント | 中身 | 通信 |
| --- | --- | --- |
| Meshery Server | Go。API、レジストリ、評価、配備 | REST/GraphQL on 9081 (S11) |
| Meshery UI | Next.js。Server が配信 | Server の REST/GraphQL |
| mesheryctl | Go CLI。ステートレス + 設定ファイル | Server の REST (例: `mesheryctl/internal/cli/root/design/apply.go:82` が `/api/pattern/deploy` を叩く) |
| Database | SQLite ファイル。docs 上は「永続化するがキャッシュ扱い」(S11) | Server 内部 (`server/models/sql-utils.go:101-105`) |
| Adapters | 技術ごとの gRPC サービス (meshery-istio 等、別 repo) | gRPC。`MeshService` に `ApplyOperation` `Provision` `StreamEvents` 等 (`server/meshes/meshops.proto:7-16`) |
| Meshery Operator | MeshSync と Broker を管理する K8s operator (S11) | |
| MeshSync | クラスタ状態を継続的に discovery して Server に送る (S11) | NATS (operator モード) か in-process (embedded モード) |
| Broker | NATS。4222/tcp (S11) | |
| Provider | 認証・永続化・マルチテナントを差し替える抽象 (Local / Remote) | Remote は HTTPS (S11) |

注意: upstream の `AGENTS.md` は Server の DB を「PostgreSQL」と書くが、Server 本体の DB は SQLite (`server/models/sql-utils.go:101-105`、`Engine: database.SQLITE`, ファイル `mesherydb.sql`)。docs の SQLite 記述 (S11) とコードが一致。PostgreSQL は Remote Provider (Meshery Cloud) 側の話と推測されるが未確認なのでページでは書かない。

### 代表オペレーション: Design の deploy (`POST /api/pattern/deploy`)

1. ルーティング。`/api/pattern/deploy` は `ProviderMiddleware → AuthMiddleware → SessionInjectorMiddleware → KubernetesMiddleware → PatternFileHandler` の順でラップ。POST が deploy、DELETE が undeploy (`server/router/server.go:276-277`)
2. ハンドラ。本文 JSON から `PatternFile` を取り出し、クエリ `dryRun` `skipCRD` `verify` `upgrade` を読む。HTTP メソッドが DELETE なら undeploy (`server/handlers/design_engine_handler.go:45-90`)
3. 旧形式 (v1alpha2) の design なら v1beta3 に変換し、変換イベントを記録 (`design_engine_handler.go:92-119`)
4. `NewPatternFile` でパースし、`HydratePattern` でレジストリから欠けた定義を埋める (`design_engine_handler.go:121-131`)
5. `_processPattern`: context から認証トークンと接続中 Kubernetes context 群を取り出し、各 context の kubeconfig を生成 (`design_engine_handler.go:209-231`)
6. ステージチェーンを組む: `Format → Filler → Validator(verify の時だけ実検証) → DryRun または Provision → 結果集約`。`Import` や `Persist` ステージはコメントアウト済み (`design_engine_handler.go:257-297`)
7. チェーン自体は「各ステージが next を呼ぶ」継続渡しの単純な実装 (`server/models/pattern/stages/chain.go:12-18`, `:46-70`)
8. Provision ステージ: annotation (配備しない注釈用 component) を除き、`planner.CreatePlan` で依存グラフを作り、循環を検査 (`IsFeasible`)、`plan.Execute` で各 component を配備 (`server/models/pattern/stages/provision.go:32-58`, `:70-134`)
9. 依存グラフ: component の `metadata.dependsOn` に書かれた名前を ID に解決して辺を張る。undeploy では辺を逆向きにする (`invert`) (`server/models/pattern/planner/planner.go:95-142`)
10. 並列実行: ノードごとに goroutine。各ノードは依存の数だけ成功/失敗シグナルを待ち、1 つでも失敗なら自分は実行せず「withheld」として下流にも失敗を伝播 (`server/models/pattern/planner/parallel_process.go:86-144`)
11. 各 component の配備は `serviceActionProvider.Provision` → host (接続先) に port メタデータがなければローカル処理として `patterns.Process` を呼ぶ。adapter 向け (port あり) なら gRPC へ (`server/handlers/design_engine_handler.go:570-610`)
12. `patterns.Process`: kubeconfig ごとに goroutine。Kubernetes 以外の model で依存ハンドラがあれば先に前提物 (CRD/operator 等、`HandleDependents`) を入れ、その後 `k8s.Deploy` (`server/models/pattern/patterns/patterns.go:47-140`)
13. `k8s.Deploy`: component から K8s リソース構造を作り YAML 化、meshkit の `ApplyManifest` で `Update: true` / `Delete: isDel` で適用 (`server/models/pattern/patterns/k8s/k8s.go:24-45`)
14. 結果はイベント (`persistAndPublish`) と HTTP レスポンスで返す (`design_engine_handler.go:168-197`)

設計判断:

- **Push 型の配備**。Server が kubeconfig を持ち、API server に直接 apply する。GitOps の pull 型 controller (Argo CD/Flux) とは逆。継続的な reconcile ループは無く、deploy は 1 回の要求
- **マルチクラスタは fan-out**。接続中の全 context に goroutine で同じ component を流す (`patterns.go:72-140`)
- **失敗の扱いを細かく残す**。依存の失敗で実行されなかった component も「withheld」として結果に残す (`provision.go:100-134` のコメント)。CRD 直後に CR を作ると失敗しうる問題をコメントで自認 (`parallel_process.go:137-138`)

### 状態の取り込み: MeshSync

- MeshSync の deploy モードは `operator` と `embedded`。既定は embedded (`server/models/connections/meshsync_deployment_mode.go:40-45`)。docs も「既定ではクラスタに何も入れず Server 内で MeshSync が走る。operator モードの時だけ Operator/MeshSync/Broker を `meshery` namespace に入れる」(S14)
- operator モードは NATS broker、embedded モードは in-process の channel broker を作り libmeshsync を起動。どちらも同じ `MeshsyncDataHandler` に渡す (`server/models/meshery_controllers.go:392-412`)
- `MeshsyncDataHandler.Run` は `meshery.meshsync.core` (イベント) と `meshery-server.meshsync.store` (全量) を購読し、全量を要求する (`server/models/meshsync_events.go:22-28`, `:93-117`)
- 受信イベントの ADD/UPDATE/DELETE をそのまま SQLite に Create/replace/Delete。ADD で Create が失敗したら replace に倒す (MeshSync 再起動時の初回同期が ADD で来るため) (`meshsync_events.go:246-287`)

### 拡張点

- Provider: `Provider` interface は `server/models/providers.go:579-780` の約 200 行。認証、設定、design/結果の永続化などを丸ごと抽象化。実装は `DefaultLocalProvider` (`server/models/default_local_provider.go:43`, 名前は `"Local"` `:84`) と `RemoteProvider` (`server/models/remote_provider.go:80`)
- Adapter: gRPC `MeshService` (`server/meshes/meshops.proto:7-16`)
- Model: `models/` ディレクトリを起動時に seed (`server/models/seed_models.go:19`, `:155-175`)
- UI extension: Remote Component (`AGENTS.md`)

## 内部実装の素材

### 起動 (`server/cmd/main.go`)

- `models.GetNewDBInstance()` → `meshmodel.NewRegistryManager(dbHandler)` (`server/cmd/main.go:229-235`)
- seed は別 goroutine。`RunSeedStage` で段階ごとに recover するので、1 段の panic で HTTP listener が落ちない。順に user keys → models (`SeedComponents`) → policies (Rego インスタンス) (`server/cmd/main.go:318-345`)
- `SeedComponents` は `ModelsPath = "../../models"` 配下の model ディレクトリを全部 registration helper に通す (`server/models/seed_models.go:19`, `:155-175`)

### 中核データ構造

- `stages.Data`: `Pattern *PatternFile`、`DeclartionToDefinitionMapping` (宣言 ID → 定義)、`Other map[string]interface{}` (ステージ間の受け渡し) + `Lock` (`server/models/pattern/stages/chain.go:12-18`)。Provision 結果は `Other["<id>.isProvisioned"]` に入る (`provision.go:24`, `:117-119`)
- `Plan{design, Graph}` と `ParallelProcessGraphNode` (DepCount、DepUpdateCh、DepCancleCh) (`planner.go:95-142`, `parallel_process.go:96-160`)。チャネルは DepCount だけバッファされ、各依存は 1 回だけ送るのでブロックしない (`parallel_process.go:153-160` のコメント)
- `DeploymentMessagePerContext{Summary, SystemName, Location}` (`patterns.go:41-45`)

### 深掘りパス: 関係性評価 (`POST /api/registry/relationships/evaluate`、旧 alias `/api/meshmodels/...`)

- ルート `handleRegistry("/relationships/evaluate", ... h.EvaluateRelationshipPolicy)` (`server/router/server.go:361`)。`handleRegistry` は `/api/registry` と deprecated の `/api/meshmodels` の両方に登録 (`server/router/server.go:70-73`)
- `Handler.EvaluateDesign`: design を hydrate → `USE_GO_POLICY_ENGINE` が true なら Go エンジン、false なら OPA/Rego (コメントに「default」) (`server/handlers/policy_relationship_handler.go:339-400`, 分岐は `:368`, `:386-396`)
- 評価は収束まで繰り返す。上限 `MAX_RE_EVALUATION_DEPTH = 5` (`policy_relationship_handler.go:270`, `:384`, `:423-430`)。最後に (op, id) で action を重複除去 (`:438-439`)
- `USE_GO_POLICY_ENGINE` の既定: docs の表では `false`、`make server` は `true` にする (`docs/content/en/installation/advanced/environment-variables.md:68`、`install/Makefile.core.mk:78`)。つまり本番既定は Rego、開発時は Go (S15)
- Rego ポリシーは `models/meshery-core/0.7.2/v1.0.0/policies/*.rego` (`server/models/seed_models.go:21`)
- Go エンジン: `NewGoEngine` が 6 ポリシーを登録 (MatchLabels / Alias / EdgeNonBinding / EdgeBinding / HierarchicalParentChild / HierarchicalWallet) (`server/policies/engine.go:23-34`)
- パイプライン: Phase 1 既存関係の検証 (消えた component の関係を deleted に) → Phase 2 新しい関係の識別 → Phase 2.5 不足する親 (Namespace 等) の自動追加 → Phase 3 副作用 (設定パッチ等)。各フェーズ間で action を design に適用 (`server/policies/engine.go:89-136`、説明は `server/policies/doc.go:6-34`)
- 決定性の契約: map の反復順を出力に漏らさない、関係 UUID は正準 JSON の UUIDv5 (`server/policies/doc.go:75-91`)
- 同じ Go エンジンを `GOOS=js GOARCH=wasm` でビルドしてブラウザ側でも評価できる (`server/policies/wasm/main.go:1-5`, `:33-44`)

### 驚いた点 (コードからしか見えない)

- DB は SQLite で、docs は「キャッシュ」と明言 (S11、`sql-utils.go:101-105`)。upstream の AGENTS.md の PostgreSQL 記述とズレ
- MeshSync の既定は embedded。「Meshery = クラスタに Operator を入れる」は過去の姿 (`meshsync_deployment_mode.go:44`)
- 関係性評価は Rego と Go の 2 実装が併存し、環境変数で切替。Go 側は Rego との parity をテストで取る (`server/policies/policy_inventory.go:23` のコメント、`wasm_diff_test.go`)
- deploy チェーンに `Persist` `Import` ステージの跡がコメントで残る (`design_engine_handler.go:259`, `:274-275`)
- adapter 呼び出しの前に `time.Sleep(50 * time.Microsecond)` で並行 client 生成の不具合を回避する「Hack」コメント (`design_engine_handler.go:584-587`)
- 負荷試験は fortio のみ。旧 `wrk2` プロファイルも fortio で走る (`server/handlers/load_test_handler.go:138-139`)

## 採用事例の素材

- `ADOPTERS.md` (pin 時点) に 18 組織: Asteria Aerospace、AYA Innovation Labs、BootLabs、DigitalOcean、Ericsson、F5、HPE Labs (Cloudless)、HPE Security Engineering、Infor、Intel、Intraserve Systems、Metabit Trading、Metabob、OD10 Ventures、PITS Global Data Recovery Services、Red Hat、SolarWinds、TCS Labs (S13)。各行は社名とリンクだけで、用途の記述は無い
- CNCF ブログは「航空宇宙、通信、ネットワーク、エンタープライズソフトウェア」の組織が使うと書くが社名は出さない (S7)
- TOC レビュー (2025-01) では adopter インタビュー用の提出が未了と指摘 (S6)。ADOPTERS 以上の裏付けは薄い
- v1.0 GA ブログの testimonial (Stripe の Tech Lead 等) は個人の発言で、会社としての採用を示さない。adopter として使わない (S10)
- メンテナの所属 (MAINTAINERS.md): Layer5、Moneris、Intuit、USyd、OD10、Independent 等 (S16)。所属は adopter ではない
- シグナル: GitHub stars 12,203 / forks 4,187 (2026-11-15、GitHub API) (S2)。CNCF ブログは「ほぼ 15,000 stars、6,800+ forks」と書き、数字が合わない。ページでは GitHub API の値を日付付きで使う。CNCF ブログの数字: 7,000+ contributors、1,000 組織、CNCF で 5 番目の velocity (2025-07〜2026-07) (S7)。DevStats は S17
- リリース数: 9 ページ × 100 件超 (v0.0.1 〜 v1.0.79) (S3)

## 代替・エコシステム

- 関連 repo: `meshery/meshkit` (共通ライブラリ、`go.mod` で v1.0.29)、`meshery/meshsync` (v1.0.3)、`meshery/schemas` (OpenAPI が単一の真実、v1.3.116) (S1 `go.mod`、`AGENTS.md`)
- `meshery-extensions` org: adapter や統合の置き場 (S10)
- Kanvas: Meshery extension として提供される visual designer (S10)。どの org/ライセンスかは S10 に記述なし。ページでは「extension」以上は言わない
- Service Mesh Performance (SMP): Layer5 が同時期に CNCF に寄贈した性能測定仕様 (S8)
- 代替:
  - Argo CD / Flux: Git を真実とし controller が pull して reconcile。Meshery は Server が push で apply し、継続 reconcile しない (上の設計判断)
  - Crossplane: K8s API を拡張して外部リソースを reconcile する control plane。Meshery は K8s の外側にいる管理ツールで、CRD を通して管理するわけではない
  - Headlamp / Kubernetes Dashboard / Lens: クラスタの閲覧・操作 UI。Meshery は Design (宣言 + 関係性評価) とマルチクラスタ配備が軸
  - Kiali: Istio 専用の可視化。Meshery の初期 (mesh 管理) と重なるが、Meshery は mesh 非依存

## 分類

- CNCF landscape: `Provisioning` → `Automation & Configuration` (S5、`landscape.yml` の Meshery 項目、`project: incubating`, `accepted: 2021-06-22`, `incubating: 2026-09-14`)
- tools.ts の現エントリは `App Definition & GitOps` / `Sandbox` / `card`。landscape の Automation & Configuration は本サイトでは Crossplane と OpenTofu が `Provisioning & Infrastructure` に入っている区分なので、Meshery も `Provisioning & Infrastructure` に移す。Meshery は継続 reconcile しない push 型で、Git を真実とする GitOps ツールではない点も理由
- maturity は `Incubating` に更新 (S4)(S5)
