# はじめに

> go-spiffe v2.8.1 で検証済み。コマンドは Go 1.24+ と稼働中の SPIFFE Workload API エンドポイント (SPIRE Agent) を想定。

## 前提

- Go 1.24 以降 (`go.mod` は `go 1.24.0` を宣言)。
- 稼働中の [SPIRE](https://spiffe.io/spire/) または他の SPIFFE Workload API 実装。対象ワークロードの登録エントリがあること。
- 環境変数 `SPIFFE_ENDPOINT_SOCKET` を Workload API アドレス (例: `unix:///tmp/agent.sock`) に設定。

## インストール

```bash
go get github.com/spiffe/go-spiffe/v2
```

## 最初の動く構成

mTLS への最短経路は `spiffetls` ヘルパである。Workload API から `X509Source` を構築し、SVID を提示し、ピアを検証する。

1. ライブラリに Workload API ソケットを指す。

```bash
export SPIFFE_ENDPOINT_SOCKET=unix:///tmp/agent.sock
```

1. 任意の SPIFFE ピアを受け入れる mTLS サーバを起動する。

```go
package main

import (
    "context"
    "log"

    "github.com/spiffe/go-spiffe/v2/spiffetls"
    "github.com/spiffe/go-spiffe/v2/spiffetls/tlsconfig"
)

func main() {
    ctx := context.Background()
    listener, err := spiffetls.Listen(ctx, "tcp", "127.0.0.1:8443", tlsconfig.AuthorizeAny())
    if err != nil {
        log.Fatal(err)
    }
    defer listener.Close()
    log.Println("listening with a SPIFFE identity")
}
```

1. クライアントからダイヤルする。

```go
conn, err := spiffetls.Dial(ctx, "tcp", "127.0.0.1:8443", tlsconfig.AuthorizeAny())
```

両側が Workload API から X509-SVID と X.509 バンドルを取得して提示し、エージェントがローテーションするたびに更新し続ける ([README.md:36-42](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/README.md#L36-L42))。

## 動作確認

接続は、両ピアが SVID を取得し、トラストバンドルに対して相手を検証できたときだけ成功する。任意のピアを受け入れる代わりに ID を固定するには、`tlsconfig.AuthorizeAny()` を `tlsconfig.AuthorizeID(spiffeid.RequireFromString("spiffe://example.org/client"))` に差し替える。これは同梱のサーバ例が行っていることである ([examples/spiffe-tls/server/main.go:35-39](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/examples/spiffe-tls/server/main.go#L35-L39))。ピア ID が一致しなければハンドシェイクは失敗する。

## 次に読むもの

[examples ディレクトリ](https://github.com/spiffe/go-spiffe/tree/v2.8.1/examples) は gRPC クレデンシャル・JWT-SVID・フェデレーションを扱う。アテステーションポリシー・トラストドメインのフェデレーション・SVID ローテーションの調整といった本番運用は、[SPIFFE standards](https://github.com/spiffe/spiffe/tree/main/standards) と [go-spiffe パッケージリファレンス](https://pkg.go.dev/github.com/spiffe/go-spiffe/v2) を参照。
