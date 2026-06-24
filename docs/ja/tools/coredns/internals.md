# 内部実装

> コミット `cc88c96e` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `src/coredns.go` | `main()`。全 in-tree プラグインを blank import し `coremain.Run()` を呼ぶ。 |
| `src/core/dnsserver/` | サーバ本体。Corefile 登録、zone ごとの連鎖構築、`ServeDNS` ディスパッチ。 |
| `src/plugin/` | 各プラグインが独自ディレクトリに。`Handler` と `Plugin` 型。 |
| `src/plugin/pkg/proxy/` | `forward` と `grpc` が他リゾルバと話すための上流 proxy。 |
| `src/request/` | クエリごとのラッパ `request.Request`。クライアント・EDNS 状態をキャッシュ。 |
| `src/plugin.cfg` | 順序付きプラグインリスト。`go generate` が配線コードに変換する。 |

## 中核データ構造

`dnsserver.Config` は 1 つの server block (1 zone × 1 ポート) の設定。`Zone`、`Port`、`ListenHosts`、`Transport`、filter 関数群、view 名、組み立て済みの `pluginChain`、プラグイン factory リスト `Plugin`、name→Handler の registry を持つ (`src/core/dnsserver/config.go:18-44`)。

`dnsserver.Server` はポートを listen する実体。`zones map[string][]*Config` が zone 文字列を、それを提供する Config 群に対応づける。`classChaos`・`debug`・`stacktrace` 等のフラグ、trace プラグイン、TSIG secret も追跡する (`src/core/dnsserver/server.go:49-56`)。

`plugin.Plugin` と `plugin.Handler` が連鎖の核。`Plugin` は `func(Handler) Handler` で、次のハンドラを受け取って それを包んだ自分を返す factory (`src/plugin/plugin.go:18`)。`Handler.ServeDNS` は標準の `dns.Handler` と違い rcode と error を返す。これによりプラグインは、すでに応答を書いたかどうかを上位の層に伝えられる (`src/plugin/plugin.go:50-53`)。

`request.Request` は `*dns.Msg` と `dns.ResponseWriter` を包み、`size`・`do`・`family`・`name`・`ip`・`port` を遅延キャッシュして、プラグインがアクセスのたびに再計算しないようにする (`src/request/request.go:14-33`)。

## 追う価値のあるパス

`forward` プラグインが 1 本のクエリを上流に解決する流れを追う。`ServeDNS` はまず自分の担当かを判定し、違えば次のプラグインに制御を渡す。

```go
func (f *Forward) ServeDNS(ctx context.Context, w dns.ResponseWriter, r *dns.Msg) (int, error) {
    state := request.Request{W: w, Req: r}
    if !f.match(state) {
        return plugin.NextOrFailure(f.Name(), f.Next, ctx, w, r)
    }
```

これが `src/plugin/forward/forward.go:109-113`。`NextOrFailure` は `next` が nil でなければ `next.ServeDNS` を呼び、nil なら SERVFAIL と "no next plugin found" エラーを返す (`src/plugin/plugin.go:76-89`)。

担当の場合、`forward` は同時実行数の上限を課し (`src/plugin/forward/forward.go:115-122`)、deadline まで上流リストをループする。`proxy.Down(f.maxfails)` が down と判定した proxy はスキップし、全部 down なら fail fast するか、ランダムに 1 つ選ぶ (`src/plugin/forward/forward.go:143-157`)。実際の上流呼び出しは `ret, err = proxy.Connect(ctx, state, opts)` (`src/plugin/forward/forward.go:177`)。その実体は `src/plugin/pkg/proxy/connect.go:201` の `func (p *Proxy) Connect`。応答が truncated で `prefer_udp` が設定されていれば、TCP に切り替えて retry する (`src/plugin/forward/forward.go:183-186`)。

## 読んで驚いた点

連鎖は逆向きに組み立てられる。`newServer` は最後のプラグインから最初へループし、毎回 `stack` を束ね直す。

```go
var stack plugin.Handler
for i := len(site.Plugin) - 1; i >= 0; i-- {
    stack = site.Plugin[i](stack)
```

これが `src/core/dnsserver/server.go:105-108`。各 factory は その時点の `stack` を自分の `Next` として捕捉するので、末尾から組むと各プラグインの `Next` が「次に走るプラグイン」を指す。`plugin.cfg` で読む実行順は、このループの構築順とは逆だ。

同じループは構築中にこっそり特別なプラグインをブックマークする。最初に見つけた `MetadataCollector` (逆順なので実行順では最後のもの) が `site.metaCollector` になり、`trace` という名前のプラグインを見つけるとサーバの tracer として退避する (`src/core/dnsserver/server.go:113-125`)。つまりプラグイン順は、リクエストの流れだけでなく、どの metadata collector と tracer が勝つかも決める。
