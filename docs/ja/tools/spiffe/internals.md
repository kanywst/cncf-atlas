# 内部実装

> コミット `e9973f6` のソースから読んでいる。ここでの主張はすべてファイルと行を指すべきである。

## コードマップ

| パス | 責務 |
| --- | --- |
| `spiffeid/` | SPIFFE ID と TrustDomain 型、パース、マッチング。 |
| `svid/x509svid/` | X509-SVID 型、パース、ピア検証。 |
| `svid/jwtsvid/` | JWT-SVID 型と検証。 |
| `bundle/` | X.509・JWT・統合 SPIFFE バンドルのトラストバンドル。 |
| `workloadapi/` | Workload API クライアントと X509/JWT/Bundle source。 |
| `spiffetls/` | mTLS の `Listen`/`Dial` ヘルパと `tls.Config` 構築。 |
| `proto/spiffe/workload/` | Workload API の生成済み gRPC スタブ。 |

## 中核データ構造

`spiffeid.ID` は 2 フィールドを持つ。正準文字列 `id` と整数 `pathidx` である ([spiffeid/id.go:95-101](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/spiffeid/id.go#L95-L101))。トラストドメインとパスは部分文字列スライスで、`TrustDomain()` は `id[schemePrefixLen:pathidx]` を、`Path()` は `id[pathidx:]` を返す ([spiffeid/id.go:104-119](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/spiffeid/id.go#L104-L119))。

`x509svid.SVID` は `ID`、先頭がリーフの証明書チェーン、`PrivateKey`、任意の `Hint` を持つ ([svid/x509svid/svid.go:20-36](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/svid.go#L20-L36))。`workloadapi.X509Context` は `SVIDs` と `Bundles` を組にし、両方を運ぶ単一の Workload API レスポンスを反映する (`workloadapi/x509context.go`)。

`workloadapi.Client` は gRPC 接続、生成された `SpiffeWorkloadAPIClient`、その config を持つ ([workloadapi/client.go:29-33](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/client.go#L29-L33))。

## 追う価値のあるパス

X509-SVID をワイヤからアプリケーションまで追う。`watchX509Context` がストリームを開き receive をループする ([workloadapi/client.go:547-571](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/client.go#L547-L571)):

```go
stream, err := c.wlClient.FetchX509SVID(ctx, &workload.X509SVIDRequest{})
if err != nil {
    return err
}

for {
    resp, err := stream.Recv()
    if err != nil {
        return err
    }
    backoff.Reset()
    x509Context, err := parseX509Context(resp)
    ...
    watcher.OnX509ContextUpdate(x509Context)
}
```

各レスポンスは `parseX509Context` ([workloadapi/client.go:673](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/client.go#L673)) がデコードし、これが `parseX509SVIDs` を呼んで生バイトを `x509svid.ParseRaw` ([svid/x509svid/svid.go:75](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/svid.go#L75)) で SVID にする。これは DER 証明書と PKCS#8 鍵を想定する。watcher は次に `OnX509ContextUpdate` ([workloadapi/watcher.go:187](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/watcher.go#L187)) を呼び、SVID とバンドルを `X509Source` へ差し替える。

受信側では `x509svid.Verify` ([svid/x509svid/verify.go:30](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/verify.go#L30)) がリーフから SPIFFE ID を取り出し、CA であるか `KeyCertSign`/`CRLSign` を持つリーフを拒否し ([svid/x509svid/verify.go:49-56](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/verify.go#L49-L56))、トラストドメインのバンドルを引き ([svid/x509svid/verify.go:58](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/verify.go#L58))、標準ライブラリの `leaf.Verify` を `ExtKeyUsageAny` で走らせる ([svid/x509svid/verify.go:63-68](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/verify.go#L63-L68))。認可は URI SAN と信頼アンカーを軸にするため、DNS SAN は一切関与しない。

## 驚いた点

`spiffeid.ID` は 2 本の文字列ではない。正準文字列 1 本と `pathidx` を保持することで、この型は `==` で比較でき、map キーにでき、`String()`・`TrustDomain()`・`Path()` がアロケーション無しになる。代償はパース時に一度だけ払う。`FromString` は trust-domain 文字の検証を `net/url` だけに頼らず手書きでバイト走査する ([spiffeid/id.go:51-82](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/spiffeid/id.go#L51-L82))。SPIFFE ID は mTLS ハンドシェイクのたびに生成・比較されるため、軽量で比較可能な表現は性能上の選択である。

Workload API が同じ `hint` を持つ SVID を複数返したときは、先頭が勝ち後続の重複はスキップされる。これは最初のメッセージを選ぶべきという仕様の指針に沿う ([workloadapi/client.go:708](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/client.go#L708))。
