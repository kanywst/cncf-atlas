# CoreDNS

> プラグインを連鎖させて DNS クエリを解決するサーバ。Corefile で設定し、Kubernetes のデフォルトのクラスタ DNS として使われている。

- **カテゴリ**: Service Mesh & Networking
- **CNCF 成熟度**: Graduated
- **言語**: Go (`go 1.25.0`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [coredns/coredns](https://github.com/coredns/coredns)
- **ドキュメント基準コミット**: `cc88c96e` (2026-06-17、直近リリースは 2026-06-09 の `v1.14.4`)

## 何をするものか

CoreDNS は Go で書かれた DNS サーバ。特徴は、モノリシックなリゾルバではなく、プラグインの連鎖でクエリを処理する点にある。連鎖は Corefile という設定ファイルで記述する。zone ごとに実行するプラグインを並べ、各プラグインが次のプラグインへリクエストを渡せるため、記載順が意味を持つ。

このプラグインモデルにより、従来は別々のツールが必要だった処理を 1 つのバイナリでこなせる。`forward` プラグインは上流リゾルバへ転送し、`cache` はキャッシュを足し、`file` は zone ファイルを提供し、`kubernetes` は `cluster.local` の service 名を解決し、`prometheus` はメトリクスを出力する。バイナリに組み込まれるプラグインの集合は `plugin.cfg` (`src/plugin.cfg`) からビルド時に固定され、同じファイルが実行順も決める。

エントリポイントは小さい。`main()` は `coremain.Run()` を呼ぶだけで、`core/plugin` を blank import して全 in-tree プラグインを登録する (`src/coredns.go:7-12`)。サーバ本体は Caddy web server の fork の上に成り立っており、連鎖 middleware の設計はここに由来する。

## いつ使うか

- Kubernetes を運用していて、デフォルトの add-on として配布されるクラスタ内 DNS が欲しいとき。CoreDNS は Kubernetes 1.13 でデフォルトの kube-dns を置き換えた。
- 複数のデーモンを動かす代わりに、キャッシュ・転送・書き換え・backend (etcd、zone ファイル、クラウド DNS API) からの応答を、プラグインの合成で 1 つの DNS サーバにまとめたいとき。
- 別の exporter を足さずに DNS メトリクスを Prometheus に出したい、または trace をエクスポートしたいとき。
- 大規模な公開 zone を完全な DNSSEC 署名運用で扱う、確立された権威サーバが欲しい場合は不向き。そこは BIND9・NSD・Knot の実績が長い。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [coredns/coredns リポジトリ](https://github.com/coredns/coredns)、commit `cc88c96` を参照。
2. [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md)、プロジェクト一次情報の採用者リスト。
3. [LICENSE (Apache-2.0)](https://github.com/coredns/coredns/blob/master/LICENSE)。
4. [CNCF becomes steward of CoreDNS (2017-03-02)](https://www.cncf.io/blog/2017/03/02/cloud-native-computing-foundation-becomes-steward-service-naming-discovery-project-coredns/)。
5. [CNCF announces CoreDNS graduation (2019-01-24)](https://www.cncf.io/announcements/2019/01/24/coredns-graduation/)。
6. [DNS Solution CoreDNS Graduates from CNCF (InfoQ)](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)。
7. [Learning CoreDNS, Introduction (O'Reilly)](https://www.oreilly.com/library/view/learning-coredns/9781492047957/ch01.html)。
8. [GitHub REST API: repos/coredns/coredns](https://api.github.com/repos/coredns/coredns)、2026-06-22 取得。
