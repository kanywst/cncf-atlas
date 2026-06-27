# 採用事例・エコシステム

## 誰が使っているか

以下の組織は、プロジェクト自身の `ADOPTERS.md` に production user として記載されている。各エントリはその記載内容を反映している。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Uber Technologies | 20+ 環境にまたがる 2000+ の Cadence domain (ユースケース)、一部は 400+ domain をホスト: インフラ rollout、ML 学習、決済、オンボーディング | [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md) |
| NetApp (Instaclustr) | 数万台規模のフリート保守を orchestrate、マネージド Cadence も提供 | [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md) |
| DoorDash | ETA、フルフィルメント、注文管理、カタログ、広告 | [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md) |
| Cloudera | control plane の中核: provisioning と backup-restore、Cloudera Data Warehouse を含む | [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md) |

第三者の記事も Uber / DoorDash / Coinbase を利用者として独立に挙げている ([Instaclustr blog](https://www.instaclustr.com/blog/cadence-workflow-uber-cncf-projects/))。HashiCorp はプロジェクト史における初期の外部採用者だった ([ia40 インタビュー](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev))。

## 採用のシグナル

2026-06-27 に [cadence-workflow/cadence](https://github.com/cadence-workflow/cadence) について GitHub API から観測:

- スター: 9,358
- フォーク: 898
- ウォッチャー: 1,418
- コントリビュータ: 約 178
- open issue: 192

プロジェクトは 2025-05-22 に CNCF Sandbox に受理された ([CNCF](https://www.cncf.io/projects/cadence-workflow/))。最新の安定リリースは `v1.4.0` (2026-02-27)。ガバナンスは 4 名の Technical Steering Committee とメンテナ群で (`MAINTAINERS.md`)、CNCF が中立ホストを務める。

## エコシステム

- 公式 SDK: [Go](https://github.com/cadence-workflow/cadence-go-client) と [Java](https://github.com/cadence-workflow/cadence-java-client)。コミュニティ製の Python / Ruby SDK も存在する (`README.md:40`)。
- Web UI: [cadence-web](https://github.com/cadence-workflow/cadence-web)、`localhost:8088` で提供。
- DSL レイヤ: [iWF](https://github.com/indeedeng/iwf) が Cadence の上でフレームワークとして動く (`README.md:42`)。
- デプロイ: [cadence-charts](https://github.com/cadence-workflow/cadence-charts) Helm chart とガイド付き Kubernetes インストール導線 (`README.md:32-34`)。
- ストレージとインフラ: 中核状態に Cassandra / MySQL / PostgreSQL / SQLite、可視性に Elasticsearch / OpenSearch / Pinot、非同期ワークフローに Kafka。差し替え可能なバックエンドはサーバの入口で読み込まれる (`cmd/server/main.go:30-36`)。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Temporal | 2019 年に Cadence のオリジナル創業者が fork したもので、MIT ライセンス。durable execution モデルは同じだが、Thrift から protobuf へ、独自 RPC から gRPC へ移行済み ([ia40](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev)、[FAQ](https://cadenceworkflow.io/faq/cadence-vs-temporal))。 |
| Netflix Conductor / Conductor OSS | ワークフローをネイティブ言語コードではなく JSON DSL で定義する。 |
| Apache Airflow / Argo Workflows | DAG ベースのバッチ・データパイプラインスケジューラ。Cadence は任意の制御フローと長時間待機を持つ汎用 durable execution。 |
| AWS Step Functions / Azure Durable Functions | 同系統のマネージドサービス。Cadence のセルフホスト型エンジンというより、その概念的ルーツにあたる。 |

セルフホストの durable execution が欲しく、ワークフローをネイティブな Go / Java コードで書きたく、必要な DB を運用できるなら Cadence を選ぶ。インフラを一切運用したくないならマネージドの Step Functions / Durable Functions を選ぶ。対象が長時間動くステートフルなロジックではなくスケジュール実行のデータ DAG なら Airflow / Argo Workflows を選ぶ。
