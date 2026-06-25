# 採用事例・エコシステム

## 誰が使っているか

以下の名前はプロジェクトの `ADOPTERS.md` での自己申告か、CNCF・ベンダーの出典で言及されたもの。独立に監査したものではない。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Amazon Web Services | Amazon Managed Service for Prometheus が Cortex 上に構築 | [README](https://github.com/cortexproject/cortex/blob/master/README.md), [AWS](https://aws.amazon.com/prometheus/) |
| Electronic Arts | 1500 万 active series 超の本番監視 | [CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/) |
| GoJek | 1500 万 active series 超の本番監視 | [CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/) |
| REWE Digital | 1500 万 active series 超の本番監視 | [CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/) |
| Adobe, DigitalOcean, Etsy, Swiggy, Twilio ほか | 本番採用としてリスト | [ADOPTERS.md](https://github.com/cortexproject/cortex/blob/master/ADOPTERS.md) |

## 採用のシグナル

2026-06-24 時点、[GitHub API](https://api.github.com/repos/cortexproject/cortex) による測定。

- スター: 約 5,813。
- フォーク: 約 860。
- コントリビュータ: 約 344 名 (匿名含む、API 概算)。
- open issue: 307。
- リポジトリは archived されておらず、最終 push は 2026-06-24、`v1.21.1` は 2026-06-04 リリース。

## エコシステム

`cortexproject` GitHub org は補助プロジェクトを提供する。Kubernetes デプロイ用の `cortex-helm-chart`、ルールとアラート管理用の `cortex-tools` (cortextool)、config ライブラリの `cortex-jsonnet`、`auth-gateway` など。Cortex は Prometheus remote write からデータを取り込み、Prometheus 互換のデータソースとして Grafana でクエリされる。blocks storage は S3・GCS・Azure・Swift 上で動き、リング KV は Consul・Etcd・memberlist を使う。

## 代替候補

Cortex を際立たせる軸は、中央集約の remote-write 取り込み + 個別にスケールするマイクロサービス + 取り込みからクエリまでの強いマルチテナント隔離。

| 代替 | 違い |
| --- | --- |
| Grafana Mimir | 2022 年の Cortex fork。push/remote-write モデルは同系統で、split-and-merge compactor により TSDB index の上限を突破 (テナントあたり約 10 億 active series までテスト済み)、monolithic デプロイモードを持つ。 |
| Thanos | sidecar (pull) または receiver (push) を軸にした edge 型。既存の Prometheus サーバを温存し、マルチテナント隔離は弱め。shipper・store-gateway・compactor のコードを Cortex と共有する。 |
| VictoriaMetrics | 単一バイナリ志向で設定最小。マイクロサービス構成ではなく性能と単純さに振っている。 |
