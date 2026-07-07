# Internals

> コミット `765b3c6` のソースから読んだ。ここでの主張はすべて file:line を指す。

## コードマップ

ライブラリは小さい。非テストの `.go` は 23 ファイル、コア約 6,470 行だ。テストファイルと `cmd/` のコード生成器は飛ばす。RPC が回るのは以下のパスだ。

| パス | 責務 |
| --- | --- |
| `src/client.go` | `Client[Req, Res]` と unary / streaming の呼び出し関数。 |
| `src/handler.go` | `Handler`、`ServeHTTP`、リクエストごとのプロトコル選択。 |
| `src/protocol.go`, `src/protocol_connect.go`, `src/protocol_grpc.go` | `protocol` インターフェースと 3 実装。 |
| `src/codec.go` | `Codec` インターフェースと Protobuf バイナリ / JSON codec。 |
| `src/envelope.go` | 5 byte の streaming / gRPC ワイヤフレーム。 |
| `src/connect.go` | パッケージ型: `Spec`・`Request`・`Response`・`HTTPClient`・version 定数。 |
| `src/error.go`, `src/code.go` | gRPC 互換のエラーとステータスコード体系。 |
| `src/idempotency_level.go` | cacheable GET を許すべき冪等性宣言。 |

## 中核データ構造

`Spec` (`src/connect.go:333`) は 1 つの RPC を記述する: `StreamType`、`Schema` (Protobuf では `protoreflect.MethodDescriptor`)、`Procedure` (例 `/acme.foo.v1.FooService/Bar`)、`IsClient` フラグ、`IdempotencyLevel`。

`Request[T any]` (`src/connect.go:165`) と `Response[T any]` (`src/connect.go:255`) は生成メッセージのジェネリックなラッパだ。`Msg *T` を公開しつつ header・trailer・spec・peer を保持する。header は無駄な allocation を避けるため遅延初期化される (`src/connect.go:178-180`)。

`envelope` (`src/envelope.go:45`) は `Data *bytes.Buffer`・`Flags uint8`・`offset int64` を持つ。5 byte prefix は `src/envelope.go:41-44` に記される。flag byte の意味は gRPC と Connect で異なるため、型は解釈を caller に委ねる。

`Error` (`src/error.go:124`) は `Code`・ラップした `err error`・`details`・`meta http.Header`・`wireErr bool` を運ぶ。`wireErr` は、サーバが実際にワイヤに送出したエラーか、クライアントがローカルで合成したエラーかを区別する (`NewWireError` / `IsWireError`)。

`Code` (`src/code.go:32`) は `uint32` で、gRPC のステータスコードと 1:1 に対応する。`CodeCanceled=1` (`src/code.go:43`) から `CodeUnauthenticated=16` までだ。

## 追う価値のあるパス

最も示唆的で非自明なパスは、副作用のない unary 呼び出しが HTTP GET になる過程だ。これが RPC をキャッシュ可能にする。

`IdempotencyNoSideEffects` (`src/idempotency_level.go:43`) と宣言された procedure は、クライアントが `WithHTTPGet` を設定して `EnableGet` を立てると、POST ではなく GET で送れる。`connectUnaryRequestMarshaler.Marshal` (`src/protocol_connect.go:985`) は `enableGet` 時に `marshalWithGet` (`src/protocol_connect.go:997`) へ分岐し、メッセージを stable codec で marshal し、それを query param に載せた URL を `buildGetURL` で作る (`src/protocol_connect.go:1017`):

```text
if m.enableGet {
    return m.marshalWithGet(message)
}
```

URL が `getURLMaxBytes` を超えると、marshaler は圧縮して縮める。それでも収まらなければ POST に fallback するか (`getUseFallback`)、エラーにする (`src/protocol_connect.go:1016-1044`)。stable な marshal が必須なのは、GET URL が非決定的だとキャッシュキーがブレるからだ (`src/protocol_connect.go:987-992`)。これで RPC 応答が CDN やブラウザキャッシュの背後に置ける。gRPC はこの形で HTTP の意味論に乗らないため、これができない。

## 驚いたこと

Connect 独自プロトコルの unary パスは、5 byte envelope をまったく使わない。`connectUnaryMarshaler.Marshal` (`src/protocol_connect.go:927`) は body を直接書く。envelope は streaming と gRPC 用に取ってある。だから unary の Connect 呼び出しは JSON を POST する素の `curl` で届き (README の `curl` 例)、unary のエラーは gRPC の trailer ベースのステータス伝搬ではなく、HTTP ステータス + JSON body で表現される。

unary 応答の cardinality チェックは、意図的に 2 通目のメッセージを読む。`receiveUnaryMessage` は 1 通読み、さらに読んで EOF 以外なら違反とみなし、gRPC spec に沿って client / server 両方で `CodeUnimplemented` を返す (`src/connect.go:483-497`)。コードには、その 2 回目 receive の allocation がまだ最適化されていないと記す `TODO` まである (`src/connect.go:485-487`)。
