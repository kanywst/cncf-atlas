# 採用事例・エコシステム

## 誰が使っているか

k8gb はリポジトリに `ADOPTERS.md` を持ち、各エントリに連絡先と用途の説明が付いている。下の表はコミット `34b4535c` 時点のそれ。

| 組織 | 用途 | 出典 |
| --- | --- | --- |
| [Absa](https://www.absa.co.za/) | k8gb を作った組織。最初の本番利用はリージョン間データセンター構成 | `ADOPTERS.md` |
| [Millennium bcp](https://www.millenniumbcp.pt/) | マルチクラウド・マルチリージョンのクラウドネイティブ負荷分散 | [CNCF ケーススタディ](https://www.cncf.io/case-studies/millennium-bcp/) |
| [Eficode](https://eficode.com/) | クラウドネイティブ / DevOps のコンサルとして顧客案件で利用 | `ADOPTERS.md` |
| [Open Systems](https://www.open-systems.com/) | プライベート WAN 内のマルチクラスタ負荷分散 | `ADOPTERS.md` |
| [PagBank](https://pagbank.com/) | 複数リージョンにまたがるマルチクラウドのグローバル負荷分散 | `ADOPTERS.md` |
| [Darede](https://darede.com.br/) | クラウドコンサルとして顧客の k8gb 運用を支援 | `ADOPTERS.md` |
| [envio.dev](https://envio.dev/) | ブロックチェーンデータエンジンのリージョン横断可用性 | `ADOPTERS.md` |

CNCF の incubation 発表は、採用がフィンテックとクラウドコンサルに集中していると述べ、ポルトガル最大の民間銀行である Millennium bcp を例に挙げている ([CNCF, 2026-08-05](https://www.cncf.io/announcements/2026/08/05/k8gb-becomes-a-cncf-incubating-project/))。

この一覧には 2 つの型が見える。複数拠点で動かす規制上の理由があり、止まることに実コストがある銀行 (Absa、Millennium bcp、PagBank)。そして顧客のために導入するコンサル (Eficode、Darede)。どちらも「なんとなく標準だから」ではなく、特定の障害シナリオのために選ばれるツールの姿。

## 採用の指標

2021-03-30 から 5 年の sandbox 期間を経て、2026-07-18 に CNCF incubating へ到達し、2026-08-05 に発表された ([CNCF](https://www.cncf.io/announcements/2026/08/05/k8gb-becomes-a-cncf-incubating-project/))。incubation の審査には文書化されたアダプタが必要で、この規模のプロジェクトにとってはそれが最も強い指標になる。`ADOPTERS.md` のエントリこそ CNCF の Technical Oversight Committee が実際に見たもの。

継続的な活動量は [k8gb DevStats](https://k8gb.devstats.cncf.io/) に公開されている。プロジェクトの健全性スコアは [CLOMonitor](https://clomonitor.io/projects/cncf/k8gb) と、README が掲げる OpenSSF Scorecard・CII Best Practices のバッジで追える (`README.md`)。リリース成果物はイメージも Helm チャートも cosign で署名され `ghcr.io/k8gb-io` に公開される (`docs/CONTRIBUTING.md`)。

`v1.0.0` のタグは 2026-09-02、incubating 昇格の 6 週間後。

## エコシステム

k8gb はほぼ全体が他者のコンポーネントで組み立てられている。何を採用することになるのかが変わるので、はっきり書いておく価値がある。

- **CoreDNS**。`k8s_crd` プラグインを積んだ k8gb 専用ビルド (`chart/k8gb/values.yaml:119`)。クエリに応答するのはこれ。
- **external-dns**。k8gb が書く `DNSEndpoint` 型の出どころであると同時に、親ゾーンへ NS 委譲レコードを入れる手段でもある (`go.mod`)。
- **DNS プロバイダ**: Route 53、Azure DNS、NS1、Cloudflare、Infoblox、Windows DNS、RFC 2136。それぞれ `docs/deploy_*.md` に設定ページがある。ツリーに専用クライアントを持つのは Infoblox だけ (`controllers/providers/dns/infoblox-client.go`) で、他は external-dns 経由。
- **Prometheus と Grafana**: メトリクスは `controllers/providers/metrics/`、ダッシュボードは `grafana/`。
- **Admiralty** と **Crossplane**: 組み合わせの手順が `docs/admiralty.md` と `docs/examples/crossplane/` にある。

## 代替

| 代替 | どこが違うか |
| --- | --- |
| Route 53 のレイテンシ / フェイルオーバールーティング、Azure Traffic Manager、Google Cloud Load Balancing | マネージドの答えであり、全部が 1 つのクラウドにあるならこちらが正解。k8gb が生きるのは、クラスタが事業者をまたぐ場合やオンプレを含む場合、そしてポリシーを Kubernetes オブジェクトにしたい場合 |
| F5 や Infoblox の GSLB アプライアンス | 伝統的な答え。なお k8gb は Infoblox とは正面から競合せず、DNS バックエンドとして統合する道を持つ |
| Submariner | 同じくマルチクラスタだがレイヤが違う。Submariner は Pod と Service の L3 到達性を作る。k8gb は入ってくるトラフィックをどのクラスタに向けるかを決める。半分ずつ別の問題を解いていて、併用できる |
| Istio / Linkerd のマルチクラスタ | メッシュのデータプレーンを全クラスタに置き、クラスタ間の接続性を要求する。k8gb が要求するのは DNS ゾーンの委譲だけ |

分ける軸は「クラスタ間に何を要求するか」。メッシュや Submariner はネットワーク到達性と信頼関係を要求する。クラウドの GSLB はそのクラウドに居ることを要求する。k8gb は委譲された DNS ゾーンだけを要求し、その代わりに得られる制御の粒度はリクエスト単位ではなく DNS 単位になる。
