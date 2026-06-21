# 内部実装

> コミット `10b6871` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `main.go` | プロセスのエントリポイント: フラグパース、設定ロード、検証、起動 (`main.go:16`)。 |
| `oauthproxy.go` | `OAuthProxy` 型と全 HTTP ハンドラ: ルーティング、proxy、auth、OAuth フロー。 |
| `validator.go` | `--email-domain` と `--authenticated-emails-file` による email 許可リスト (`validator.go:107`)。 |
| `providers/` | IdP ごとの実装を `Provider` インターフェース (`providers/providers.go:22`) の背後に。 |
| `pkg/middleware/` | request scope とセッションロードのミドルウェア (`pkg/middleware/stored_session.go`)。 |
| `pkg/sessions/` | cookie ストアと Redis 系永続ストア、および ticket モデル。 |
| `pkg/apis/` | 共有型: options, sessions, providers。 |
| `pkg/validation/` | 起動時検証。cookie secret の長さチェックを含む (`pkg/validation/cookie.go`)。 |

## 中核データ構造

`SessionState` (`pkg/apis/sessions/session_state.go:17`) がセッション本体だ。トークンと ID クレームを持ち、保存サイズを抑えるため短い msgpack タグでシリアライズされる:

```go
AccessToken  string `msgpack:"at,omitempty"`
IDToken      string `msgpack:"it,omitempty"`
RefreshToken string `msgpack:"rt,omitempty"`

Nonce []byte `msgpack:"n,omitempty"`

Email             string   `msgpack:"e,omitempty"`
User              string   `msgpack:"u,omitempty"`
Groups            []string `msgpack:"g,omitempty"`
```

3 つのフィールドは実行時専用で明示的に非シリアライズ (`msgpack:"-"`) だ: `Clock` (テスト用に差し替え可能な時刻ソース)、`Lock`、`Refreshed` (`pkg/apis/sessions/session_state.go:36-39`)。

`Provider` (`providers/providers.go:22`) は全 IdP 実装が満たすインターフェース: `GetLoginURL`, `Redeem`, `EnrichSession`, `Authorize`, `ValidateSession`, `RefreshSession`, `CreateSessionFromToken`, `Data`。`NewProvider` (`providers/providers.go:35`) が `providerConfig.Type` を具体実装にマップする。

`ticket` (`pkg/sessions/persistence/ticket.go:40`) はサーバ側セッション保存の鍵で、`id`、セッションごとの `secret`、cookie オプションを持つ。

## 追う価値のあるパス

中核操作は「リクエストが認証済みか判定して転送する」だ。ミドルウェアと `Proxy` ハンドラにまたがって端から端まで走る。

セッションはハンドラ実行前にロードされる。`storedSessionLoader.loadSession` (`pkg/middleware/stored_session.go:107`) が request scope を埋める。`getValidatedSession` (`pkg/middleware/stored_session.go:137`) はストアからロードし、必要なら refresh する:

```go
session, err := s.store.Load(req)
if err != nil || session == nil {
    return nil, err
}

err = s.refreshSessionIfNeeded(rw, req, session)
```

`refreshSessionIfNeeded` (`pkg/middleware/stored_session.go:155`) はセッションが refresh 期間より古い時だけ動き、同時 refresh を避けるためまずロックを取る (`pkg/middleware/stored_session.go:159-176`)。

catch-all の `Proxy` ハンドラ (`oauthproxy.go:1041`) は `getAuthenticatedSession` に判定を求め、エラーで分岐する:

```go
session, err := p.getAuthenticatedSession(rw, req)
switch err {
case nil:
    if !authOnlyAuthorize(req, session) { /* 403 */ }
    p.addHeadersForProxying(rw, session)
    p.headersChain.Then(p.upstreamProxy).ServeHTTP(rw, req)
case ErrNeedsLogin: /* SignInPage か doOAuthStart */
```

認可が実際に起きるのは `getAuthenticatedSession` (`oauthproxy.go:1142`) だ。許可ルートと信頼 IP はセッションなしで通り、それ以外はセッション必須で、email validator とプロバイダの `Authorize` の両方を通す必要がある:

```go
invalidEmail := session.Email != "" && !p.Validator(session.Email)
authorized, err := p.provider.Authorize(req.Context(), session)
if err != nil {
    logger.Errorf("Error with authorization: %v", err)
}
if invalidEmail || !authorized {
    /* ClearSessionCookie; return ErrAccessDenied */
}
```

この二段チェック (email 許可リストは `oauthproxy.go:1153`、プロバイダ認可は `oauthproxy.go:1154`) は、セッションを初めて保存する前の `OAuthCallback` 末尾で適用される対と同じものだ (`oauthproxy.go:960-964`)。

## 読んで驚いた点

- **サーバ側セッションは共有 cookie secret だけでなく、セッションごとの暗号鍵を得る。** `newTicket` はセッションごとにランダムな 16 byte の id と AES ブロックサイズの secret を生成する (`pkg/sessions/persistence/ticket.go:48-64`)。コメントは明確だ: ticket は "a unique per session decryption secret giving more security than the shared CookieSecret" を提供する (`pkg/sessions/persistence/ticket.go:38-39`)。cookie は `v2.{id}.{secret}` を持ち (`encodeTicket`, `pkg/sessions/persistence/ticket.go:69-72`)、暗号化セッションは id をキーに Redis に保存され、ロード時は ticket secret から AES-GCM cipher を再構築する (`makeCipher`, `pkg/sessions/persistence/ticket.go:266`; `loadSession`, `pkg/sessions/persistence/ticket.go:180`)。decode は後方互換のため旧 2-part 形式も受け付ける (`decodeTicketID`/`decodeTicketSecret`, `pkg/sessions/persistence/ticket.go:77-116`)。
- **cookie セッションは 4 KB を超えると分割される。** `maxCookieLength` は 4000 byte (`pkg/sessions/cookie/session_store.go:22`)。シリアライズ後の cookie がこれより大きいと、`splitCookie` が値を番号付き cookie に分割し、Redis を勧める警告をログに出す (`pkg/sessions/cookie/session_store.go:184-215`)。
- **`AuthOnly` は未認可時にあえて 401 でなく 403、成功時は 202 を返す。** 未認可の 403 はサブリクエスト構成での無限リダイレクトを避ける (`oauthproxy.go:1025-1031`)、成功は `http.StatusAccepted` を返す (`oauthproxy.go:1034-1036`)。
- **ルータは encoded path を保持する。** `mux.NewRouter().UseEncodedPath()` を選んでいるのは、`/%2F/` のようなものが上流に届く前に正規化されないようにするため (`oauthproxy.go:319-321`)。
- **cookie secret の長さは起動時に強制される。** AES cipher を作るため secret は 16, 24, 32 byte でなければならず、`pkg/validation/cookie.go:64-67` (secret ファイルも `pkg/validation/cookie.go:79-85`) でチェックされる。それ以外はプロキシ起動前に検証で弾かれる。
