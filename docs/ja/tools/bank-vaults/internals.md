# 内部実装

> コミット `2248b7b` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/bank-vaults/main.go` | root コマンド・全フラグ・`--mode` 定数。 |
| `cmd/bank-vaults/unseal.go` | `unseal` コマンドとその再試行ループ。 |
| `cmd/bank-vaults/common.go` | `kvStoreForConfig`: mode ごとに KV ストアを作る。 |
| `internal/vault/operator_client.go` | `Vault` interface と `vault` 実装。 |
| `pkg/kv/kv.go` | 全バックエンド共通の `Service` interface。 |
| `pkg/kv/awskms/awskms.go` | 内側ストアを包む AWS KMS envelope バックエンド。 |

## 中核データ構造

`Vault` interface は CLI が要求できる操作をすべて列挙する。`Init`・`RaftJoin`・`Sealed`・`Unseal`・`Leader`・`Configure` などである (`internal/vault/operator_client.go:44`)。コマンドはこの interface だけに依存する。

`vault` 構造体が唯一の実装である (`internal/vault/operator_client.go:120`)。KV ストア・Vault API クライアント・init 設定・デコード済み外部設定・ローテーションキャッシュを持つ:

```go
type vault struct {
    ctx            context.Context
    keyStore       KVService
    cl             *api.Client
    config         *Config
    externalConfig *externalConfig
    rotateCache    map[string]bool
}
```

`New` が唯一のコンストラクタで、値を返す前に閾値がシェア数より大きい場合を弾く (`internal/vault/operator_client.go:130`):

```go
func New(ctx context.Context, k KVService, cl *api.Client, config Config) (Vault, error) {
    if config.SecretShares < config.SecretThreshold {
        return nil, errors.Errorf("the secret threshold can't be bigger than the shares [%d < %d]", config.SecretShares, config.SecretThreshold)
    }
```

`Config` は Shamir 分割パラメータと root token のポリシーを持つ: `SecretShares`・`SecretThreshold`・`InitRootToken`・`StoreRootToken`・`PreFlightChecks` (`internal/vault/operator_client.go:61`)。`externalConfig` は `configure` の YAML をデコードする mapstructure の受け皿で、`Audit`・`Auth`・`Groups`・`Plugins`・`Policies`・`Secrets`・`StartupSecrets`・`PurgeUnmanagedConfig` のフィールドを持つ (`internal/vault/operator_client.go:89`)。

全 KV バックエンドが同じ 2 メソッドの契約を実装する (`pkg/kv/kv.go:53`):

```go
type Service interface {
    Set(ctx context.Context, key string, value []byte) error
    Get(ctx context.Context, key string) ([]byte, error)
}
```

その上のコメントは、実装が整合性やセキュリティ特性を保証する場合もしない場合もある、と述べている (`pkg/kv/kv.go:51`)。

## 追う価値のあるパス

`(*vault).Unseal` がプロジェクトの看板操作である (`internal/vault/operator_client.go:197`)。キー ID をループし、各キーを KV ストアから取り出して Vault に送り、Vault が unseal を報告するまで続ける:

```go
func (v *vault) Unseal(ctx context.Context) error {
    defer runtime.GC()
    for i := 0; ; i++ {
        slog.Debug("retrieving key from kms service...")
        k, err := v.keyStore.Get(ctx, keyUnsealForID(i))
        if err != nil {
            return errors.Wrapf(err, "unable to get key '%s'", keyUnsealForID(i))
        }

        slog.Debug("sending unseal request to vault...")
        resp, err := v.cl.Sys().Unseal(string(k))
```

`keyUnsealForID` は ID を `vault-unseal-` にインデックスを付けて作る (`internal/vault/operator_client.go:687`)。ループは `resp.Sealed` が false になれば成功で return し (`internal/vault/operator_client.go:213`)、`resp.Progress == 0` ならエラーを返す。これは投入したキーが拒否されたことを意味する (`internal/vault/operator_client.go:218`)。

キーは保管時に平文で運ばれない。KV ストアが AWS KMS バックエンドのとき、`Get` は内側ストア (S3) から暗号文を読んで復号する (`pkg/kv/awskms/awskms.go:86`):

```go
func (a *awsKMS) Get(ctx context.Context, key string) ([]byte, error) {
    cipherText, err := a.store.Get(ctx, key)
    if err != nil {
        return nil, errors.WrapIf(err, "failed to get data for KMS client")
    }

    return a.decrypt(cipherText)
}
```

`decrypt` は設定された encryption context 付きで KMS の `Decrypt` API を呼び、平文を trim する (`pkg/kv/awskms/awskms.go:72`)。書き込み側も同じ形で、`Set` は `encrypt` で暗号化してから暗号文を保存する (`pkg/kv/awskms/awskms.go:109`、`pkg/kv/awskms/awskms.go:95`)。

## 読んで驚いた点

`Unseal` は先頭で `defer runtime.GC()` を呼ぶ (`internal/vault/operator_client.go:198`)。復号したキーのバイト列は機微なので、関数を抜ける際に garbage collection を強制してメモリから早めに掃除する。

root token を持たない運用も実在するパスである。`StoreRootToken` が false のとき、`Configure` は保管済みトークンを読む代わりに毎回 Vault の generate-root フローを起こす (`internal/vault/operator_client.go:462`)。unseal または recovery キーを引き、`GenerateRootUpdate` を駆動し、エンコードされた結果を One-Time Password (OTP) と XOR して合成しトークンを復元する (`internal/vault/operator_client.go:499`)。その後、3 つの defer 文がトークンをクリアし、クライアントトークンをリセットし、garbage collection を強制する (`internal/vault/operator_client.go:560`):

```go
// Clear the token and GC it
defer runtime.GC()
defer v.cl.SetToken("")
defer func() { rootToken = nil }()
```

デコーダの安全弁は意図的である。`Configure` は `ErrorUnused: true` を設定して未知の YAML キーをデコード失敗にし (`internal/vault/operator_client.go:574`)、すぐ上のコメントが理由を説明する。purge が有効なとき、設定キーの typo が Vault 上の削除を招きうるからである (`internal/vault/operator_client.go:572`)。
