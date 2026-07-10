# 内部実装

> コミット `17a54e9`（v2.45.0 + 248 コミット）のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

ログインとトークンのロジックを担うディレクトリ。生成された protobuf と ent のコードは除く。

| パス | 責務 |
| --- | --- |
| `server/handlers.go` | 認可コードフロー全体の HTTP ハンドラ。認可、コネクタログイン、コールバック、承認、トークンエンドポイント。 |
| `server/oauth2.go` | トークン構築と JWT 署名。アクセストークン、ID Token、`at_hash` と `c_hash` の計算、署名検証。 |
| `server/refresh.go`, `server/refreshhandlers.go` | refresh token グラントとローテーション。 |
| `server/deviceflowhandlers.go` | OAuth2 Device Authorization Grant。 |
| `connector/connector.go` | コネクタインターフェース群と正規化済み `Identity` 型。 |
| `connector/oidc/oidc.go` | 参照実装となる上流 OIDC コネクタ。 |
| `storage/storage.go` | `Storage` インターフェースと中核の永続化型。 |
| `storage/ent/` | ent 生成の SQL バックエンドとエンティティスキーマ。 |

## 中核データ構造

フローは `storage/storage.go` の数個の型で回転する。

- **`AuthRequest`**（`storage/storage.go:239`）は進行中ログインの一時状態。選ばれた `ConnectorID`、要求スコープ、解決された `Claims`、`LoggedIn` フラグ、リダイレクト URI、PKCE パラメータ、有効期限を持つ。
- **`AuthCode`**（`storage/storage.go:308`）は発行された認可コード。`Claims`、コネクタの `ConnectorData`、PKCE チャレンジ、auth time を保持する。一度きりで、`exchangeAuthCode` が使用時に削除する。
- **`RefreshToken`**（`storage/storage.go:347`）は永続的なグラントで、トークン・クレーム・コネクタデータ・最終使用時刻を持つ。
- **`Client`**（`storage/storage.go:162`）は登録された OAuth2 クライアント。シークレット、リダイレクト URI、許可コネクタ。
- **`Connector`**（`storage/storage.go:527`）は永続化されたコネクタ設定（ID、type、config blob、grant types）。コネクタを storage 越しに動的管理できるようにする。

注目すべき不変条件。上流アクセストークンを保持しうるコネクタの `ConnectorData` は `connector.Identity`（`connector/connector.go:38`）に定義され、エンドユーザや下流クライアントと決して共有してはならないとコメントされている（`connector/connector.go:47-51`）。これは storage 内にのみ存在する。

## 追う価値のあるパス

トークンエンドポイントは、POST から署名付き ID Token まで、セキュリティ上重要なチェックが集中する場所だ。

`handleToken`（`server/handlers.go:1261`）は `grant_type` で分岐し、`authorization_code` では `handleAuthCode`（`server/handlers.go:1312`）を呼ぶ。このハンドラは `AuthCode` を storage から読み込み、client と一致するか確認し、それから PKCE 検証（RFC 7636）を走らせる。検証は「開始したなら必須」として扱う 4 分岐のスイッチだ。

```text
switch {
case verifier != "" && challenge != "":   // 再計算。不一致なら invalid_grant
case verifier != "":                       // challenge 未保存 => invalid_request
case challenge != "":                      // verifier 未送信  => invalid_grant
                                           // （両方空）=> 素通り
}
```

このロジックは `server/handlers.go:1337-1357` にある。興味深いのは中間の 2 分岐だ。PKCE チャレンジなしで作られた code に client が verifier を送ってきた場合、あるいはチャレンジが保存されているのに client が verifier を送らない場合、Dex は交換を拒否する。PKCE を開始した client は完了させねばならず、これが downgrade 経路を塞ぐ。

PKCE が通ると `exchangeAuthCode`（`server/handlers.go:1372`）がトークンを発行する。refresh token も出すかどうかは、クロージャ `reqRefresh`（`server/handlers.go:1393`）が次の 3 つすべてを要求して決める。コネクタが `RefreshConnector` を実装、その `grantTypes` 設定が `refresh_token` を許可、リクエストが `offline_access` スコープを持つ。どれか欠ければ、エラーにせず黙って refresh token を省く。コードは、これが RFC 6749 1.5 節に合致すると注記している。

ID Token 自体は `newIDToken`（`server/oauth2.go:346`）で組み立てられる。issuer・subject・nonce・有効期限・issued-at・JTI を詰め、アクセストークンと code から `at_hash` と `c_hash` を計算し、スコープに応じて email と groups クレームを足し、`signer.Algorithm` が選んだ鍵で JWT に署名する。

## 読んで驚いた点

- **`Connector` インターフェースは空。** `connector.Connector` はメソッドを持たず、能力は型アサーションで発見される（`connector/connector.go:26`）。コネクタは対応する分だけサブインターフェース（`PasswordConnector`・`CallbackConnector`・`SAMLConnector`・`RefreshConnector`）を実装し、server が実行時にそれらでスイッチする。これで各コネクタは上流が求める分だけ小さく保たれる。
- **署名検証はアルゴリズムを明示的にホワイトリストする。** Dex が署名済み JWT をパースするとき、`jose.ParseSigned`（`server/oauth2.go:773`）に許可アルゴリズムのリスト（`RS256/384/512` と `ES256/384/512`）を渡す。トークン自身の `alg` ヘッダを信じるのではなく集合を明示することが、アルゴリズム混乱攻撃への防御になる。
- **`/callback` ハンドラは実行前に `X-Remote-*` ヘッダを剥がす。** ルートのラッパーは `x-remote-` で始まる受信ヘッダをすべて削除し（`server/server.go:542-551`）、`authproxy` コネクタが誤設定されていても、client が自分でそれらのヘッダをセットしてなりすませないようにする。

## 出典

- コミット `17a54e9` のソースを読んだもの。上記パスはリポジトリルートからの相対。
- [RFC 7636（PKCE）](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 6749 1.5 節（refresh token）](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5)
