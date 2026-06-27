# 内部実装

> コミット `cdf66e2` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cartography/cli.py` | 引数解析と `main` エントリポイント (cli.py:210、cli.py:2762)。 |
| `cartography/sync.py` | ステージテーブルとオーケストレータ (sync.py:45、sync.py:137)。 |
| `cartography/intel/` | プロバイダごとに 1 モジュール。各々が `get / transform / load / cleanup / sync` を持つ。 |
| `cartography/models/` | 宣言的な frozen dataclass のノード・関係スキーマ。 |
| `cartography/graph/querybuilder.py` | スキーマから MERGE ingestion クエリを生成 (querybuilder.py:1128)。 |
| `cartography/graph/cleanupbuilder.py` | 古いデータの削除クエリを生成 (cleanupbuilder.py:16)。 |
| `cartography/graph/job.py` | 生成された cleanup クエリを実行する `GraphJob` (job.py:217)。 |
| `cartography/client/core/tx.py` | `load`、バッチ処理、write-with-retry (tx.py:784)。 |

## 中核データ構造

`PropertyRef` (cartography/models/core/common.py:1) は Neo4j プロパティ値の出所を表す。既定の `set_in_kwargs=False` なら処理中の dict のフィールドから読み、`set_in_kwargs=True` なら単一のキーワード引数変数から読む。その `__repr__` は `item.<name>` かパラメータ参照のいずれかを返し、その文字列がそのまま生成 Cypher に入る (common.py:165-167)。

```python
        return (
            f"item.{self.name}" if not self.set_in_kwargs else self._parameterize_name()
        )
```

`CartographyNodeProperties` (cartography/models/core/nodes.py:13) は抽象 frozen dataclass である。`id` と `lastupdated` を必須フィールドとして宣言し (nodes.py:46-47)、`firstseen` を定義したサブクラスを拒否する。`firstseen` は作成時にクエリビルダが設定する予約語だからだ (nodes.py:63-68)。

```python
        if hasattr(self, "firstseen"):
            raise TypeError(
                "`firstseen` is a reserved word and is automatically set by the querybuilder on cartography nodes, so "
                f'it cannot be used on class "{type(self).__name__}(CartographyNodeProperties)". Please either choose '
                "a different name for `firstseen` or omit altogether.",
            )
```

`CartographyNodeSchema` (cartography/models/core/nodes.py:141) がこれらを束ねる。label、properties、sub-resource relationship、その他の relationship、extra labels を持つ。関係側では `CartographyRelSchema` (cartography/models/core/relationships.py:263) が `TargetNodeMatcher` (relationships.py:97) と `LinkDirection` (relationships.py:13) を保持する。AWS EMR スキーマが具体例だ。`EMRClusterToAWSAccountRel` は `target_node_label = "AWSAccount"` (cartography/models/aws/emr.py:48)、`PropertyRef("AWS_ID", set_in_kwargs=True)` でマッチ (emr.py:50)、`LinkDirection.INWARD` (emr.py:52)、`rel_label = "RESOURCE"` (emr.py:53) を設定する。

## 追う価値のあるパス

1 回の EMR sync の書込側を追う。

`load_emr_clusters` (cartography/intel/aws/emr.py:73) がスキーマと 3 つのキーワード引数とともに `load` を呼ぶ (emr.py:83-90)。

```python
    load(
        neo4j_session,
        EMRClusterSchema(),
        cluster_data,
        lastupdated=aws_update_tag,
        Region=region,
        AWS_ID=current_aws_account_id,
    )
```

`load` (cartography/client/core/tx.py:784) はデータが空なら早期 return し、index を確保し、クエリを構築してから書き込む (tx.py:832-837)。

```python
    if len(dict_list) == 0:
        # If there is no data to load, save some time.
        return
    ensure_indexes(neo4j_session, node_schema)
    ingestion_query = build_ingestion_query(node_schema)
    load_graph_data(
```

`build_ingestion_query` (cartography/graph/querybuilder.py:1128) がテンプレートを埋める。テンプレート本体は次の通り (querybuilder.py:1176-1186)。

```text
        UNWIND $DictList AS item
            MERGE (i:$node_label{id: $dict_id_field})
            ON CREATE SET i.firstseen = timestamp()
            SET
                i._module_name = "$module_name",
                i._module_version = "$module_version",
                $set_node_properties_statement
                $set_ontology_node_properties_statement
            $attach_relationships_statement
```

`load_graph_data` (cartography/client/core/tx.py:638) が行をバッチに分ける。バッチサイズは既定 10000 で (tx.py:642)、各バッチは `execute_write_with_retry` で送られる (tx.py:691-698)。

```python
    for data_batch in batch(dict_list, size=batch_size):
        execute_write_with_retry(
            neo4j_session,
            write_list_of_dicts_tx,
            query,
            DictList=data_batch,
            **kwargs,
        )
```

## 読んで驚いた点

本当に微妙なのは削除ロジックだ。Cartography は以前の状態と差分を取らない。load 後、cleanup ジョブは `lastupdated` がその実行の update tag と一致しないノードや関係をすべて削除する。cascade なしのノード削除節は次の通り (cartography/graph/cleanupbuilder.py:338-340)。

```text
        WHERE n.lastupdated <> $UPDATE_TAG
        WITH n LIMIT $LIMIT_SIZE
        DETACH DELETE n;
```

古い sub-resource 関係の節も対称的だ (cleanupbuilder.py:350-352)。

```text
            WHERE s.lastupdated <> $UPDATE_TAG
            WITH s LIMIT $LIMIT_SIZE
            DELETE s;
```

2 つ目の驚きはスコープだ。cleanup は sub-resource relationship (EMR クラスタなら所有する AWS アカウント) に紐づくため、あるアカウントの古い実行が別アカウントのデータを削除しない。ビルドコードは関係削除を出力する前に target node matcher を検証する (cleanupbuilder.py:344-353)。結果として各 sync はグラフ全体ではなくアカウント単位のスナップショットを書き換える。

3 つ目の驚きは遅延 import だ。`_LazyStage.__call__` は初回利用時に本物の関数を解決するため (sync.py:36-39)、オーケストレータを import しても、ステージが実際に走るまで boto3 やクラウド SDK を引き込まない。
