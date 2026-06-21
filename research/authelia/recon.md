# recon: authelia

## 基本情報

- repo: authelia/authelia
- pinned commit: `06af72aac09603089d07ed00e23378a3bc6fb51b` / 近いタグ: v4.39.20
- 言語 / ビルド: Go（go 1.26）+ React フロント / fasthttp
- ライセンス: Apache-2.0（v3 は MIT、v4 で変更）
- CNCF 成熟度: Independent（CNCF ではない。landscape 掲載 ≠ CNCF ホスト）
- カテゴリ: Identity & Policy

## 歴史の素材

- 作者 Clément Michaud、repo 作成 2016-12-07、初期は Node.js/TS（v3 まで）。
- v4 で Go へ全面書き直し（2019-10 頃）。SQLite/SQL 化、MUI フロント、Apache-2.0 化。
- OIDC プロバイダ v4.29 ベータ（2021）、WebAuthn v4.34（2022）、v4.39 でパスキー/デバイスコード/JWE。v4.39 でも OIDC は公式ベータ。

## アーキテクチャ / 内部の素材（file:line）

- エントリ: `cmd/authelia/main.go` → `internal/commands`（Cobra）。
- authz フレームワーク: 1 ハンドラ + ビルダー注入。実装列挙 `internal/handlers/handler_authz_types.go:141`、結線 `handler_authz_builder.go:128`、共有ハンドラ `handler_authz.go:146`。
- フロー: object 抽出（forwardauth.go:12 / authrequest.go:13 / extauthz.go:13）→ https 強制 `handler_authz.go:162` → セッション解決 `handler_authz.go:170` / `middlewares/authelia_context.go:322` → authn `handler_authz.go:191` → `Authorizer.GetRequiredLevel` `handler_authz.go:196` → 応答 `handler_authz.go:225`。
- ACL エンジン: `authorization/authorizer.go:11`（Authorizer）/ `:19`（NewAuthorizer, 起動時コンパイル）/ `:51`（GetRequiredLevel 先勝ち）。Rule `access_control_rule.go:40` / `IsMatch :54`。レベル `const.go:6`。
- 判定写像 `handlers/handler_authz_util.go:28`。匿名 deny は即 403 にせず unauthorized（HasSubjects が load-bearing）。
- セッション再配置防御 `handler_authz_authn.go:108`。ベアラ introspection `:618`。

## 採用事例の素材（出典付きのみ）

- GitHub stars ~28,100 / forks ~1,420（2026-06-21, GitHub API）。contributors 100+（README）。
- 企業採用の citable な事例は **無し**（ADOPTERS なし）。self-hosting/homelab の定番という位置づけのみ、比較記事複数で一致。捏造しない。

## 代替・エコシステム

- プロキシ対応表: Traefik/Caddy/NGINX/Envoy/HAProxy(Lua)/Skipper。Apache/IIS 非対応。
- 代替: Keycloak / Authentik / Ory / oauth2-proxy / Zitadel。軸は forward-auth ゲート vs フル IdP。
