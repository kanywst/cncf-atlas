# 内部実装

> コミット `bece343` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `pkg/apiserver` | Aggregated API サーバを bootstrap し API グループをインストールする |
| `pkg/kubeapiserver` | クエリ入口。資源リクエストをルーティングし上流の list/get ハンドラを再利用する |
| `pkg/kubeapiserver/resourcerest` | クエリオプションを decode しストレージ層を呼ぶ REST storage アダプタ |
| `pkg/storage` | ストレージ層インターフェースと名前ベースのファクトリレジストリ |
| `pkg/storage/internalstorage` | デフォルトの MySQL/PostgreSQL 実装: スキーマ、クエリビルダ、JSON 述語 |
| `pkg/synchromanager/clustersynchro` | informer を回しストレージへ書くクラスタごとの synchro |
| `staging/src/github.com/clusterpedia-io/api` | 公開 API 型: `PediaCluster` CRD と拡張版 `ListOptions` |

## 中核データ構造

`Resource` (`pkg/storage/internalstorage/types.go:90`) は同期される全オブジェクトが落ちる 1 枚のテーブル。Group・Version・Resource・Kind・Cluster・Namespace・Name・OwnerUID・UID・ResourceVersion を列に持ち、オブジェクト本体は JSON カラム 1 本に保存する:

```go
    Object datatypes.JSON `gorm:"not null"`
```

このフィールドは `pkg/storage/internalstorage/types.go:105` で定義される。GroupVersionResource (GVR) と cluster・namespace・name に張った複合 unique index `uni_group_version_resource_cluster_namespace_name` が同期の冪等性を担保する。

`internal.ListOptions` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:50`) が検索語彙だ。埋め込んだ Kubernetes `ListOptions` に加え、`Names`・`ClusterNames`・`Namespaces` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:53` から `:55`)、`EnhancedFieldSelector` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:71`)、`ExtraLabelSelector` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:74`)、生の `URLQuery` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:77`) を足している。

`PediaCluster` とその `ClusterSpec` (`staging/src/github.com/clusterpedia-io/api/cluster/v1alpha2/types.go:59` と `:70`) が登録 CRD。クラスタは `Kubeconfig` (`staging/src/github.com/clusterpedia-io/api/cluster/v1alpha2/types.go:72`) か apiserver アドレス + 証明書で接続し、同期資源を `SyncResources` (`:92`) で宣言し、`SyncAllCustomResources` (`:95`) で全 custom resource を opt-in できる。

`JSONQueryExpression` (`pkg/storage/internalstorage/json_builder.go:46`) は `JSONQuery` (`pkg/storage/internalstorage/json_builder.go:54`) で生成される gorm clause で、label または field selector を方言別の JSON path 述語にレンダリングする。

## 追う価値のあるパス

検索から SQL への変換は `applyListOptionsToQuery` (`pkg/storage/internalstorage/util.go:184`) にある。cluster・namespace・name は要素数に応じて等値または `IN` 句になる。cluster のケースをそのまま引く:

```go
    switch len(opts.ClusterNames) {
    case 0:
    case 1:
        query = query.Where("cluster = ?", opts.ClusterNames[0])
    default:
        query = query.Where("cluster IN ?", opts.ClusterNames)
    }
```

このブロックは `pkg/storage/internalstorage/util.go:185` から `:191`。namespace は `:193`、name は `:201` で続く。時間範囲は `created_at` 比較になり、`since` は `pkg/storage/internalstorage/util.go:210`、`before` は `:214`。各 label requirement は `JSONQuery("object", "metadata", "labels", requirement.Key())` (`pkg/storage/internalstorage/util.go:231`) で JSON path 述語に変換され `query.Where(jsonQuery)` (`pkg/storage/internalstorage/util.go:248`) で付与される。あいまい名前検索は `name LIKE ?` (`pkg/storage/internalstorage/util.go:260`) になる。enhanced field selector は任意オブジェクトパスに対して同じビルダを `JSONQuery("object", fields...)` (`pkg/storage/internalstorage/util.go:288`) で再利用する。limit と offset は `pkg/storage/internalstorage/util.go:342` と `:348` でページングする。

HTTP からデータベースまでのチェーン:

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

## 読んで驚いた点

label のキーは独立した列に正規化されない。`JSONQueryExpression.Build` (`pkg/storage/internalstorage/json_builder.go:120`) は方言ごとに違う SQL を出す。MySQL と SQLite では比較前に値を文字列へ unwrap し、その選択がインラインで行われる:

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

この分岐は `pkg/storage/internalstorage/json_builder.go:140` から `:147`。PostgreSQL は `pkg/storage/internalstorage/json_builder.go:171` で別パスを取り、`writePostgresJSONKey` (`pkg/storage/internalstorage/json_builder.go:98`) が組む `->` と `->>` 演算子を使う。つまり新しいバックエンドを足すには、そのエンジン向けに JSON path SQL を導き直す必要がある。

非自明な選択がもう 2 つ。デフォルトの `ORDER BY` はなく、その理由は pull request #44 にコメントで紐づく (`pkg/storage/internalstorage/util.go:324`)。生 SQL と parameterized SQL 検索は feature gate を有効にしない限りオフだ。`applyListOptionsURLQueryToWhereClause` は feature gate から読んだ `AllowRawSQLQuery` と `AllowParameterizedSQLQuery` を渡して呼ばれる (`pkg/storage/internalstorage/util.go:217` から `:222`) ので、信用できない URL query がデフォルトで SQL を注入することはできない。
