# 内部実装

> コミット `9f2dcfd9` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/daprd` | サイドカーバイナリ。`main.go:21` が `app.Run()` を呼ぶ |
| `cmd/operator`, `cmd/injector`, `cmd/sentry`, `cmd/placement`, `cmd/scheduler` | コントロールプレーンのバイナリ群 |
| `pkg/runtime` | サイドカーの中枢。`DaprRuntime` が全サブシステムを保持 (`runtime.go:102`) |
| `pkg/runtime/compstore` | ロード済みコンポーネントのインメモリレジストリ (`compstore.go:42`) |
| `pkg/api/http`, `pkg/api/grpc`, `pkg/api/universal` | アプリ向けの公開 API (HTTP、gRPC、共通ロジック) |
| `pkg/messaging` | サービス呼び出しと内部 gRPC プロキシ |
| `pkg/resiliency` | リトライ・サーキットブレーカ・タイムアウトのポリシエンジン |
| `pkg/actors`, `pkg/runtime/wfengine` | actor ランタイムと workflow エンジン |
| `pkg/security`, `pkg/sentry` | mTLS と SPIFFE ベースの ID |

## 中核データ構造

`DaprRuntime` (`pkg/runtime/runtime.go:102`) はサイドカーの状態を抱える神オブジェクト。アプリ `channels`、`directMessaging`、`actors`、`wfengine`、`compStore`、`resiliency`、security ハンドラ `sec`、そして gRPC サーバ 2 つを持つ。アプリ向けの `grpcAPIServer` とサイドカー間の `grpcInternalServer` だ (`pkg/runtime/runtime.go:139`)。

`ComponentStore` (`pkg/runtime/compstore/compstore.go:42`) はコンポーネントレジストリ。1 つの `sync.RWMutex` の下で種別ごとに `map[string]...` を持つ。`states`、`pubSubs`、`secrets`、`inputBindings` と `outputBindings`、`locks`、`cryptoProviders`、`workflowComponents`、`conversations` などだ。ビルディングブロックの一覧がそのままフィールドとして現れる。ホットリロード時はこのストアのエントリを差し替える。

`InvokeMethodRequest` (`pkg/messaging/v1/invoke_method_request.go:37`) はサービス呼び出しの内部表現。リトライ時のボディ replay を扱う `replayableRequest` を埋め込み、replay できないボディでバッファリングを無効化する `streamingRequest` フラグを持つ (`pkg/messaging/v1/invoke_method_request.go:48`)。

## 追う価値のあるパス

メソッド名の正規化はサービス呼び出しのエッジに置かれている。`directMessaging.Invoke` は宛先解決の前にそれを呼ぶ (`pkg/messaging/direct_messaging.go:168`)。

```go
normalized, normErr := method.NormalizeMethod(msg.GetMethod())
if normErr != nil {
    return nil, status.Errorf(codes.InvalidArgument, "invalid method: %v", normErr)
}
msg.Method = normalized
```

`NormalizeMethod` (`pkg/messaging/method/normalize.go:46`) は禁止文字を拒否し、`path.Clean` でトラバーサルを解決する。

```go
if strings.ContainsAny(method, "#?\x00") {
    return "", fmt.Errorf("method contains forbidden character: %q", method)
}
// Reject control characters (0x01-0x1f and 0x7f DEL).
for i := range method {
    b := method[i]
    if b < 0x20 || b == 0x7f {
        return "", fmt.Errorf("method contains control character at position %d: %q", i, method)
    }
}
// Resolve path traversal sequences.
cleaned := path.Clean(method)
```

正規化後の文字列が ACL チェックとディスパッチの両方に届くので、両者が呼び出すメソッドについて食い違うことがない。

## 読んで驚いた点

replay の安全性はグローバルではなくリクエストごとに決まる。HTTP ハンドラは `r.ContentLength` を見て、負 (チャンク転送または Content-Length 不在) のときは `req.SetStreamingRequest()` を呼ぶ (`pkg/api/http/directmessaging.go:148`)。フラグのコメントには、その状態では `WithReplay` が no-op になりボディ全体をメモリにバッファしないと明記されている (`pkg/messaging/v1/invoke_method_request.go:48`)。ランタイムはリクエストの実際の形に応じてリトライ可能性とメモリ安全性を天秤にかける。

同じハンドラは消費済みボディでの再試行も防ぐ。ストリーミングリクエストが転送エラーになると、`backoff.Permanent` でラップして resiliency ポリシが空ボディで再試行しないようにする (`pkg/api/http/directmessaging.go:182`)。

```go
if req.IsStreamingRequest() {
    return rResp, backoff.Permanent(invokeErr)
}
```

リモート送信パスは既定でストリーミングだ。`invokeRemote` は内部クライアントを作り、unary RPC ではなく `invokeRemoteStream` を呼ぶ (`pkg/messaging/direct_messaging.go:311`)。呼び出し前に `ServiceInvocationRequestSent`、後に `ServiceInvocationResponseReceived` を計上する。受信側には対になる `CallLocalStream` があり、`io.Pipe` で大きなボディをチャンク転送する (`pkg/api/grpc/daprinternal.go:85`)。
