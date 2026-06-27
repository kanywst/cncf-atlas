# Cadence Workflow

> 長時間動くワークフローを実行し、クラッシュ後も event history から復元して続行する、耐障害なコードファーストのオーケストレーションエンジン。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cadence-workflow/cadence](https://github.com/cadence-workflow/cadence)
- **ドキュメント基準コミット**: `66dcbaf` (2026-06-25、タグ `v1.4.1-prerelease31` 近傍)

## 何をするものか

Cadence は durable execution (DE、耐障害な持続実行) のためのバックエンドプラットフォームである。DE とは、実行しているプロセスやマシンが落ちてもプログラムが正しく動き続ける性質を指す。ワークフローは Go か Java の通常のコードとして書く。Cadence はコードが踏んだ各ステップを追記専用の event history として永続化するので、worker がクラッシュしても別の worker でその history から replay され、中断地点から続行する。ユーザコードが自前で状態をチェックポイントする必要はない。

このリポジトリはサーバ側である。4 つの role (frontend、history、matching、worker) からなるクラスタに加え、CLI とスキーマツールを含む。ワークフローとアクティビティのコードは、クライアント SDK を使ってサーバとは別のあなた自身のプロセスで動く (`README.md:13-15`)。サーバは状態を Cassandra / MySQL / PostgreSQL に永続化し、可視性クエリには Elasticsearch / OpenSearch を、非同期ワークフローには Kafka を使える。

Cadence は Uber 内部で生まれ、2017 年に OSS 化され (`README.md:8`)、2025-05-22 に CNCF Sandbox に受理された。設計のルーツは AWS Simple Workflow Service と Azure Durable Task Framework にあり、それをセルフホスト型のシステムとして作り直したものである。

## いつ使うか

- プロセス再起動を生き延び、数分・数日・数か月にわたって動く必要がある多段処理 (注文フルフィルメント、インフラ rollout、機械学習の学習パイプラインなど)。
- 制御フロー (ループ、分岐、長時間スリープ、外部 signal の待機) を、静的な有向非巡回グラフ (DAG) や JSON DSL ではなく通常のコードとして書きたいとき。
- アクティビティの自動リトライと副作用の at-most-once 制御をプラットフォーム側に任せたいとき。
- キューや単純な遠隔手続き呼び出し (RPC) で足りる短命なリクエスト/レスポンス処理には向かない。
- スケジュール実行の固定データパイプライン DAG には向かず、その用途は Airflow や Argo Workflows が近い。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cadence-workflow/cadence リポジトリ](https://github.com/cadence-workflow/cadence)、コミット `66dcbaf` 時点。
2. [CNCF プロジェクトページ: Cadence Workflow](https://www.cncf.io/projects/cadence-workflow/)。
3. [Uber Blog: Cadence Workflow Joins the CNCF](https://www.uber.com/us/en/blog/cadence-workflow-joins-the-cloud-native-computing-foundation/)。
4. [cadenceworkflow.io: Cadence Joins CNCF](https://cadenceworkflow.io/blog/2025/10/06/cadence-joins-cncf-cloud-native-computing-foundation)。
5. [ia40: Temporal Founders Samar Abbas and Maxim Fateev](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev)。
6. [Amplify Partners: Our Investment in Temporal](https://www.amplifypartners.com/blog-posts/our-investment-in-temporal)。
7. [Instaclustr: Uber donates Cadence Workflow to CNCF](https://www.instaclustr.com/blog/cadence-workflow-uber-cncf-projects/)。
8. [Cadence vs Temporal FAQ](https://cadenceworkflow.io/faq/cadence-vs-temporal)。
9. [cncf/sandbox issue #368: Cadence](https://github.com/cncf/sandbox/issues/368)。
10. [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md)。
11. [cadence-go-client (公式 Go SDK)](https://github.com/cadence-workflow/cadence-go-client)。
12. [cadence-web (UI)](https://github.com/cadence-workflow/cadence-web)。
