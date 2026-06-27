# Internals

> Read from the source at commit `cdf66e2`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cartography/cli.py` | Argument parsing and the `main` entrypoint (cli.py:210, cli.py:2762). |
| `cartography/sync.py` | The stage table and orchestrator (sync.py:45, sync.py:137). |
| `cartography/intel/` | One module per provider, each with `get / transform / load / cleanup / sync`. |
| `cartography/models/` | Declarative frozen-dataclass node and relationship schemas. |
| `cartography/graph/querybuilder.py` | Generates the MERGE ingestion query from a schema (querybuilder.py:1128). |
| `cartography/graph/cleanupbuilder.py` | Generates the stale-data delete queries (cleanupbuilder.py:16). |
| `cartography/graph/job.py` | `GraphJob`, which runs the generated cleanup queries (job.py:217). |
| `cartography/client/core/tx.py` | `load`, batching, and write-with-retry (tx.py:784). |

## Core data structures

`PropertyRef` (cartography/models/core/common.py:1) describes where a Neo4j property value comes from. With its default `set_in_kwargs=False` the value is read from the field of the dict being processed; with `set_in_kwargs=True` it is read from a single keyword-argument variable. Its `__repr__` returns either `item.<name>` or a parameter reference, and that string is what lands in the generated Cypher (common.py:165-167):

```python
        return (
            f"item.{self.name}" if not self.set_in_kwargs else self._parameterize_name()
        )
```

`CartographyNodeProperties` (cartography/models/core/nodes.py:13) is an abstract frozen dataclass. It declares `id` and `lastupdated` as required fields (nodes.py:46-47) and rejects any subclass that defines `firstseen`, because the query builder sets that on create (nodes.py:63-68):

```python
        if hasattr(self, "firstseen"):
            raise TypeError(
                "`firstseen` is a reserved word and is automatically set by the querybuilder on cartography nodes, so "
                f'it cannot be used on class "{type(self).__name__}(CartographyNodeProperties)". Please either choose '
                "a different name for `firstseen` or omit altogether.",
            )
```

`CartographyNodeSchema` (cartography/models/core/nodes.py:141) ties it together: a label, properties, a sub-resource relationship, other relationships, and extra labels. For relationships, `CartographyRelSchema` (cartography/models/core/relationships.py:263) carries a `TargetNodeMatcher` (relationships.py:97) and a `LinkDirection` (relationships.py:13). The AWS EMR schema is a concrete example: `EMRClusterToAWSAccountRel` sets `target_node_label = "AWSAccount"` (cartography/models/aws/emr.py:48), matches on `PropertyRef("AWS_ID", set_in_kwargs=True)` (emr.py:50), uses `LinkDirection.INWARD` (emr.py:52), and `rel_label = "RESOURCE"` (emr.py:53).

## A path worth tracing

Trace the write side of one EMR sync.

`load_emr_clusters` (cartography/intel/aws/emr.py:73) calls `load` with the schema and three keyword arguments (emr.py:83-90):

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

`load` (cartography/client/core/tx.py:784) returns early on empty data, ensures indexes, builds the query, then writes (tx.py:832-837):

```python
    if len(dict_list) == 0:
        # If there is no data to load, save some time.
        return
    ensure_indexes(neo4j_session, node_schema)
    ingestion_query = build_ingestion_query(node_schema)
    load_graph_data(
```

`build_ingestion_query` (cartography/graph/querybuilder.py:1128) fills a template. The template body is (querybuilder.py:1176-1186):

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

`load_graph_data` (cartography/client/core/tx.py:638) batches the rows. The batch size defaults to 10000 (tx.py:642), and each batch is sent with `execute_write_with_retry` (tx.py:691-698):

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

## Things that surprised me

The deletion logic carries the real subtlety. Cartography never diffs against the previous state. After loading, the cleanup job deletes any node or relationship whose `lastupdated` does not match this run's update tag. The non-cascade node delete clause is (cartography/graph/cleanupbuilder.py:338-340):

```text
        WHERE n.lastupdated <> $UPDATE_TAG
        WITH n LIMIT $LIMIT_SIZE
        DETACH DELETE n;
```

The stale sub-resource relationship clause mirrors it (cleanupbuilder.py:350-352):

```text
            WHERE s.lastupdated <> $UPDATE_TAG
            WITH s LIMIT $LIMIT_SIZE
            DELETE s;
```

The second surprise is scope. Cleanup is anchored to the sub-resource relationship (for EMR clusters, the owning AWS account), so a stale run for one account does not delete another account's data. The build code validates the target node matcher before emitting the relationship delete (cleanupbuilder.py:344-353). The effect is that each sync rewrites a per-account snapshot rather than the whole graph.

The third surprise is lazy imports. `_LazyStage.__call__` resolves the real function on first use (sync.py:36-39), so importing the orchestrator does not pull in boto3 or the cloud SDKs until a stage actually runs.
