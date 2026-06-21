# recon: authentik

調査メモ。authentik (goauthentik/authentik) はセルフホスト型のオープンソース IdP。SSO, OAuth2/OIDC, SAML, LDAP, RADIUS, SCIM を 1 つのサーバで提供し、forward-auth proxy を outpost として別プロセス (Go) で動かす。

## 基本情報

- repo: goauthentik/authentik
- pinned commit: `9da4c568cfd52c2b40db3a757d33fa3fe51627e0` / 近いタグ: shallow clone のためタグ到達不可。コード内 `VERSION = "2026.8.0-rc1"` (`authentik/__init__.py:6`)。直近の安定リリースタグは `version/2026.5.3` (GitHub Tags API, 2026-06-22 参照)
- 言語 / ビルド: Python 3.14 + Django 5.2 (バックエンド) / Go 1.26 (outpost) / TypeScript + Lit (web フロント) / 一部 Rust。ビルドは `make` (`make install`, `make run`) と docker compose
- ライセンス: コアは MIT。GitHub API は `NOASSERTION` を返す (混在ライセンスのため)。`LICENSE` によると `website/` は CC BY-SA 4.0、`authentik/enterprise/` は専用の Enterprise Edition (EE) ライセンス (source-available, `authentik/enterprise/LICENSE`)、クライアント JS は MIT Expat
- CNCF 成熟度: Independent。CNCF プロジェクトではない (cncf.io/projects を 2026-06-22 に確認、graduated 34 / incubating 39 のいずれにも authentik / goauthentik は不在)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Identity & Policy
- 主エントリポイント: Python サーバは Django + Gunicorn/Uvicorn (`make run`)、Go outpost は `cmd/server/main.go`。プロキシ outpost は `cmd/proxy`, LDAP は `cmd/ldap`, RADIUS は `cmd/radius`, RAC は `cmd/rac`

## 歴史の素材

- 2018-11-11: Jens Langhammer がドイツ・ハンブルクで個人プロジェクトとして最初のコミット ([authentik blog "Happy Birthday to Us!"](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/), 2026-06-22 参照)
- 2019-12-30: GitHub リポジトリ goauthentik/authentik 作成 (GitHub API `created_at`, 2026-06-22 参照)
- 2021-10 頃: Reddit など自宅サーバ界隈でコミュニティの注目を集める ([同 blog](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/))
- 2022-04: Open Core Ventures が Jens に資金提供を打診 ([同 blog](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/))
- 2022-11: Authentik Security, Inc. 設立 (public benefit company)。Jens Langhammer が CTO、Fletcher Heisler が CEO。open core モデルで運営 ([同 blog](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/))

ガバナンスは単一ベンダ主導の open core。中立財団の傘下ではなく、Authentik Security, Inc. が方向性を決める。これが CNCF プロジェクトとの本質的な差。

## アーキテクチャの素材

トップレベルは 3 言語の混成。

- `authentik/` : Python/Django のコア。サブパッケージが機能を所有する。`policies/` (認可ポリシエンジン), `flows/` (認証フローのプランナ/実行器), `providers/` (oauth2 / saml / ldap / proxy / rac / radius / scim), `sources/` (外部 IdP/ディレクトリ連携), `stages/` (フロー内の各ステップ), `core/` (User/Group/Application/Token), `rbac/`, `outposts/`, `blueprints/` (宣言的設定), `events/`, `brands/`, `enterprise/`
- `web/` : TypeScript + Lit のフロントエンド (admin UI とフロー executor の UI)
- `cmd/` + `internal/` : Go の outpost 群。`internal/outpost/proxyv2/` が forward-auth リバースプロキシ本体
- `lifecycle/`, `blueprints/`, `schemas/`, `tests/`

リクエストの流れ (認証):ユーザがアプリにアクセス -> Flow に到達 -> `FlowPlanner.plan()` がフローの直接ポリシを `PolicyEngine` で評価 (`authentik/flows/planner.py:280`) -> 通れば各 `FlowStageBinding` をポリシ評価して実行すべき `Stage` の平坦なリスト (`FlowPlan`) を組む (`planner.py:310`) -> `FlowExecutorView` がセッション (`SESSION_KEY_PLAN`, `authentik/flows/views/executor.py:66`) にプランを保持し、ステージを順に GET/POST で進める。

forward-auth proxy の流れ (Go outpost):`ProxyServer.Handle` (`internal/outpost/proxyv2/handlers.go:87`) が host で app を引く (`lookupApp`, `handlers.go:43`)。`forward_auth_domain` モードでは cookie ドメインの最長一致で app を決める (`handlers.go:54-84`) という非自明なルーティングがある。

## 内部実装の素材

中核オペレーションとして「ポリシチェック」を端から端まで追った。

1. `PolicyEngine.__init__` でターゲット (`PolicyBindingModel`) とユーザから `PolicyRequest` を作る (`authentik/policies/engine.py:51`)。
2. `bindings()` が `target` に紐づく有効バインディングを `order` 順に取得 (`engine.py:72`)。
3. `compute_static_bindings()` が user/group 直接バインディングを単一の SQL 集計 (`Count` + `Q`) で解決する (`engine.py:105-146`)。プロセスを立てずに「全部 pass / どれか pass」を DB 側で数える。
4. `build()` が残りの policy バインディングごとに `PolicyProcess` を fork で起動し、結果を `Pipe` で受け取る (`engine.py:168-203`)。実行コンテキストが daemon でなければ同期 `run()`、daemon なら `start()` で並列。
5. 各プロセスは `PolicyProcess.execute()` で `binding.passes(request)` を呼ぶ (`authentik/policies/process.py:73-83`)。
6. `PolicyBinding.passes()` が policy / group / user を振り分ける (`authentik/policies/models.py:111-120`)。Expression ポリシなら `PolicyEvaluator.evaluate()` が Python 式を評価して truthy を `passing` に変換 (`authentik/policies/expression/evaluator.py:65-89`)。
7. 結果は `cache_key()` (session_key + user.pk で構成, `process.py:26-33`) でキャッシュされ (`process.py:108-110`)、`PolicyEngine.result` が `MODE_ALL` なら `all()`、`MODE_ANY` なら `any()` で合成する (`engine.py:219-222`)。

中核データ構造:

- `PolicyRequest` (`authentik/policies/types.py:23`) : user / http_request / obj / context / debug を持つ評価入力。`should_cache` は未認証ユーザと debug を弾く (`types.py:46-53`)
- `PolicyResult` (`types.py:67`) : passing / messages / source_results / source_binding。結果のツリーをそのまま保持する
- `PolicyBinding` (`authentik/policies/models.py:62`) : policy か group か user の 1 つに刺さる多態バインディング。`negate`, `timeout`, `failure_result`, `order` を持つ
- `FlowPlan` (`authentik/flows/planner.py:63`) : 実行すべき `FlowStageBinding` と `StageMarker` の並行リスト。`next()` がマーカ経由で次ステージを返す (`planner.py:94-112`)
- `PolicyEngineMode` (`models.py:20`) : `all` / `any` の合成モード

非自明な設計判断 (コードを読まないと見えない):ポリシ評価を Python の `multiprocessing` fork で 1 ポリシ = 1 OS プロセスに分離している (`process.py:21-23` の `FORK_CTX = get_context("fork")`、`engine.py:175-185`)。ユーザ定義の Expression ポリシが任意 Python を実行するため、各々を別プロセスに隔離しタイムアウト (`binding.timeout`, `models.py:102`) で打ち切る。さらに static な user/group バインディングは `compute_static_bindings` で DB 集計に落としてプロセス生成自体を回避する (`engine.py:105`)。重い式評価の隔離と、単純メンバーシップ判定の高速化を両立させている。

## 採用事例の素材

- GitHub スター 22,091 / fork 1,663 / watcher 68 (GitHub REST API, 2026-06-22 参照)。コントリビュータはページネーション上 anon 込みで約 557 ページ (`per_page=1`) 規模 (GitHub API, 2026-06-22 参照)
- リポジトリに `ADOPTERS` ファイルは存在しない (`ls` で確認、2026-06-22)。出典付きで名指しできる採用組織を確認できなかったため、ここでは具体的な組織名は記載しない。レビュー記事は self-hosting コミュニティと Okta/Auth0 の代替を探す層での普及に言及するが ([opentechhub](https://www.opentechhub.io/authentik/), 2026-06-22 参照)、これは個別組織の一次出典ではない

## 代替・エコシステム

- 代替: Keycloak (Red Hat、最も近い OSS フル機能 IdP だが UI が複雑)、Authelia (軽量 forward-auth 特化、IdP としては機能が少ない)、Zitadel、Ory。商用は Okta / Auth0 / Microsoft Entra ID。authentik の本質的な差は、ビジュアルエディタで認証フローを組み立てる "Flow + Stage + Policy" モデルと、プロトコル (OIDC/SAML/LDAP/RADIUS/RAC/SCIM) を 1 サーバで束ねる点 ([elest.io 比較記事](https://blog.elest.io/authentik-vs-authelia-vs-keycloak-choosing-the-right-self-hosted-identity-provider-in-2026/), 2026-06-22 参照)
- エコシステム/統合: forward-auth outpost が Traefik / nginx / Envoy の認証ゲートに使える。公式 Helm チャート (goauthentik/helm)、Docker Compose、Kubernetes デプロイ。ソーシャルログインや LDAP/SCIM で外部ディレクトリと双方向連携
- 最小構成: 2 CPU / 2GB RAM のホストで docker compose。`curl -O https://docs.goauthentik.io/compose.yml` -> `.env` に `PG_PASS` と `AUTHENTIK_SECRET_KEY` を `openssl rand` で生成 -> `docker compose pull && docker compose up -d` -> `http://<host>:9000` で初期 `akadmin` を設定。PostgreSQL と Redis は compose に同梱 ([docs install/docker-compose](https://docs.goauthentik.io/install-config/install/docker-compose), 2026-06-22 参照)
