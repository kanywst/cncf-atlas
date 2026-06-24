# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS` ファイルは無い。出典付きで名指しできるのは、2018 年の CNCF graduation 前後で挙げられた組織である。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| DigitalOcean | graduation 時に contributor として明記 | [CNCF announcement](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/) |
| Weaveworks | graduation 時に contributor として明記 | [CNCF announcement](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/) |
| ShowMax | graduation 時に contributor として明記 | [CNCF announcement](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/) |
| Uber | graduation 時に contributor として明記 | [CNCF announcement](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/) |
| ShuttleCloud | graduation 報道で adopter として記載 | [SD Times](https://sdtimes.com/cloud/prometheus-becomes-second-project-to-graduate-from-cncf-incubation/) |
| Datawire | graduation 報道で adopter として記載 | [SD Times](https://sdtimes.com/cloud/prometheus-becomes-second-project-to-graduate-from-cncf-incubation/) |
| iAdvize | graduation 報道で adopter として記載 | [SD Times](https://sdtimes.com/cloud/prometheus-becomes-second-project-to-graduate-from-cncf-incubation/) |

## 採用のシグナル

adopters ファイルが無いため、GitHub シグナルが重みを持つ。`prometheus/prometheus` リポジトリを 2026-06-22 に計測した値 (10)。

- stars: 64,698
- forks: 10,513
- open issues: 859
- 言語: Go、ライセンス: Apache-2.0

2018 年の graduation 時点で、プロジェクトは contributor 1,000 名超、commit 13,000 超、active maintainer 約 20 名を報告していた (1)(4)。founder の Julius Volz は当時、Prometheus をメトリクスベース監視の事実上の標準と表現している (1)。

## エコシステム

以下はコアの周囲にある別リポジトリ / 別プロジェクトとして提供される。

- **Alertmanager**: アラートのルーティング・重複排除・抑制。notifier の送り先。
- **Pushgateway**: 短命な batch job 向けの push 中継。
- **exporter 群** (node_exporter ほか): 非 Prometheus システムをメトリクスエンドポイント化する。
- **クライアントライブラリ** (client_golang ほか): アプリを計装する。
- **Grafana**: 可視化のデファクト層。
- **Kubernetes**: 密結合したサービスディスカバリ。kube-prometheus と Prometheus Operator を伴う (4)。

## 代替候補

Prometheus 単体には明確な限界がある。ローカルディスク保存、ネイティブなクラスタリング無し、cardinality に比例して増えるメモリ。下記の代替はおおむねこれらの限界を引き上げるために存在するので、選択は通常「単一サーバを超えてどうスケールするか」の問題になる (5)。

| 代替 | 違い |
| --- | --- |
| Thanos (CNCF) | Prometheus のソースを再利用。sidecar + object storage で HA と長期保存を追加。最小の移行パスだが、sidecar が compaction を無効化し gRPC オーバーヘッドが加わる (5) |
| Grafana Mimir / Cortex (CNCF) | Cortex 派生のマイクロサービス型。マルチテナント最強だが運用コストが高い。新規は Mimir 推奨 (5) |
| VictoriaMetrics | ゼロから再実装。単一バイナリ、高圧縮、高 cardinality 耐性。MetricsQL が PromQL を拡張し軽いロックインがある。remote write 対応 (5) |
| InfluxDB | push モデル、TSDB 専用。PromQL 非互換のため、移行はクエリと計装の書き直しになる (5) |
