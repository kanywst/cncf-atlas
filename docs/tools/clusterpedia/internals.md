# Internals

> Read from the source at commit `bece343`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `pkg/apiserver` | Bootstraps the Aggregated API server and installs the API group |
| `pkg/kubeapiserver` | The query entry point; routes resource requests and reuses upstream list/get handlers |
| `pkg/kubeapiserver/resourcerest` | REST storage adapter that decodes query options and calls the storage layer |
| `pkg/storage` | The storage layer interface and the name-based factory registry |
| `pkg/storage/internalstorage` | Default MySQL/PostgreSQL implementation: schema, query builder, JSON predicates |
| `pkg/synchromanager/clustersynchro` | Per-cluster synchro that runs informers and writes to storage |
| `staging/src/github.com/clusterpedia-io/api` | Public API types: `PediaCluster` CRD and the extended `ListOptions` |

## Core data structures

`Resource` (`pkg/storage/internalstorage/types.go:90`) is the one table every synced object lands in. It carries Group, Version, Resource, Kind, Cluster, Namespace, Name, OwnerUID, UID, and ResourceVersion as columns, and stores the whole object body in a single JSON column:

```go
    Object datatypes.JSON `gorm:"not null"`
```

That field is defined at `pkg/storage/internalstorage/types.go:105`. The composite unique index `uni_group_version_resource_cluster_namespace_name` over the GroupVersionResource (GVR) plus cluster, namespace, and name keeps synchronization idempotent.

`internal.ListOptions` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:50`) is the search vocabulary. Beyond the embedded Kubernetes `ListOptions`, it adds `Names`, `ClusterNames`, and `Namespaces` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:53` to `:55`), an `EnhancedFieldSelector` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:71`), an `ExtraLabelSelector` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:74`), and a raw `URLQuery` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:77`).

`PediaCluster` and its `ClusterSpec` (`staging/src/github.com/clusterpedia-io/api/cluster/v1alpha2/types.go:59` and `:70`) are the registration CRD. A cluster connects with a `Kubeconfig` (`staging/src/github.com/clusterpedia-io/api/cluster/v1alpha2/types.go:72`) or an apiserver address plus certificates, declares synced resources in `SyncResources` (`:92`), and can opt into all custom resources with `SyncAllCustomResources` (`:95`).

`JSONQueryExpression` (`pkg/storage/internalstorage/json_builder.go:46`), constructed by `JSONQuery` (`pkg/storage/internalstorage/json_builder.go:54`), is a gorm clause that renders a label or field selector into a dialect-specific JSON-path predicate.

## A path worth tracing

The search-to-SQL translation lives in `applyListOptionsToQuery` (`pkg/storage/internalstorage/util.go:184`). Cluster, namespace, and name each become equality or `IN` clauses depending on cardinality. The cluster case is verbatim:

```go
    switch len(opts.ClusterNames) {
    case 0:
    case 1:
        query = query.Where("cluster = ?", opts.ClusterNames[0])
    default:
        query = query.Where("cluster IN ?", opts.ClusterNames)
    }
```

That block is at `pkg/storage/internalstorage/util.go:185` to `:191`; namespace follows at `:193` and name at `:201`. Time bounds become `created_at` comparisons: `since` at `pkg/storage/internalstorage/util.go:210` and `before` at `:214`. Each label requirement becomes a JSON-path predicate built by `JSONQuery("object", "metadata", "labels", requirement.Key())` (`pkg/storage/internalstorage/util.go:231`) and attached with `query.Where(jsonQuery)` (`pkg/storage/internalstorage/util.go:248`). Fuzzy name search renders as `name LIKE ?` (`pkg/storage/internalstorage/util.go:260`). The enhanced field selector reuses the same builder over an arbitrary object path with `JSONQuery("object", fields...)` (`pkg/storage/internalstorage/util.go:288`). Limit and offset paginate at `pkg/storage/internalstorage/util.go:342` and `:348`.

The chain from HTTP to database:

```text
ResourceHandler.ServeHTTP            pkg/kubeapiserver/resource_handler.go:42
  handlers.ListResource              pkg/kubeapiserver/resource_handler.go:154
    RESTStorage.List                 pkg/kubeapiserver/resourcerest/storage.go:110
      resolveListOptions             pkg/kubeapiserver/resourcerest/storage.go:77
      ResourceStorage.List           pkg/storage/internalstorage/resource_storage.go:222
        genListObjectsQuery          pkg/storage/internalstorage/resource_storage.go:203
          applyListOptionsToQuery    pkg/storage/internalstorage/util.go:184
        result.From(query)           pkg/storage/internalstorage/resource_storage.go:234
```

## Things that surprised me

The label key is never normalized into its own column. A `JSONQueryExpression.Build` (`pkg/storage/internalstorage/json_builder.go:120`) emits different SQL per dialect. For MySQL and SQLite the value is unwrapped to a string before comparison, and the choice is made inline:

```go
                if dialector == "mysql" {
                    // Wrap`JSON_UNQUOTE` function to convert all json results to strings.
                    // https://github.com/clusterpedia-io/clusterpedia/pull/62
                    jsonQuery.writeJSONKeyWithJSON_UNQUOTE(builder)
                } else {
                    // Wrap`CAST as TEXT` function to convert all json results to strings.
                    jsonQuery.writeJSONKeyWithCAST_TO_TEXT(builder)
                }
```

That branch is at `pkg/storage/internalstorage/json_builder.go:140` to `:147`; PostgreSQL takes a separate path at `pkg/storage/internalstorage/json_builder.go:171` using `->` and `->>` operators built by `writePostgresJSONKey` (`pkg/storage/internalstorage/json_builder.go:98`). So adding a new backend means re-deriving JSON-path SQL for that engine.

Two more non-obvious choices. There is no default `ORDER BY`; the comment pins the reasoning to pull request #44 (`pkg/storage/internalstorage/util.go:324`). Raw and parameterized SQL search are off unless feature gates are enabled; `applyListOptionsURLQueryToWhereClause` is called with `AllowRawSQLQuery` and `AllowParameterizedSQLQuery` read from the feature gate (`pkg/storage/internalstorage/util.go:217` to `:222`), so untrusted URL query cannot inject SQL by default.
