# recon: ZITADEL

調査メモ。API-first / event-sourced / multi-tenant な IdP。CNCF ではない独立系。

## 基本情報

- repo: zitadel/zitadel
- pinned commit: `10087e7389702991b37af8d5c50d5e1e2ec910e3` (short `10087e7`)
- 近いタグ: HEAD は main 上で無タグ (depth-1 clone)。直近のリリースタグは `v4.15.2` (2026-06-17)、最新の version 系タグは `v5.0.0-base`
- 言語 / ビルド: Go 75.8% / TypeScript 11.7% (console + login)。`go.mod` は `go 1.25.0`。単一バイナリ。エントリは `main.go` → `cmd.New(...)` で cobra ルートコマンド
- ライセンス: AGPL-3.0-only (`LICENSE` は GNU AGPLv3 全文)。`LICENSING.md` で例外を明記: `proto/`・`apps/docs/` は Apache-2.0、`apps/login/`・`packages/zitadel-client/`・`packages/zitadel-proto/` は MIT。コントリビューションは Apache-2.0 で受け入れ (CLA なし)
- CNCF 成熟度: Independent (CNCF ホスト project ではない。下記「採用」参照)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Identity & Policy

## 歴史の素材

- スイス St. Gallen の CAOS AG が 2019 年に創業。創業者は Florian Forster (CEO)、Fabienne Bühler、Maximilian Panne ら identity/infra 出身者。GitHub repo の作成日は 2020-03-16 (GitHub API `created_at`)。出典: <https://zitadel.com/about>、<https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a>
- ポジショニング: Auth0 の DX と Keycloak の self-host 柔軟性を、Go 製の event-sourced アーキテクチャで両立させる。multi-tenancy を後付けでなく初期設計から組み込んだのが差別化点。出典: <https://zitadel.com/about>
- 資金: 累計 $15.5M。2022-06-07 に Seed、その後 Nexus Venture Partners リードで $9M の Series A (Floodgate 参加)。出典: <https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a>
- v3 (2025-03-31) で 2 つの大きな転換: (1) ライセンスを Apache-2.0 から AGPL-3.0 へ変更、(2) CockroachDB サポートを廃止し PostgreSQL に一本化 (v2.x の CRDB は 2025-09-30 までメンテのみ)。proto/SDK は gRPC 生成コードへの virality を避けるため Apache-2.0 のまま残した。出典: <https://zitadel.com/blog/zitadel-v3-announcement>、<https://zitadel.com/blog/apache-to-agpl>
- スイス本拠はデータ主権の訴求点。金融・医療・行政向けに Swiss infra でのホスティングを提供。出典: <https://zitadel.com/about>

## アーキテクチャの素材

CQRS + Event Sourcing が骨格。書き込み (command 側) は不変イベントを eventstore に append、読み取り (query 側) はイベントから projection を構築する。すべての状態変更がイベントとして残るため、API でアクセス可能な完全な監査証跡になる。出典: README.md:65、<https://github.com/zitadel/zitadel/discussions/9529>

トップレベルの所有関係:

- `internal/eventstore/` : イベントストア中核。`Push` (書き込み) / `Filter`・`FilterToReducer` (読み取り) / `Search` (field index)。PostgreSQL の `events2` テーブルが正本
- `internal/command/` : 書き込み側ユースケース。ドメイン操作を WriteModel へ reduce し、整合性チェック後に eventstore へ Command を Push する
- `internal/query/` : 読み取り側。projection を SQL テーブルへ materialize して提供
- `internal/api/` : `grpc/`・`http/`・`authz/` などの API 層。gRPC / connectRPC / HTTP-JSON の 3 トランスポートを同一サービス定義から提供
- `internal/api/authz/` : トークン検証 + permission チェック (本 recon で end-to-end を追跡)
- `cmd/` : cobra コマンド (`start`・`setup`・`initialise`・`mirror`・`key` 等)。`cmd/zitadel.go` がルート
- `backend/v3/` : 新世代バックエンドの再構築 (`storage/eventstore`・`storage/database`・`api/{user,org,session,instance}`・`instrumentation/{logging,metrics,tracing}`)。main.go は既に `backend/v3/instrumentation/logging` を import している
- `console/` (Angular)・`apps/login/` (Login V2)・`proto/` (API 定義)・`deploy/` (compose / k8s)

multi-tenant 階層は Instance → Organization → Project → Application。aggregate は必ず `InstanceID` と `ResourceOwner` (= org) を持ち (`internal/eventstore/aggregate.go:79-90`)、これらは context から自動付与される (`aggregate.go:20-26` の `NewAggregate`)。テナント分離がイベント層に焼き込まれている。

## 内部実装の素材

### 追跡: gRPC リクエストの permission チェック (end to end)

1. gRPC unary interceptor `AuthorizationInterceptor` が入口。`internal/api/grpc/server/middleware/auth_interceptor.go:16-43`。`verifier.CheckAuthMethod(info.FullMethod)` で proto の auth option を引き、トークン不要なら素通し (`auth_interceptor.go:23-26`)。
2. `Authorization` ヘッダを取得し、空なら `codes.Unauthenticated` (`auth_interceptor.go:31-34`)。org は header `x-zitadel-orgid` か、req が `OrganizationFromRequest` を実装していればそこから解決 (`auth_interceptor.go:45-56`)。
3. `authz.CheckUserAuthorization(...)` を呼ぶ (`auth_interceptor.go:37`)。本体は `internal/api/authz/authorization.go:24-58`。
   - `VerifyTokenAndCreateCtxData` でトークンを検証し `CtxData` を作る (`authorization.go:28`)。
   - 必要権限が `"authenticated"` なら権限解決をスキップして CtxData だけ ctx に載せる (`authorization.go:34-38`)。
   - そうでなければ `getUserPermissions(...)` (`authorization.go:40`) → `internal/api/authz/permissions.go:25-54`。system membership があればそれを role mapping で permission へ変換 (`permissions.go:33-36`)。なければ `resolver.SearchMyMemberships(ctx, orgID, false)` で membership 取得、0 件なら `true` (継承込み) で再取得し、それでも 0 件なら `AUTHZ-cdgFk membership not found` (`permissions.go:39-51`)。
   - `mapMembershipsToPermissions` で各 membership の role を permission 文字列へ展開。project / project-grant 系の role には `ObjectID` を context として付与し、`project.write:123` の形にする (`permissions.go:88-141`、`addRoleContextIDToPerm` は `permissions.go:120-125`)。
4. `checkUserPermissions(req, requestedPermissions, authOpt)` (`authorization.go:60-78`): permission ゼロなら deny (`AUTH-5mWD2`)。`CheckParam` 未指定なら global permission として許可。`HasGlobalPermission` (context ID なしの perm が 1 つでもあれば true、`authorization.go:111-119`) か、`hasContextPermission` で req の該当フィールド値が perm の context ID と一致すれば許可 (`authorization.go:88-101`)。req フィールドは reflection で引く (`getFieldFromReq`、`authorization.go:103-109`)。
5. 成功時は `CtxData`・`allPermissions`・`requestedPermissions` を ctx に詰める setter を返し、interceptor が `handler(ctxSetter(ctx), req)` を実行 (`auth_interceptor.go:42`、`authorization.go:52-57`)。

permission モデルの実体は文字列 `"<verb>:<resourceID>"` のリスト。RBAC を role から permission へのマッピングテーブルで解決し、resource scoping は `:` 後ろの context ID 一致で判定する。専用の policy DSL を持たない素朴な実装。

### 中核データ構造

- `eventstore.Command` interface (`internal/eventstore/event.go:28-41`): イベントを書き込む「意図」。`Payload() any` (nil / struct / JSON の []byte)、`UniqueConstraints()` (一意制約)、`Fields()` (検索用 index 宣言) を持つ。`action` を埋め込み `Aggregate()`・`Creator()`・`Type()`・`Revision()` を要求 (`event.go:16-25`)。
- `eventstore.Event` interface (`event.go:55-72`): 保存済みアクティビティ。`Sequence() uint64` (aggregate 内連番)、`CreatedAt()`、`Position() decimal.Decimal` (グローバル順序)、`Unmarshal(ptr)` を持つ。
- `eventstore.Aggregate` (`internal/eventstore/aggregate.go:79-90`): `ID`・`Type`・`ResourceOwner` (org)・`InstanceID`・`Version`。テナント識別子が構造体に必須で入る。
- `authz.CtxData` / `authz.Membership` / `authz.RoleMapping`: 認可コンテキスト。membership (org/project の所属と role) を role mapping で permission 文字列へ変換する。`internal/api/authz/permissions.go` 全体が変換ロジック。
- `authz.SystemUserPermissions` (`internal/api/authz/authorization.go:132-160`): system user 用に `MemberType`・`AggregateID`・`ObjectID`・`Permissions` を持ち、`slices.Sort` と `slices.Compact` で重複除去。

### 非自明な設計判断 (コードでしか見えない)

eventstore の `Push` は楽観的並行制御の衝突を**リトライループ**で吸収する。`internal/eventstore/eventstore.go:130-153`。イベントの primary key は `(instance, aggregate, sequence)` 相当で、並行 writer が同じ sequence を取ると PostgreSQL が `events2_pkey` 違反 (SQLSTATE `23505`) を返す。コードはこの制約名を**ハードコードで判定**し、同一トランザクションを最大 `maxRetries` 回まで貼り直す。さらに CockroachDB の `CR000` と serialization failure `40001` も同様にリトライ対象 (`eventstore.go:144-151`)。コメントに issue #7202 が紐づく。アプリ層でロックを取らず DB 制約とリトライで直列化する選択がここに表れている。

もう一つ: イベントは projection を待たずに「フィールド検索」できる。`Command.Fields()` (`event.go:39`) が宣言した値が専用の field index テーブルへ書かれ、`Eventstore.Search` (`eventstore.go:183-190`) で projection 再構築なしに lookup できる。グローバル順序に単調 bigint でなく `shopspring/decimal` の `Position` を使う点 (`event.go:63`、`eventstore.go:266`) も、トランザクション間で順序を保ちつつ後挿入の余地を残すための選択。

## 採用事例の素材

- repo 同梱の `ADOPTERS.md` (利用者が自己申告で維持) に記載のある組織: Rawkode Academy、XPeditionist、devOS: Sanity Edition、CNAP.tech、Minekube、Dribdat、Micromate、Smat.io、hirschengraben、OpenAIP、roclub GmbH、CEEX AG、D1V.AI。出典: <https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md> (自己申告である点に注意)
- ベンダー主張 (一次情報): Series A 時点で「150 社以上」「10k+ stars / 200+ contributors」。出典: <https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a>
- GitHub 実測 (2026-06-22, GitHub API): stars 14,138、forks 1,121、open issues 1,083、watchers 61。contributors はページネーション last=246 で約 246 人 (非匿名)。出典: <https://api.github.com/repos/zitadel/zitadel>、<https://github.com/zitadel/zitadel>
- CNCF: ホスト project ではない (Sandbox/Incubating/Graduated いずれでもない)。競合 Keycloak は 2023-04-10 に CNCF incubation 入りしており対照的。ZITADEL は商用 / dual-license で自走するモデルを明言。出典: <https://landscape.cncf.io/>、<https://zitadel.com/blog/open-source-in-the-ai-era>、検証日 2026-06-22

## 代替・エコシステム

- 直接の代替: Keycloak (Java/Quarkus、CNCF incubating、機能最広で LDAP federation あり)、Ory Hydra+Kratos (Go の API-first microservices、headless)、Authentik (Python/TS、flow UI、LDAP / forward-auth も兼ねる)、FusionAuth、Auth0/Okta (SaaS、非 OSS)。出典: <https://skycloak.io/blog/open-source-authentication-comparison-2026/>、<https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel>
- 本質的な差: (1) event-sourced コアで完全監査証跡を API/webhook で取れる、(2) Instance/Organization/Project の多層 multi-tenancy が初期設計、(3) gRPC + connectRPC + HTTP-JSON の API-first、(4) 外部 session store 不要で水平スケール。出典: README.md:64-68
- 弱点として LDAP サーバや RADIUS の提供がない (OIDC/OAuth/SAML 寄り)。LDAP 提供が要るなら Authentik/Keycloak が適する。出典: <https://skycloak.io/blog/open-source-authentication-comparison-2026/>
- エコシステム: OpenID Connect certified、SAML 2.0、SCIM 2.0 server、Actions v2 (webhook / カスタムコード / token enrichment)、各言語 SDK、Helm chart / Terraform、Kubernetes operator。出典: README.md:117-150、<https://zitadel.com/docs/apis/introduction>
- 最小セットアップ: PostgreSQL (>= 14) 必須。Docker Compose が最短。`curl -LO .../deploy/compose/docker-compose.yml` と `.env.example` を取り、`cp .env.example .env && docker compose up -d --wait`。k8s は Helm。出典: README.md:76-94、<https://zitadel.com/docs/self-hosting/deploy/compose>
