# Getting Started

> コミット `765b3c6` の README 例に基づく。最寄りのタグは `v1.20.0`。コマンドは Unix 系シェルと Go 1.25 ツールチェーンを前提とする (`src/go.mod:3`)。

## 前提

- Go 1.25 以降。
- コード生成用の `buf` CLI。
- メッセージと Connect スタブを生成する `protoc-gen-go` と `protoc-gen-connect-go` プラグイン。

## インストール

ライブラリを入れ、続けてコード生成ツールをインストールする:

```bash
go get connectrpc.com/connect
go install github.com/bufbuild/buf/cmd/buf@latest
go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
```

## 最初に動く構成

最短で動くのは、1 サービスに対する Go サーバと Go クライアントだ。生成コードの import path は自分の Go module path に合わせる。

ステップ 1、`.proto` ファイルにサービスを定義し、`buf generate` でコードを生成する。`buf.gen.yaml` に `protoc-gen-go` と `protoc-gen-connect-go` を並べておくと、メッセージ型と、`NewXxxServiceHandler` / `NewXxxServiceClient` を含む `*.connect.go` が出力される。

```bash
buf generate
```

ステップ 2、生成された handler を `http.ServeMux` に載せて serve する。README 例は `localhost:8080` で listen する:

```go
mux := http.NewServeMux()
path, handler := greetv1connect.NewGreetServiceHandler(&greetServer{})
mux.Handle(path, handler)
http.ListenAndServe("localhost:8080", mux)
```

gRPC クライアントが平文 HTTP/2 (h2c) でこのサーバに届く必要があるなら、サーバの `http.Protocols` で `SetUnencryptedHTTP2(true)` を有効にする。

ステップ 3、そのアドレスに対してクライアントを作り、メソッドを直接呼ぶ:

```go
client := greetv1connect.NewGreetServiceClient(
    http.DefaultClient, "http://localhost:8080/")
res, err := client.Greet(context.Background(),
    connect.NewRequest(&greetv1.GreetRequest{Name: "World"}))
```

## 動作確認

unary の Connect 呼び出しは素の HTTP なので、生成クライアントなしに `curl` だけでサーバを確認できる。公開デモサービスに対して:

```bash
curl \
    --header "Content-Type: application/json" \
    --data '{"sentence": "I feel happy."}' \
    https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say
```

JSON の応答 body が返れば、handler・codec・プロトコルネゴシエーションが正しく配線されている。同じリクエストを自分の `localhost:8080` サービスに向ければ、ローカルでも確認できる。

## 次に読むもの

公式の Go getting-started ガイドが、streaming・interceptor・エラー処理を掘り下げる (<https://connectrpc.com/docs/go/getting-started/>)。TLS・圧縮・`otelconnect` による可観測性といった本番の関心事は、ここで使った平文デフォルトではなく Connect のドキュメントに従うこと。
