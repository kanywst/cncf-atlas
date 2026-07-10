# recon: dex

調査メモ。自分用の密度。出典は sources.md に番号で。すべて pinned commit で確認。

## 基本情報

- repo: dexidp/dex (canonical。`gh repo view` で確認、CNCF landscape も dexidp/dex) [S1][S2]
- pinned commit: `17a54e9046cee1142530de4d0a809809d7c9cee9` (2026-07-07) / 近いタグ: `v2.45.0` (describe: `v2.45.0-248-g17a54e9`)。最新リリースは `v2.45.1` (2026-03-03) [S1]
- 言語 / ビルド: Go (go 1.25.8, go.mod)。`make build` → `cmd/dex`。テストは `go test ./...`、`make test`
- ライセンス: Apache License 2.0 [S1]
- CNCF 成熟度: Sandbox (2020-06-25 受理、以降 Sandbox のまま) [S3][S4]
- カテゴリ (CATEGORY_ORDER から): Identity & Policy
- 規模: server 9.8k LOC / connector 8.4k LOC / storage 59k LOC (ent 生成コード込み)。connector は 16 種、`.pb.go` 等の生成物あり (`api/api.pb.go`, `server/internal/types.pb.go`)

## 一言でいうと

Dex は「フェデレーテッド OpenID Connect プロバイダ」。クライアントは OIDC/OAuth2 だけ喋れば済み、
実際の認証は LDAP・SAML・GitHub・Google などの上流 IdP に「コネクタ」で委譲する。
Dex が発行する ID Token (JWT) は Kubernetes API server の OIDC プラグインや AWS STS がそのまま消費できる [S1]。

## 歴史の素材

- **起源: CoreOS**。Dex は CoreOS, Inc. が作った認証サービス。repo は 2015-08-17 作成 [S1][S4]。
  README の JWT サンプルに `eric.chiang@coreos.com` / `coreos.com` が残っており CoreOS 由来を裏付ける (README.md) [S1]。
- **v1 → v2 の書き直し**: 初期 dex はより重厚な独自 IdP だったが、v2 で「純粋な OIDC プロバイダ + コネクタ委譲」モデルに再設計された。
  現行の tag は `v2.x` 系のみ (リポジトリの tag は v2.45 系) [S1]。※ v2 リライトの正確な日付は二次情報のみ、必要なら write 前に一次ソース (CoreOS blog) を要確認。
- **CoreOS 買収と宙ぶらりん**: CoreOS が Red Hat に買収された後、プロジェクトはメンテが停滞。
  活発なユーザーコミュニティが「中立な家」を求めて CNCF への寄贈を要望した [S3]。
- **CNCF Sandbox 受理: 2020-06-25**。TOC issue #363 / PR #379 で提案、Sandbox として受理 [S3][S4]。
  寄贈時点で既に community-driven (CoreOS/Red Hat/IBM いずれの所有でもない) と PR に明記 [S3]。
- 現在も MAINTAINERS.md / CONTRIBUTING.md を持つコミュニティ運営。contributors は約 260 名 (GitHub API contributors ページネーション last=260) [S1]。

## アーキテクチャの素材

### トップレベルのコンポーネント

- **`server/`**: OIDC/OAuth2 認可サーバ本体。HTTP ハンドラ、トークン発行、鍵管理、Discovery、gRPC API。
  ルーティングは `server/server.go:530-581` で登録 (`/auth`, `/auth/{connector}`, `/callback`, `/callback/{connector}`, `/approval`, `/token`, `/keys` など) [S1]。
- **`connector/`**: フェデレーション戦略。`connector/connector.go` がインターフェース群を定義。
  実装は `connector/{ldap,github,gitlab,google,microsoft,oidc,oauth,saml,openshift,keystone,linkedin,bitbucketcloud,gitea,atlassiancrowd,authproxy,mock}` の 16 種 [S1]。
- **`storage/`**: 状態の抽象化。`storage/storage.go:78` の `Storage` インターフェースを、
  `memory`, `sql` (ent 経由で sqlite/postgres/mysql), `etcd`, `kubernetes` (CRD) が実装 [S1]。
- **`api/`**: 管理用 gRPC API (`api/api.proto`, 191 行)。クライアント/パスワード等を外部から CRUD。

### コネクタのインターフェース設計 (connector/connector.go)

- `Connector interface{}` は空。実体は用途別インターフェースの実装で判定される (型スイッチ)。
  - `PasswordConnector` (`:58`): username/password を直接受ける (LDAP など)。`Login()` を持つ。
  - `CallbackConnector` (`:65`): OAuth2 リダイレクトフロー。`LoginURL()` と `HandleCallback()` [S1]。
  - `SAMLConnector` (`:91`): SAML POST binding。`POSTData()` / `HandlePOST()`。
  - `RefreshConnector` (`:109`): refresh token 時に上流のクレームを更新 `Refresh()`。
  - `TokenIdentityConnector` (`:116`) / `LogoutCallbackConnector` (`:125`): token exchange と RP-Initiated Logout。
- `Identity` (`:38`) が上流から得た正規化済みユーザ情報 (UserID/Username/Email/Groups/ConnectorData)。
  `ConnectorData` は上流アクセストークン等を保持し、エンドユーザや OAuth クライアントには決して渡さない (`:47-51`) [S1]。

### 代表的な操作の end-to-end トレース: OIDC 認可コードフロー

下流クライアントが OIDC でログイン、Dex が上流 OIDC IdP (`connector/oidc`) に委譲するケース。

1. **`GET /auth`** → `server/handlers.go:167 handleAuthorization`。
   `client_id` から client を引き (`:196`)、`ListConnectors` して client の `AllowedConnectors` で絞り込み (`:201,:214`)。
   コネクタが 1 つなら `/auth/{connector}` に 302 リダイレクト (`:229`) [S1]。
2. **`GET /auth/{connector}`** → `server/handlers.go:346 handleConnectorLogin`。
   `parseAuthorizationRequest` で AuthRequest を組み立て、client の許可コネクタか検証 (`:376`)、
   `authReq.ConnectorID = connID` をセットし `CreateAuthRequest` で storage に保存 (`:411`)。
   その後コネクタ種別に応じ `LoginURL()` を呼んで上流 IdP にリダイレクト [S1]。
3. **上流 IdP でユーザ認証** → `connector/oidc/oidc.go:442 LoginURL` が
   `oauth2Config.AuthCodeURL(state, ...)` を生成。`state` に Dex の AuthRequest ID が入る。
   offline_access 要求時は上流にも `AccessTypeOffline`+`prompt` を付ける (`:456`)。PKCE 対応 (`:459-473`) [S1]。
4. **`GET /callback/{connector}?state=...&code=...`** → `server/handlers.go:701 handleConnectorCallback`。
   `state` から AuthRequest を復元 (`:721`)、コネクタ型スイッチ (`:751`) で
   `CallbackConnector.HandleCallback` を呼ぶ (`:760`) [S1]。
5. **`connector/oidc/oidc.go:499 HandleCallback`**: 上流の code を
   `oauth2Config.Exchange` でトークン交換し (`:519`)、`createIdentity` (`:559`) で ID Token を検証して
   `connector.Identity` に正規化して返す [S1]。
6. **`server/handlers.go:814 finalizeLogin`**: `Identity` を `storage.Claims` に写し、
   `UpdateAuthRequest` で `LoggedIn=true` + Claims + AuthTime を書き込む (`:823-831`)。
   offline_access かつ `RefreshConnector` 実装なら OfflineSession を作成/更新 (`:853-864`) [S1]。
7. **承認画面 → `server/handlers.go:960 handleApproval`** (skipApproval なら省略し `sendCodeResponse` に直行)。
8. **`server/handlers.go:1054 sendCodeResponse`**: `response_type=code` の場合
   `storage.AuthCode` を発行 (`:1096`, 有効期限 30 分)、AuthRequest を削除 (`:1063`)、
   redirect_uri に `?code=...&state=...` を付けてクライアントに返す [S1]。
9. **`POST /token`** (grant_type=authorization_code) → `server/handlers.go:1261 handleToken`
   → `:1312 handleAuthCode`。code を storage から取得し失効/クライアント一致を検証 (`:1323`)、
   **PKCE 検証** (RFC 7636, `:1332-1357`): 保存済み code_challenge と code_verifier を突き合わせ [S1]。
10. **`server/handlers.go:1372 exchangeAuthCode`**: `newAccessToken` + `newIDToken` を発行、
    AuthCode を削除 (one-time)、offline_access+RefreshConnector+grant許可の 3 条件が揃えば refresh token を発行 (`:1392-1425`) [S1]。
11. **`server/oauth2.go:346 newIDToken`**: issuer/subject/nonce/exp/iat/jti を詰め、
    `at_hash` / `c_hash` を計算 (`:378-393`)、scope に応じ email/groups クレームを追加、
    `signer.Algorithm` で決めた鍵で JWT に署名 [S1]。

### 設計判断

- **フェデレーション (委譲)**: Dex 自身はユーザ DB を持たない前提。上流 IdP へ委譲し、
  下流には単一の OIDC 面だけを見せる。「クライアントは OIDC を一度実装すれば、あとは Dex が上流プロトコルを吸収する」(README) [S1]。
- **storage 抽象化**: `Storage` インターフェース (`storage/storage.go:78`) で状態層を差し替え可能に。
  Kubernetes CRD をバックエンドにできるため「クラスタネイティブに追加 DB 無しで動く」(README の K8s 節) [S1]。
- **Update はトランザクション + updater 関数**: `UpdateClient` などは `func(old T) (T, error)` を受け、
  楽観的更新のリトライ前提 (storage.go:130-141 のコメント: updater は複数回呼ばれ得る) [S1]。
- **ConnectorData の非公開**: 上流トークンは storage 内に閉じ、下流トークンには漏らさない設計 (connector.go:47-51) [S1]。
- **SAML コネクタは非推奨警告**: README のコネクタ表で SAML 2.0 は
  「Unmaintained and likely vulnerable to auth bypasses (#1884)」と明記されている [S1]。write でトレードオフとして触れる価値あり。

## 内部実装の素材

### 効いてくるディレクトリ

- `server/handlers.go` (最重要、認可コードフローの大半): `handleAuthorization:167` /
  `handleConnectorLogin:346` / `handleConnectorCallback:701` / `finalizeLogin:814` /
  `handleApproval:960` / `sendCodeResponse:1054` / `handleToken:1261` / `handleAuthCode:1312` /
  `exchangeAuthCode:1372` / `handleUserInfo:1532` / `handlePasswordGrant:1563` /
  `handleTokenExchange:1804` / `handleClientCredentialsGrant:1914` [S1]。
- `server/oauth2.go`: `newAccessToken:299` / `newIDToken:346` / at_hash 計算 `accessTokenHash:237` /
  JWT 検証 (ParseSigned で許可アルゴリズムを明示: RS/ES 256/384/512, `:773`) [S1]。
- `server/refresh.go`, `server/refreshhandlers.go`: refresh token grant のローテーション。
- `server/deviceflowhandlers.go`: OAuth2 Device Authorization Grant。
- `server/mfa.go` / `mfa_webauthn.go`: TOTP と WebAuthn の MFA (feature flag 越し)。
- `connector/oidc/oidc.go`: 代表コネクタ。`LoginURL:442` / `HandleCallback:499` / `Refresh:527` / `createIdentity:559`。
- `storage/storage.go`: 型と `Storage` interface。`storage/ent/` は ent(entgo) 生成の SQL バックエンド、
  `storage/ent/schema/*.go` にエンティティ定義 (authcode, authrequest, client, refreshtoken, useridentity, authsession, ...) [S1]。

### 中核データ構造 (storage/storage.go)

- `AuthRequest` (`:239`): 認可フロー中の一時状態。ConnectorID / Scopes / Claims / LoggedIn / RedirectURI / PKCE / Expiry。
- `AuthCode` (`:308`): 発行された認可コード。Claims / ConnectorData / PKCE / AuthTime を保持し 30 分で失効。
- `RefreshToken` (`:347`): 永続的な refresh。Token / Claims / ConnectorData / LastUsed。
- `Client` (`:162`): OAuth2 クライアント (Secret, RedirectURIs, AllowedConnectors 等)。
- `Connector` (`:527`): storage に永続化されたコネクタ設定 (ID, Type, Config, GrantTypes)。動的コネクタ管理を可能にする。

### 追う価値のあるパス: PKCE 検証 (RFC 7636)

`server/handlers.go:1332-1357 handleAuthCode`。保存済み `authCode.PKCE.CodeChallenge` と
POST の `code_verifier` を突き合わせる 4 分岐:

- 両方あり → `calculateCodeChallenge` して不一致なら `invalid_grant` (`:1347`)。
- verifier だけあり (auth 側に challenge 無し) → `invalid_request` "No PKCE flow started" (`:1352`)。
- challenge だけあり (token 側に verifier 無し) → `invalid_grant` "Expecting parameter code_verifier" (`:1356`)。
- 両方なし → 素通り。

PKCE を「開始したなら完了必須」にしている点が非自明。downgrade 攻撃を防ぐ実装。

### 非自明な選択

- `Connector` が空インターフェースで、能力は型アサーションで判定 (connector.go:26)。
  コネクタは自分ができること (password/callback/saml/refresh/logout) だけ実装すればよい。
- refresh token 発行の 3 条件 (RefreshConnector 実装 / grantTypes に refresh_token / offline_access scope) は
  `exchangeAuthCode` 内クロージャ `reqRefresh` (`:1392`) に集約。満たさなければエラーでなく黙って省略 (RFC 6749 §1.5 準拠のコメント付き)。
- ID Token 検証時に許可署名アルゴリズムを `ParseSigned` にホワイトリストで渡す (`server/oauth2.go:773`)。alg 混乱攻撃対策。

## 採用事例の素材 (出典必須・ADOPTERS.md ベース) [S5]

Projects (OSS への埋め込みが Dex の主戦場):

- **Argo CD**: web UI/CLI の SSO に Dex を統合 (ADOPTERS.md) [S5]。
- **sigstore**: 公開 Fulcio インスタンスの認証に Dex (OIDC ベース ID に紐づく code signing CA) [S5]。
- **Kubeflow**: Kubeflow Platform の外部 OIDC 認証コンポーネントとして Dex [S5]。
- **Kyma**: Kubernetes API server 認証と各種 UI (Grafana/Loki/Jaeger) 保護に Dex [S5]。
- **LitmusChaos**: ChaosCenter の OAuth2 ログインに Dex [S5]。
- **Chef (Automate)** / **Pydio Cells** / **Kasten K10** / **Terrakube** / **LLMariner**: いずれも ADOPTERS.md に記載 [S5]。

Companies:

- **Ericsson** (Cloud Container Distribution の K8s API 認証) / **Banzai Cloud** / **Flant** /
  **Aspect** / **Pusher** / **JuliaBox** / **Elastisys (Welkin)**: ADOPTERS.md 記載 [S5]。

GitHub シグナル (2026-07-08 時点, `gh repo view`) [S1]:

- Stars: 10,946 / Forks: 1,950 / Contributors: 約 260 名 / License: Apache-2.0 / 最新リリース v2.45.1。
- OpenSSF Scorecard と OpenSSF Best Practices バッジあり (README)。

## 代替・エコシステム

- **Keycloak** (Red Hat, CNCF 外): フル機能の IAM。ユーザ DB・管理 UI・ロール管理を内蔵。
  Dex が「薄い委譲プロキシ」なのに対し Keycloak は「重量級の IdP 本体」。運用コストと機能の両方で対極。
- **Zitadel**: マルチテナント・監査・セルフサービス志向のモダン IdP (Go)。Dex より製品寄り。
- **Ory Hydra**: OAuth2/OIDC サーバに特化し、ログイン UI やユーザ管理は持たず外出し。
  Dex と近いが、Dex は「上流 IdP へのコネクタ委譲」が売り、Hydra は「認証は完全に別実装に委ねる」設計思想。
- **Authelia**: リバースプロキシ前段の認証/2FA ゲート。用途 (アプリ保護) が近接するが OIDC provider 化は後発。
- エコシステム: **Kubernetes** API server の OIDC 認証 (kubelogin/kubectl 経由)、**AWS STS**、
  **oauth2-proxy** との組み合わせでの web UI 保護が定番 (README) [S1]。管理は gRPC API (`api/api.proto`)。

## write に向けたメモ / 薄い所

- v2 リライトの正確な時期・動機は一次ソース (CoreOS blog / v2 リリースノート) を write 前に一つ引きたい。現状は README のコード痕跡と二次情報のみ。
- SAML コネクタの非推奨警告 (#1884) はトレードオフ節で扱う。
- adoption は ADOPTERS.md が一次ソースとして十分厚い。CNCF case study は未確認 (あれば追加可)。
