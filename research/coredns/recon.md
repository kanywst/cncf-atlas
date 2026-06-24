# recon: CoreDNS

調査メモ。出典は URL を添える。コードは pin した commit を読んで `path:line` を残す。

## 基本情報

- repo: `coredns/coredns` (<https://github.com/coredns/coredns>)
- pinned commit: `cc88c96e0e1d67e5d8c81f4a4a1209451e30c275` (2026-06-17) / 近いタグ: `v1.14.4` (2026-06-09, この commit の直近リリース。HEAD は v1.14.4 より後)
- 言語 / ビルド: Go (`go 1.25.0`, `src/go.mod:5`) / `make` = `CGO_ENABLED=0 go build -tags=grpcnotrace ...` (`src/Makefile:24`)
- ライセンス: Apache-2.0 (`src/LICENSE`、`gh api` の `spdx_id` も `Apache-2.0` で一致)
- CNCF 成熟度: Graduated (2019-01-24 graduation 発表)
- カテゴリ (バケット): Service Mesh & Networking
- main entrypoint: `src/coredns.go` の `main()` が `coremain.Run()` を呼ぶだけ。`core/plugin` を blank import して全 in-tree plugin を登録する (`src/coredns.go:7-13`)

CoreDNS の自己定義は "a DNS server that chains plugins" (GitHub description)。Corefile という設定で zone ごとに plugin の連鎖を組む。

## 歴史の素材

- 2016-03、Google SRE の Miek Gieben が開始。彼は先行プロジェクト SkyDNS と Go の DNS ライブラリ `miekg/dns` の作者。出典: [O'Reilly Learning CoreDNS ch01](https://www.oreilly.com/library/view/learning-coredns/9781492047957/ch01.html)、[InfoQ graduation 記事](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)
- アーキテクチャは Caddy web server の fork。Caddy の「middleware を連鎖させる」設計をそのまま DNS に転用した。初期は "Caddy DNS" / "Daddy" と呼ばれた。今も `github.com/coredns/caddy` という fork に依存している (`src/core/dnsserver/register.go:8`)。出典: [InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)、[Grokipedia CoreDNS](https://grokipedia.com/page/CoreDNS)
- SkyDNS の後継。SkyDNS の monolithic で柔軟性に欠ける設計と、BIND9/NSD/Knot が etcd 等を backend にできない点を踏まえ、「複数 backend (etcd, Consul, Kubernetes) と話せる汎用 DNS server」を狙った。出典: [InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)
- CNCF: 2017-03 に CNCF が steward に (Sandbox 相当)、2018-02 に Incubating、2019-01-24 に Graduated (2019 年最初の graduation)。出典: [CNCF steward 発表 2017-03-02](https://www.cncf.io/blog/2017/03/02/cloud-native-computing-foundation-becomes-steward-service-naming-discovery-project-coredns/)、[CNCF graduation 発表 2019-01-24](https://www.cncf.io/announcements/2019/01/24/coredns-graduation/)
- Kubernetes 採用: k8s 1.11 で cluster DNS add-on として利用可能に、1.13 で default に昇格 (旧 kube-dns / dnsmasq の脆弱性対策)。出典: [InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)

## アーキテクチャの素材

トップレベル構成 (`src/` 直下):

- `coredns.go` / `coremain/` : エントリポイントと起動 (`coremain.Run`)。
- `core/dnsserver/` : サーバ本体。Corefile parse、zone ごとの server 構築、`ServeDNS` のディスパッチ。
- `core/plugin/zplugin.go` : 生成ファイル。全 in-tree plugin を blank import (`directives_generate.go` が `plugin.cfg` から生成)。
- `plugin/` : 各 plugin (forward, cache, kubernetes, file, etcd, prometheus(metrics), errors, log, rewrite, dnssec ...)。
- `request/` : `request.Request` ラッパ。クライアント情報・EDNS 状態をキャッシュ。
- `plugin/pkg/` : plugin 横断の共通実装 (proxy, dnsutil ...)。
- `pb/` : gRPC transport の protobuf。
- `test/` : 統合テスト (Corefile を実際に立ち上げる)。

設定とサーバ生成の流れ:

- plugin の実行順は `plugin.cfg` の記載順で固定 (`src/plugin.cfg`)。`go generate` が `core/dnsserver/zdirectives.go` の `Directives` slice と `core/plugin/zplugin.go` を生成する。順序が重要で「下の plugin は上の plugin の影響を受けるが、上は下を気にしてはいけない」と明記 (`src/plugin.cfg:1-5`)。
- CoreDNS は caddy の server type として登録される。`init()` で `caddy.RegisterServerType("dns", ...)` し、`Directives` を caddy に渡す (`src/core/dnsserver/register.go:19-31`)。Corefile は caddyfile として parse される。
- 各 plugin は自分の `init()` で `plugin.Register(name, setup)` を呼ぶ。`plugin.Register` は中で `caddy.RegisterPlugin` を呼ぶ薄いラッパ (`src/plugin/register.go:6`)。`setup` 関数が Corefile のトークンを読み、`dnsserver.GetConfig(c).AddPlugin(func(next Handler) Handler {...})` で plugin factory を Config に積む (例: `src/plugin/forward/setup.go:26-55`)。

## 内部実装の素材

### 代表オペレーションの end-to-end: DNS クエリ 1 本を解決する

1. plugin chain の組み立て (起動時)。`newServer` が各 site (zone) について `site.Plugin` (factory の slice) を**末尾から先頭へ**畳み込み、`stack = site.Plugin[i](stack)` で `Handler` を連鎖させる。最終的に `site.pluginChain` に先頭 Handler を格納 (`src/core/dnsserver/server.go:106-131`)。逆順に組むことで各 plugin の `Next` が「自分の 1 つ後ろの plugin」を指す。
2. リクエスト受信。`Server.ServeDNS(ctx, w, r)` がエントリ (`src/core/dnsserver/server.go:259`)。質問が空なら SERVFAIL (`:262`)、CHAOS class でなく非 INET なら REFUSED (`:283`)、EDNS version 不一致なら即返す (`:288`)。ResponseWriter を `ScrubWriter` で包んで応答をクライアントのバッファに収める (`:294`)。
3. zone マッチング。qname を小文字化し (`:296`)、`dns.NextLabel` でラベルを 1 つずつ削りながら `s.zones[q[off:]]` を最長一致で探す (`:303-342`)。一致した Config の `pluginChain.ServeDNS` を呼ぶ (`:323`)。`plugin.ClientWrite(rcode)` が false なら error plugin にフォールバック (`:324-326`)。DS クエリは親委譲の都合で特別扱い (`:329-351`)。どの zone にも当たらなければ root `"."` を最後の砦に試し (`:354-378`)、それも無ければ REFUSED (`:381`)。
4. plugin chain 内の伝播。`Handler` interface は `ServeDNS(ctx, w, r) (int, error)` (`src/plugin/plugin.go:51-53`)。各 plugin は自分が処理しない場合 `plugin.NextOrFailure(name, f.Next, ...)` で次へ渡す。`Next` が nil なら SERVFAIL + "no next plugin found" (`src/plugin/plugin.go:73` 以降)。
5. リーフでの upstream 解決 (forward plugin)。`Forward.ServeDNS` (`src/plugin/forward/forward.go:109`) は `f.match(state)` で自分の担当か判定し、違えば `NextOrFailure` (`:111-113`)。`maxConcurrent` で同時数を絞り (`:115-122`)、upstream リスト `f.List()` を deadline まで round-robin。down 判定 (`proxy.Down(f.maxfails)`) を見つつ `proxy.Connect(ctx, state, opts)` で実際に上流へ問い合わせる (`src/plugin/forward/forward.go:177`、実体は `src/plugin/pkg/proxy/connect.go:201` の `func (p *Proxy) Connect`)。truncated かつ `prefer_udp` 設定なら TCP に切替えて retry (`:183-186`)。

### 中核データ構造 (3-5)

- `dnsserver.Config` (`src/core/dnsserver/config.go:18`): 1 つの server block (= zone + port) の全設定。`Zone`, `Port`, `ListenHosts`, `Transport`, `FilterFuncs`, `ViewName`、組み立て済み `pluginChain`、plugin factory 列 `Plugin`、name→Handler の `registry` を持つ。
- `dnsserver.Server` (`src/core/dnsserver/server.go:40` 付近): 1 ポートで listen する実体。`zones map[string][]*Config` で zone 文字列 → Config 群を引く。`classChaos`, `debug`, `stacktrace`, tracer, tsigSecret 等。
- `plugin.Handler` / `plugin.Plugin` (`src/plugin/plugin.go:15-53`): chain の核。`Plugin = func(Handler) Handler` が「次を受け取って自分を返す」factory。`Handler.ServeDNS` は rcode と error を返す独自シグネチャ (標準 `dns.Handler` と違い rcode を返せる)。
- `request.Request` (`src/request/request.go:14-33`): `*dns.Msg` と `dns.ResponseWriter` のラッパ。`size`/`do`/`family`/`name`/`ip`/`port` 等を遅延キャッシュし、plugin が何度も計算しないで済むようにする。
- proxy 層の `Proxy` (`src/plugin/pkg/proxy/proxy.go`、`connect.go:201` の `Connect`): forward/grpc が使う upstream 接続。persistent connection と health check を内包。

### 非自明な設計判断

plugin chain を**設定順の逆から畳み込んで構築する** (`src/core/dnsserver/server.go:107-108`)。`for i := len-1; i>=0; i--` で `stack = Plugin[i](stack)` とすることで、各 plugin の `Next` フィールドが「自分の 1 つ後ろの plugin」を自然に指す。実行順 (`plugin.cfg` の上から) と組み立て順 (下から) が逆という非直感的な構造で、ここを誤読すると chain の向きを取り違える。さらに `plugin.cfg` の順序はコンパイル時に `Directives` として焼き込まれるので、plugin の実行優先度はユーザ設定ではなくビルド時に固定される。

## 採用事例の素材

`src/ADOPTERS.md` 記載 (一次情報)。Kubernetes の default cluster DNS であることが最大の採用根拠 (k8s 1.13+)。

- SoundCloud: Kubernetes クラスタ内で cache+proxy として毎秒数十万の DNS service discovery を処理 (`src/ADOPTERS.md`)。
- Bose: 250 ノード超の大規模 k8s クラスタで本番利用 (`src/ADOPTERS.md`)。
- Zalando SE / Trainline / Skyscanner / Hellofresh / Render / Infoblox / Qwilt / Northflank / Absa Group (k8gb 経由) など (`src/ADOPTERS.md`)。
- AdGuard: AdGuard Home および公開 AdGuard DNS で利用 (`src/ADOPTERS.md`)。
- CNCF graduation 時点で「100+ contributors、16 active maintainers、Bose/Hellofresh/Skyscanner/SoundCloud/Trainline/Zalando が本番採用」と公表。出典: [InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)

採用シグナル (数値、2026-06-22 取得、`gh api repos/coredns/coredns`):

- GitHub stars: 14,131 / forks: 2,473 / open issues: 305。
- contributors: 約 432 (GitHub contributors API の last page = 432、2026-06-22)。
- 最新リリース: `v1.14.4` (2026-06-09)。
- repo 作成: 2016-03-18。

## 代替・エコシステム

- エコシステム/統合: Kubernetes (default cluster DNS、`plugin/kubernetes`)、etcd (`plugin/etcd`)、Consul、各種クラウド DNS (`plugin/azure`, `plugin/clouddns` 等)、Prometheus metrics (`plugin/metrics`)、dnstap、trace。external plugin を `plugin.cfg` に足して再ビルドで拡張。k8gb (Absa) のような上位プロジェクトの土台にもなる。
- 代替:
  - kube-dns (dnsmasq + 補助コンテナ): CoreDNS が k8s 1.13 で置き換えた前任。単一バイナリ・plugin 連鎖でない点が劣る。
  - BIND9 / NSD / Knot: 伝統的権威・リゾルバ。高性能だが etcd/k8s backend や service discovery 向けの柔軟な plugin 機構を持たない (CoreDNS 誕生の動機そのもの)。出典: [InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)
  - Unbound / dnsmasq: 軽量リゾルバ/フォワーダ。cloud-native の service discovery 統合や Prometheus 連携は CoreDNS が強い。
  - 本質的な差: 「Go 単一バイナリ + Corefile による plugin chain」で、DNS の各処理 (cache, forward, rewrite, k8s service 解決, dnssec) を declarative に合成できる点。Caddy 由来の設定体験を DNS に持ち込んだのが固有性。

## install + 最小構成

ソースからのビルド (`src/README.md:55-68`):

```bash
git clone https://github.com/coredns/coredns
cd coredns
make
```

最小 Corefile (すべてを upstream に転送しつつログ):

```text
. {
    forward . 8.8.8.8
    log
    errors
}
```

起動は `coredns -conf Corefile` (デフォルト port 53)。Kubernetes では Helm chart / cluster add-on manifest で配布され、`kubernetes` plugin が `cluster.local` を解決する。
