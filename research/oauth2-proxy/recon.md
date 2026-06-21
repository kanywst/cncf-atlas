# recon: OAuth2 Proxy

調査メモ。出典は URL 付き。path:line は pinned commit のもの。

## 基本情報

- repo: oauth2-proxy/oauth2-proxy
- pinned commit: `10b68716e53644a8fa0cbbaf156bf67ef93a017d` (2026-06-14, master) / 直近タグ: `v7.15.3` (2026-06-09, この commit より前)。HEAD は v7.15.3 の後の master 上にあり、タグそのものではない
- 言語 / ビルド: Go (`go 1.26.0`, go.mod L3) / `make build`、実体は `CGO_ENABLED=0 go build -ldflags="-X .../pkg/version.VERSION=${VERSION}"` (Makefile L53-56)
- ライセンス: MIT。`LICENSE` は 17 行の MIT 本文 ("Permission is hereby granted, free of charge ..."、`LICENSE:1`)。go module は `github.com/oauth2-proxy/oauth2-proxy/v7`
- CNCF 成熟度: Sandbox (2025-10-02 受理、出典 1, 2)
- カテゴリ (tools.ts CATEGORY_ORDER): Identity & Policy
- main entrypoint: `main.go` (`func main()` L16)。設定ロード後 `NewOAuthProxy(opts, validator)` で構築し `oauthproxy.Start()` で起動 (`main.go:70-78`)

## 歴史の素材

リネージは Bitly から Pusher fork、独立 org の順。

- 起源は Bitly の `google_auth_proxy` (2014 年頃)。出典 3, 4。
- 2018-11-27 に `bitly/OAuth2_Proxy` から fork。v3.0.0 以降がこの fork 系列で、元の fork とは分岐している (README、出典 5)。
- 2020-03-29 に `pusher/oauth2_proxy` から `oauth2-proxy/oauth2-proxy` へリネーム。以後イメージは `quay.io/oauth2-proxy/oauth2-proxy`、バイナリ名は `oauth2-proxy` (README、出典 5)。
- 2025-10-02 に CNCF Sandbox 受理。申請は cncf/sandbox issue #397、onboarding は #407 (出典 1, 2, 6, 7)。メンテナは「採用拡大が目的ではなく、信頼できる財団下での明確かつ安全なオーナーシップと長期サステナビリティが目的」と表明 (出典 3)。

GitHub repo 作成日は 2017-09-29 (gh api、現 org への移行後の値)。

## アーキテクチャの素材

リバースプロキシ型の認証シム。自身は認証せず、外部 OIDC/OAuth2 プロバイダに委譲し、結果をセッション cookie に持つ。

トップレベル:

- `main.go`: フラグ/設定ロード (legacy toml + alpha YAML の二系統、`loadConfiguration` L84)、`validation.Validate`、起動
- `oauthproxy.go`: 中核の `OAuthProxy` 型と全 HTTP ハンドラ (1369 行)
- `validator.go`: `--email-domain` と `--authenticated-emails-file` による email 許可判定 (`NewValidator`)
- `providers/`: 各 IdP 実装 (google, github, gitlab, azure, keycloak_oidc, oidc, adfs, ms_entra_id ほか)。共通 `Provider interface` は `providers/providers.go:22`
- `pkg/`: apis(options/sessions/providers の型), middleware(セッションロード等), sessions(cookie/redis 永続化), encryption(AES-GCM), cookies, upstream, validation, header, ip, proxyhttp, watcher など

ルーティング (`buildServeMux` `oauthproxy.go:318`, `buildProxySubrouter` L343):

- `/oauth2/auth` (`authOnlyPath`, L54): nginx `auth_request` 等のサブリクエスト用。no-cache を付けないため別登録 (L328-331)
- `/oauth2/sign_in` `/oauth2/start` `/oauth2/callback` `/oauth2/userinfo` `/oauth2/sign_out` (path 定数 L50-55)
- `r.PathPrefix("/")` が最後に `p.Proxy` を catch-all 登録 (L339)

ミドルウェアは `justinas/alice` チェーン。`preAuthChain` (scope 注入, ForceHTTPS, health/ready, request logger; `buildPreAuthChain` L361) から `sessionChain` (セッションロード)、ハンドラの順。

## 内部実装の素材

代表的な中核操作 = 「リクエストが認証済みか判定して upstream へ通す」を end-to-end で追う。

1. catch-all ハンドラ `Proxy` (`oauthproxy.go:1041`):

   ```go
   func (p *OAuthProxy) Proxy(rw http.ResponseWriter, req *http.Request) {
       session, err := p.getAuthenticatedSession(rw, req)
       switch err {
       case nil:
           if !authOnlyAuthorize(req, session) { /* 403 */ }
           p.addHeadersForProxying(rw, session)
           p.headersChain.Then(p.upstreamProxy).ServeHTTP(rw, req)
       case ErrNeedsLogin: /* SignInPage か doOAuthStart */
       case ErrAccessDenied: /* 403 ErrorPage */
       }
   }
   ```

2. セッションは事前にミドルウェアが request scope に載せている。`storedSessionLoader.loadSession` (`pkg/middleware/stored_session.go:107`) が `scope.Session` を埋める。`getValidatedSession` (L137) が `store.Load(req)` を呼び、期限切れなら `refreshSessionIfNeeded` (L155) で refresh する。

3. `getAuthenticatedSession` (`oauthproxy.go:1142`) が判定する:

   ```go
   session := middlewareapi.GetRequestScope(req).Session
   if p.IsAllowedRequest(req) { return session, nil }   // 許可ルート/信頼 IP は素通し
   if session == nil { return nil, ErrNeedsLogin }
   invalidEmail := session.Email != "" && !p.Validator(session.Email)
   authorized, err := p.provider.Authorize(req.Context(), session)
   if invalidEmail || !authorized { /* ClearSessionCookie; return ErrAccessDenied */ }
   return session, nil
   ```

   認可は email validator (`validator.go`) と provider 固有 `Authorize` (group/allowed-group 等) の二段。`oauthproxy.go:1154-1160`。

4. 認証ログインフロー: `OAuthStart`/`doOAuthStart` (`oauthproxy.go:820`/825) が state と CSRF cookie を作り IdP の login URL へ。コールバック `OAuthCallback` (`oauthproxy.go:885`) は state を decode (L906)、CSRF cookie をロード (`cookies.LoadCSRFCookie` L916)、`redeemCode` で code を token に交換 (L926, `redeemCode` L979)、`enrichSessionState` (L933)、`csrf.CheckOAuthState(nonce)` で CSRF 検証 (L942)、`provider.ValidateSession` (L949)、email validator + `provider.Authorize` (L960-964) の順で処理し、通れば `SaveSession` して app へ redirect する (L966-972)。PKCE の code verifier は CSRF cookie に格納され `csrf.GetCodeVerifier()` で渡る (L926)。

中核データ構造:

- `sessions.SessionState` (`pkg/apis/sessions/session_state.go:17`): セッション本体。`AccessToken`/`IDToken`/`RefreshToken`/`Email`/`User`/`Groups`/`PreferredUsername`/`AdditionalClaims`、`CreatedAt`/`ExpiresOn`、`Nonce`。永続化は msgpack タグ (`msgpack:"at,omitempty"` 等) で省サイズ化。`Clock`/`Lock`/`Refreshed` は非シリアライズ。
- `Provider interface` (`providers/providers.go:22`): `GetLoginURL` / `Redeem` / `EnrichSession` / `Authorize` / `ValidateSession` / `RefreshSession` / `CreateSessionFromToken` / `Data`。`NewProvider` (L35) が `options.Provider.Type` で実装を switch 生成。
- `OAuthProxy` (`oauthproxy.go`): provider, sessionStore, Validator, redirectValidator, 各 alice.Chain, upstreamProxy を保持する中核オブジェクト。
- `ticket` (`pkg/sessions/persistence/ticket.go:40`): サーバ側ストア (redis) のセッション鍵。後述。
- `options.Options` (`pkg/apis/options`): 全設定。legacy フラグ系と alpha YAML 系の二経路でロード。

非自明な設計判断 (コードでしか見えない):

- サーバ側セッションストア (redis) では、共有 `CookieSecret` だけに依存せず、セッションごとにランダム 16byte の AES 鍵 (ticket secret) を生成する。ticket は `{ID, secret}` で、ID をキーに暗号化済みセッションを redis に保存し、`v2.{id}.{secret}` を cookie に入れて返す (`pkg/sessions/persistence/ticket.go:40-72`)。コメント曰く "a unique per session decryption secret giving more security than the shared CookieSecret" (`ticket.go:38-39`)。ロードは ticket.secret から AES-GCM cipher を作って復号する (`makeCipher` L266, `loadSession` L180)。ticket エンコーディングは v2 と旧 2-part 形式を後方互換で decode する (`decodeTicketID`/`decodeTicketSecret` L77-116)。
- cookie ストア側は 4000 byte (`maxCookieLength`, `pkg/sessions/cookie/session_store.go:22`) を超えると `splitCookie` で複数 cookie に分割する (L156-216)。ブラウザの cookie サイズ制限への実装上の対処。
- `mux.NewRouter().UseEncodedPath()` を使い `/%2F/` のような encoded path をそのまま upstream に渡せるようにしている (`oauthproxy.go:319-321`)。
- `AuthOnly` (`oauthproxy.go:1018`) は未認可時に 401 ではなく 403 を返す。理由はコメント: サブリクエスト構成での無限リダイレクト回避 (L1025-1026)。成功時は 202 Accepted (L1035)。

## 採用事例の素材

出典付きで名前が確認できるもの:

- CNCF Sandbox 申請でメンテナが「Microsoft, OpenAI, Adobe, Morgan Stanley のエンジニアからの貢献がある」と言及 (出典 [3])。これは contributor の所属であり「本番採用組織」の一次ソースとは限らない点に注意。
- ロゴは CNCF の人物がデザインした、Joel Speed が 6 年前から CNCF と接点があった、という申請時の経緯 (出典 [3])。

定量シグナル (gh api, 2026-06-22 取得): stars 14,557 / forks 2,139 / open issues 218 / 言語 Go / license MIT。contributor は GitHub contributors API のページネーション末尾で約 411 ページ (per_page=1) なので 400 人超。最新リリース v7.15.3 (2026-06-09 公開)。

明確な ADOPTERS.md は repo 内に見当たらず、名前付きの本番採用組織の一次ソースは限定的。広く「ダッシュボード等を認証付きリバースプロキシ背後に置く定番」として各種ハードニングガイドで oauth2-proxy が Pomerium と並んで推奨される (出典 [8])。捏造はしない: 確定した named adopter リストはなし、と明記する。

## 代替・エコシステム

- vouch-proxy: nginx `auth_request` 向けの軽量 SSO。設定 UI なし、スコープが狭い (出典 [8])。
- Pomerium: identity/context-aware なゼロトラストプロキシ。OAuth2 認証だけでなく ID 属性やコンテキストに基づくポリシー認可、API/CLI など非ブラウザトラフィックも対象 (出典 [9])。
- Authelia: 2FA/SSO を持つ自己完結の認証ポータル。セッション記憶と MFA、ポリシー認可を内包 (出典 [8])。
- 本質的な差: oauth2-proxy は「外部 IdP への委譲 + 幅広いプロバイダ対応 + nginx auth_request 統合」に絞った薄いシム。認証の重い部分は IdP 任せで、自前の MFA や細粒度ポリシーエンジンは持たない。Pomerium/Authelia がポリシー/MFA を内包する full スタックなのに対し、oauth2-proxy は最小構成で既存 OIDC/OAuth2 IdP に SSO ゲートを足す用途に強い。
- 統合先: Kubernetes (公式 Helm chart), nginx ingress の `auth-url`/`auth_request`, Traefik forwardAuth, redis (セッションストア)。プロバイダは Google/GitHub/GitLab/Azure/Keycloak/ADFS/MS Entra ID/汎用 OIDC など (`providers/`)。

## 導入と最小構成

- 入手: GitHub releases のプリビルトバイナリ / `go install github.com/oauth2-proxy/oauth2-proxy/v7@latest` / Docker `quay.io/oauth2-proxy/oauth2-proxy` / 公式 Helm chart (出典 [10])。
- 最小構成: IdP に OAuth アプリを登録し、`--provider`, `--client-id`, `--client-secret`, `--redirect-url` (= `https://host/oauth2/callback`), `--cookie-secret`, `--upstream` (背後サービス) を与え、アクセス許可境界として `--email-domain=*` か `--authenticated-emails-file` を指定する。`--cookie-secret` は AES のため 16/24/32 byte でなければ validation で弾かれる (`pkg/validation/cookie.go:65,79-85`)。コールバック path は `/oauth2/callback` 固定 (`oauthproxy.go:53`)。
