# はじめに

> `sdk-go` のコミット `1e99396` で検証済み。コマンドは Go がインストール済みであることを想定。`v2/go.mod` モジュールは `go 1.25.0` を宣言する。

## 前提

- Go 1.25 以上 (`v2` モジュールは `v2/go.mod` で `go 1.25.0` を指定)。
- イベントを受け取る到達可能な HTTP エンドポイント、または下記 2 つめのレシーバ。

## インストール

```bash
go get github.com/cloudevents/sdk-go/v2
```

## 最初の動く構成

中核機能を果たす最短経路は、CloudEvent を HTTP で送り、受け取ることだ。この最小センダは `samples/http/sender/main.go` を縮約したものだ。

Step 1. センダを作る。`WithTimeNow` と `WithUUIDs` が `time` と `id` 属性を補い、イベントが validation を通る。送信先エンドポイントはコード内で `http://localhost:8080/` に設定する。

```go
package main

import (
    "context"
    "log"

    cloudevents "github.com/cloudevents/sdk-go/v2"
)

func main() {
    ctx := cloudevents.ContextWithTarget(context.Background(), "http://localhost:8080/")

    p, err := cloudevents.NewHTTP()
    if err != nil {
        log.Fatal(err)
    }
    c, err := cloudevents.NewClient(p, cloudevents.WithTimeNow(), cloudevents.WithUUIDs())
    if err != nil {
        log.Fatal(err)
    }

    e := cloudevents.NewEvent()
    e.SetType("com.example.sent")
    e.SetSource("example/sender")
    _ = e.SetData(cloudevents.ApplicationJSON, map[string]string{"msg": "hello"})

    if res := c.Send(ctx, e); cloudevents.IsUndelivered(res) {
        log.Printf("failed: %v", res)
    }
}
```

Step 2. イベントが届くのを見るため、2 つめのプログラムでレシーバを動かす。`StartReceiver` が HTTP リスナをバインドし、各イベントをハンドラへ振り分ける。

```go
package main

import (
    "context"
    "log"

    cloudevents "github.com/cloudevents/sdk-go/v2"
)

func main() {
    c, err := cloudevents.NewClientHTTP()
    if err != nil {
        log.Fatal(err)
    }
    log.Fatal(c.StartReceiver(context.Background(), func(e cloudevents.Event) {
        log.Printf("got event: %s", e)
    }))
}
```

Step 3. レシーバを起動し、別シェルでセンダを実行する。

```bash
go run ./receiver
go run ./sender
```

## 動作確認

レシーバは受け取ったイベントを、`id`・`source`・`type`・JSON データを含めてログに出す。センダ側では配信済みイベントに対して `cloudevents.IsUndelivered(res)` が false を返すため、失敗行は出ない。レシーバが動いていなければ、センダは transport エラーを伴う `failed:` 行をログに出す。

## 次に読むもの

- 他トランスポート: `v2/protocol/` の各モジュールが Kafka・MQTT・AMQP・NATS・GCP Pub/Sub をカバーする。`samples/` 配下の対応ディレクトリを参照。
- 属性とバインディングの完全な規則は [CloudEvents Core Specification](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md)。
- 設計の根拠は [CloudEvents Primer](https://github.com/cloudevents/spec/blob/main/cloudevents/primer.md)。
- API 全体は [sdk-go パッケージリファレンス](https://pkg.go.dev/github.com/cloudevents/sdk-go/v2)。
