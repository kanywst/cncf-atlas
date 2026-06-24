# 採用事例・エコシステム

## 誰が使っているか

最大の採用事実は構造的なものだ。CoreDNS は Kubernetes 1.13 以降のデフォルトのクラスタ DNS なので、ほとんどの Kubernetes クラスタが動かしている。それに加えて、プロジェクトは一次情報の `ADOPTERS.md` を保守しており、以下の組織はそこから取った。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| SoundCloud | クラスタ内の cache + proxy として毎秒数十万の DNS サービスディスカバリ要求を処理 | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |
| Bose | 250 ノード超の Kubernetes クラスタで本番利用 | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |
| AdGuard | AdGuard Home と公開 AdGuard DNS サービスで利用 | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |
| Zalando SE、Trainline、Skyscanner、Hellofresh、Render、Infoblox、Qwilt、Northflank | 本番採用者として記載 | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |
| Absa Group | k8gb グローバルロードバランサ経由で CoreDNS を利用 | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |

CNCF graduation 時点では、Bose・Hellofresh・Skyscanner・SoundCloud・Trainline・Zalando が本番利用していると公表されていた ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/))。

## 採用のシグナル

GitHub REST API で 2026-06-22 に測定 ([api.github.com/repos/coredns/coredns](https://api.github.com/repos/coredns/coredns)):

- stars: 14,131、forks: 2,473、open issues: 305。
- contributors: 約 432 (contributors API の last page)。
- 最新リリース: `v1.14.4` (2026-06-09)。
- リポジトリ作成: 2016-03-18。

2019 年の graduation 時点では、100 人超の contributor と 16 人の active maintainer を公表していた ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/))。

## エコシステム

CoreDNS はプラグインで連携する。`kubernetes` プラグインがクラスタ DNS にし、`etcd` やクラウド系プラグイン (`azure`、`clouddns`) は外部 backend からレコードを読む。`metrics` は Prometheus データを出し、`dnstap` と `trace` は可観測性を足す。上位プロジェクトもこの上に構築される。例えば k8gb (Absa が利用) はグローバルなサーバロードバランシングに使う。out-of-tree プラグインは `plugin.cfg` に記載してバイナリを再ビルドして追加する (`src/plugin.cfg:7-8`)。

## 代替候補

| 代替 | 違い |
| --- | --- |
| kube-dns (dnsmasq + 補助コンテナ) | CoreDNS が 1.13 で置き換えた前任の Kubernetes デフォルト。単一バイナリではなく複数コンテナで、プラグイン連鎖を持たない。 |
| BIND9 / NSD / Knot | 確立された権威・リゾルバソフト。DNSSEC が強く高性能だが、native な etcd/Kubernetes backend や合成可能なプラグイン連鎖を持たない。これこそ CoreDNS が埋めようとした穴だ ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/))。 |
| Unbound / dnsmasq | 軽量なリゾルバ・フォワーダ。運用は単純だが、CoreDNS のような cloud-native のサービスディスカバリや Prometheus 連携はない。 |

CoreDNS を選ぶのは、Corefile を通じて DNS の挙動 (cache、forward、rewrite、Kubernetes service 解決、DNSSEC) を declarative に合成する 1 つの Go バイナリが欲しいとき。大規模な公開 zone 向けの成熟した権威サーバが要り、backend 連携が不要なら従来サーバを選ぶ。
