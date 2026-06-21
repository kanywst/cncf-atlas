# はじめに

> `v7.15.3` で検証済み。コマンドは Unix シェルと、IdP に登録済みの OAuth アプリを想定。

## 前提

- プロバイダ (Google, GitHub, OIDC issuer など) に登録した OAuth2 / OIDC アプリ。client ID と client secret が得られる。
- そのプロバイダに登録した、末尾が `/oauth2/callback` のリダイレクト URL (コールバック path は `oauthproxy.go:53` で固定)。
- 保護対象の上流サービス。HTTP で到達可能なもの。

## インストール

いずれか 1 つ。プリビルトのバイナリかコンテナイメージが最速 (出典 7)。

```bash
# Go install
go install github.com/oauth2-proxy/oauth2-proxy/v7@latest

# または Docker
docker pull quay.io/oauth2-proxy/oauth2-proxy:latest
```

## 最初の動く構成

1. cookie secret を生成する。decode して 16, 24, 32 byte でないと起動時検証で弾かれる (`pkg/validation/cookie.go:64-67`)。

```bash
openssl rand -base64 32 | tr -- '+/' '-_'
```

1. 上流の前段でプロキシを起動する。client 資格情報、上流 URL、ステップ 1 の cookie secret を差し替える。

```bash
oauth2-proxy \
  --provider=github \
  --client-id=YOUR_CLIENT_ID \
  --client-secret=YOUR_CLIENT_SECRET \
  --redirect-url=https://your.host/oauth2/callback \
  --cookie-secret=GENERATED_SECRET \
  --email-domain=* \
  --upstream=http://127.0.0.1:8080/ \
  --http-address=0.0.0.0:4180
```

1. フラグは挙動に直結する: `--upstream` は認証済みリクエストの転送先サービス、`--redirect-url` はプロバイダ登録と一致が必須、`--email-domain=*` はアクセス境界を「認証済みの任意の email」に設定する (本番ではドメインに絞るか `--authenticated-emails-file` を使う)。email チェックは `validator.go:107` の validator が強制する。

## 動作確認

- ブラウザで `http://localhost:4180/` を開く。プロキシがプロバイダのログインへリダイレクトし、`/oauth2/callback` を経て上流へ戻すはず。
- サブリクエストゲート (nginx `auth_request`) なら `GET /oauth2/auth` を呼ぶ: 認証済みセッションは `202 Accepted`、未認証は `401` を返す (`oauthproxy.go:1018-1036`)。
- 起動時、ログに選択したプロバイダが記録される。`--authenticated-emails-file` を設定した場合は使用中である旨の行も出る (`validator.go:30`)。

## 次に読むもの

- 本番ハードニング、サーバ側セッション (Redis)、TLS は公式ドキュメント (出典 6) とインストールガイド (出典 7) を参照。
- nginx, Traefik, Kubernetes 統合のパターンは公式ドキュメントの統合セクションが `auth_request`, `forwardAuth`, Helm chart を扱う。
