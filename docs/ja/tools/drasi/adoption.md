# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS` ファイルはなく、本ディープダイブで出典を示せる名指しの組織は 1 つ、南アフリカのフリート監視・管理企業 Netstar である。Netstar はプレビューパートナーとして Drasi を運用した。Netstar は車両と貨物を集荷から港湾ターミナルまで追跡しており、別々のシステムに存在する車両 ID・ウェイポイント・GPS・IoT テレメトリを突き合わせるために、毎回同じ統合を作り直していた。その繰り返しの統合作業を Drasi の継続的クエリとリアクションに置き換え、Drasi の Grafana プラグインで結果を 1 つのダッシュボードに集約した。CNCF ケーススタディと Microsoft Community Hub のブログは、いずれも Netstar のテクニカルリード Daniel Joubert とソリューションアーキテクト Dustyn Lightfoot のコメントを引いている (CNCF ケーススタディ、Microsoft Community Hub)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Netstar | フリート・貨物監視: 車両 ID・ウェイポイント・GPS・IoT テレメトリをシステム横断で継続的クエリとリアクションにより突き合わせ、1 つの Grafana ダッシュボードに表示 | [CNCF ケーススタディ](https://www.cncf.io/case-studies/netstar/), [Microsoft Community Hub](https://techcommunity.microsoft.com/blog/linuxandopensourceblog/how-netstar-streamlined-fleet-monitoring-and-reduced-custom-integrations-with-dr/4499592) |

## 採用のシグナル

名指しの外部採用者が乏しいため、測定可能なシグナルの比重が大きい。2026-07-08 時点 (GitHub API): スター 1,244、フォーク 87。リポジトリは 2024-05-27 作成、最終 push は 2026-07-06。README には OpenSSF Best Practices バッジがある (プロジェクト 10588)。Drasi は 2025-01-21 に受理された若い CNCF Sandbox プロジェクトで、Azure ブログは Dapr・KEDA・Radius・Copacetic と並ぶ Microsoft の CNCF 貢献の一部として位置づけている (CNCF プロジェクトページ、Azure ブログ)。開発は Microsoft 主導であり、これはこの段階のプロジェクトで見ておくべき主なガバナンス上の集中である。

## エコシステム

Drasi は単独で立つのではなく、いくつかのプロジェクトに結びついている。pub/sub・仮想アクター・状態のために **Dapr** に依存しており、これは同じ Azure Incubations チーム発である。そのため疎結合なコンポーネントモデルはおおむね Dapr の存在を前提とする。リレーショナル Source は変更データキャプチャ (CDC) エンジンとして **Debezium** を内包しており (`sources/relational/debezium-reactivator`)、Debezium は置き換える対象ではなく使う部品である。クエリ言語は **Cypher** (openCypher) で、これが 1 つのクエリで複数ソースをグラフとして結合できる理由になっている。可視化には Drasi の **Grafana** プラグインがクエリ結果を描画する。Netstar の事例がその例だ (CNCF ケーススタディ)。それ以外にも Source と Reaction は SDK で拡張でき、プリビルトのセットは Source 側で PostgreSQL・Cosmos DB・Dataverse・Event Hubs・Kubernetes、Reaction 側で HTTP・SignalR・Gremlin・Dapr・SQL・Debezium・AWS・Azure・Power Platform・ベクトルストア同期・MCP に及ぶ (`sources/`, `reactions/`)。

## 代替候補

Drasi の特徴は、複数ソースをまたぐ条件をライブな Cypher クエリとして評価し、データを自前のストアに移さず、結果差分に対してリアクションを走らせる点にある。代替はそれぞれこの範囲の一部をカバーする。

| 代替 | 違い |
| --- | --- |
| Debezium | データベースから変更ストリームを取り出すところまでで止まる。常駐クエリの評価も、結果集合の差分化も、リアクションの発火もしない。Drasi は Debezium をリレーショナル Source の内側で使い、その上に評価とリアクションの層を足す |
| Materialize | SQL で増分ビュー維持を提供するデータベース。増分ビューの発想は近いが、Materialize はデータを自前ストレージに取り込み SQL を話す。Drasi はデータを移さず、複数ソースを Cypher で横断し、Kubernetes 上でリアクションまで走らせる |
| ksqlDB / Kafka Streams | Kafka トピック中心のストリーム処理。Drasi は Kafka を前提とせず、任意のシステムの change feed を Source 化してグラフパターンで評価する |
| Apache Flink | 汎用で低レベルなストリーム処理エンジンで、表現力とスケールは上。検知・評価・反応のパターンは自分で組む。Drasi はそのパターンを Source/Continuous Query/Reaction という固定の形と宣言的リソースとして提供する |
