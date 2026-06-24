# Prometheus

> 時系列を HTTP で pull し、ローカルの時系列データベースに保存し、PromQL でクエリするメトリクスベースの監視システム。

- **カテゴリ**: Observability
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [prometheus/prometheus](https://github.com/prometheus/prometheus)
- **ドキュメント基準コミット**: `fc561264` (release-3.13, 3.13.0-rc.0)

## 何をするものか

Prometheus は数値の時系列を収集する。ターゲットを発見し、その HTTP メトリクスエンドポイントを一定間隔で scrape し、サンプルをローカルの時系列データベースに書き込む。各系列はメトリクス名と key/value ラベルの集合で識別されるため、同じメトリクスを instance や job などの次元で切り分けられる。そのデータを PromQL でクエリし、ダッシュボード・アラート・アドホック調査に使う。

単一の Prometheus サーバは自律している。分散ストレージに依存せず、scrape するバイナリがそのまま保存とクエリ応答も担う (README:28-33)。多次元データモデルと PromQL が、プロジェクトが最初に挙げる差別化要素である (README:26-35)。

スタックの中ではメトリクス層に位置する。下流のアラートルーティングは Alertmanager が担い、exporter 群が非 Prometheus システムをメトリクス化し、可視化は通常 Grafana が受け持つ。高可用性と長期保存には、Thanos や Mimir のような外部層を上に重ねる。

## いつ使うか

- HTTP メトリクスエンドポイントを公開する (または公開させられる) インフラやサービスを、メトリクスベースで監視したいとき。
- Kubernetes のような動的インフラで、静的なターゲット一覧よりサービスディスカバリが効くとき。
- 固定ダッシュボードだけでなく、アドホック分析とアラートのためのクエリ言語が欲しいとき。
- イベントログや分散トレーシングが必要な場合は不向き。それらは別のシグナルで別のツールを使う。
- 単一サーバは保存期間と cardinality に限界がある。ストレージはローカルディスクで、メモリはアクティブ系列数に比例して増える。その段階では Prometheus 自体をスケールさせるのではなく、リモート層を追加する。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [CNCF announces Prometheus graduation](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/)
2. [Prometheus (software) - Wikipedia](https://en.wikipedia.org/wiki/Prometheus_(software))
3. [Prometheus monitoring tool joins Kubernetes as CNCF graduated project (TechCrunch)](https://techcrunch.com/2018/08/09/prometheus-monitoring-tool-joins-kubernetes-as-cncfs-latest-graduated-project/)
4. [Prometheus becomes second project to graduate from CNCF incubation (SD Times)](https://sdtimes.com/cloud/prometheus-becomes-second-project-to-graduate-from-cncf-incubation/)
5. [Best Prometheus Alternatives in 2026 (Tiger Data)](https://www.tigerdata.com/learn/prometheus-alternatives)
6. [Prometheus on CNCF projects](https://www.cncf.io/projects/prometheus/)
7. [Prometheus official site and docs](https://prometheus.io/)
8. [Prometheus first steps installation guide](https://prometheus.io/docs/prometheus/latest/getting_started/)
9. [prometheus/prometheus README (pinned commit fc561264)](https://github.com/prometheus/prometheus)
10. [prometheus/prometheus GitHub repository metadata](https://github.com/prometheus/prometheus)
