# 内部実装

> コミット `73215a39` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/spire-server/main.go` | サーバのエントリポイント。CLI に委譲する |
| `cmd/spire-agent/main.go` | agent のエントリポイント。CLI に委譲する |
| `pkg/server/ca/ca.go` | サーバ CA。ワークロードと agent の SVID を署名する |
| `pkg/agent/endpoints/workload/handler.go` | Workload API の gRPC ハンドラ (`FetchX509SVID` ほか) |
| `pkg/agent/attestor/workload/workload.go` | ワークロード attestor プラグインを動かし PID からセレクタを導く |
| `pkg/agent/manager/manager.go` | agent の manager。キャッシュ購読と SVID ライフサイクル |
| `pkg/agent/manager/cache/workload.go` | キャッシュ型: `Identity`・`WorkloadUpdate`・`X509SVID` |
| `pkg/agent/svid/rotator.go` | サーバに CSR を送って agent SVID を更新する |
| `pkg/common/peertracker/` | UDS の peer credential をカーネルから読む (OS ごと) |
| `pkg/common/catalog/` | ビルトインと外部プラグインが共有する catalog |
| `proto/spire/common/common.pb.go` | 生成された protobuf 型: `Selector`・`RegistrationEntry` |

## 中核データ構造

- `common.Selector` (`proto/spire/common/common.pb.go:118`): `Type` と `Value` の 2 文字列。attestation の単位 (例: `unix:uid:1000`、`k8s:ns:default`)。
- `common.RegistrationEntry` (`proto/spire/common/common.pb.go:339`): SPIRE のポリシーの中心。`Selectors`・`ParentId`・`SpiffeId`・`FederatesWith`・`EntryId`・`Admin`・`Downstream`・`DnsNames`・`RevisionNumber`・`StoreSvid`・`JwtSvidTtl`・`Hint` を持つ。「この parent (ノード/中間) の下でこのセレクタ集合に一致するワークロードへ、この SPIFFE ID を発行する」という宣言。
- `cache.Identity` (`pkg/agent/manager/cache/workload.go:15`): 発行済み 1 アイデンティティ。`Entry *common.RegistrationEntry`・`SVID []*x509.Certificate`・`PrivateKey crypto.Signer` を持つ。
- `cache.WorkloadUpdate` (`pkg/agent/manager/cache/workload.go:29`): subscriber に渡すスナップショット。`Identities`・`Bundle`・`FederatedBundles` を持つ。
- `cache.X509SVID` (`pkg/agent/manager/cache/workload.go:40`): `Chain []*x509.Certificate` と `PrivateKey crypto.Signer`。

## 追う価値のあるパス

Workload API の `FetchX509SVID` ハンドラ (`pkg/agent/endpoints/workload/handler.go:251`) は streaming RPC。リクエスト body は空でクレデンシャルを持たない。

```go
func (h *Handler) FetchX509SVID(_ *workload.X509SVIDRequest, stream workload.SpiffeWorkloadAPI_FetchX509SVIDServer) error {
    ctx := stream.Context()
    start := time.Now()
    log := rpccontext.Logger(ctx)

    selectors, err := h.c.Attestor.Attest(ctx)
```

アイデンティティはすべて attestation から来る。`Attest` はワークロード attestor プラグインをそれぞれ goroutine で歩き、各々のセレクタをマージする (`pkg/agent/attestor/workload/workload.go:55-87`)。

```go
plugins := wla.c.Catalog.GetWorkloadAttestors()
sChan := make(chan []*common.Selector)
errChan := make(chan error)

for _, p := range plugins {
    go func() {
        if selectors, err := wla.invokeAttestor(ctx, p, pid); err == nil {
            sChan <- selectors
        } else {
            errChan <- err
        }
    }()
}
```

レート制限 (`handler.go:262`) の後、ハンドラはキャッシュを購読し、開いた stream に更新を push するループに入る (`handler.go:273-283`)。

```go
for {
    select {
    case update := <-subscriber.Updates():
        update.Identities = filterIdentities(update.Identities, log)
        if err := h.sendX509SVIDResponse(update, stream, selectors, log, start); err != nil {
            return err
        }
    case <-ctx.Done():
        return nil
    }
}
```

署名はこのパスの外で起きる。サーバ CA (`pkg/server/ca/ca.go:335`) は呼び出し元の公開鍵からテンプレートを組み、署名し、SPIFFE ID を検証する (`ca.go:341-358`)。

```go
template, err := ca.c.CredBuilder.BuildWorkloadX509SVIDTemplate(ctx, credtemplate.WorkloadX509SVIDParams{
    ParentChain: caChain,
    PublicKey:   params.PublicKey,
    SPIFFEID:    params.SPIFFEID,
    DNSNames:    params.DNSNames,
    TTL:         params.TTL,
    Subject:     params.Subject,
})
```

## 読んで驚いた点

- **PID は呼び出し元が送るのではなく socket から読む。** Linux では agent が `unix.GetsockoptUcred(fd, SOL_SOCKET, SO_PEERCRED)` を呼び (`pkg/common/peertracker/uds_linux.go:10`)、`ucred.Pid/Uid/Gid` を読む。macOS/BSD では `LOCAL_PEERPID` を使う (`pkg/common/peertracker/uds_bsd.go:13`)。ワークロードは自分が誰かを一切主張しないので、なりすませない。
- **attestation は全プラグインが失敗したときだけ失敗する。** `Attest` は `len(errs) == len(plugins)` のときだけエラーを返す (`pkg/agent/attestor/workload/workload.go:89-91`)。一部のプラグインだけが寄与したセレクタはマージされる。
- **サーバ CA は公開鍵しか見ない。** `SignWorkloadX509SVID` は `params.PublicKey` をテンプレートに渡し (`pkg/server/ca/ca.go:347`)、秘密鍵は受け取らない。署名パスは返す前に生成された SVID の SPIFFE ID を検証する (`ca.go:358`)。
- **Fetch はサーバではなくキャッシュから応答される。** `SubscribeToCacheChanges` は `m.cache.SubscribeToWorkloadUpdates` に直結する (`pkg/agent/manager/manager.go:258`)。agent は SVID を事前にローテーションしてあるので、ホットパスにサーバ往復はない。
