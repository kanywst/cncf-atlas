# 内部実装

> コミット `bccd96d` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `packages/catalog-model/src/entity/Entity.ts` | 全コンポーネントがキーにする `Entity` と `EntityMeta` 型 |
| `packages/catalog-model/src/entity/ref.ts` | 処理全体でマップのキーに使う entity ref の parse/stringify ユーティリティ |
| `packages/catalog-model/src/kinds/` | 標準 kind 群と、新しい `AiResourceEntityV1alpha1`・`McpServerApiEntity` |
| `plugins/catalog-backend/src/processing/DefaultCatalogProcessingEngine.ts` | reconcile エンジン: ポーリング・処理・ハッシュ・永続化・stitching フラグ |
| `plugins/catalog-backend/src/processing/DefaultCatalogProcessingOrchestrator.ts` | 1 entity に対し processor チェーンを回し location ルールを強制 |
| `plugins/catalog-backend/src/processing/TaskPipeline.ts` | エンジンに供給する watermark 駆動のポーリングパイプライン |
| `plugins/catalog-backend/src/stitching/DefaultStitcher.ts` | `final_entities` に最終 entity を組み立てる |
| `packages/backend-plugin-api/src/services/definitions/CoreServices.ts` | DI の core service を宣言 |

## 中核データ構造

`Entity` 型が背骨だ。`apiVersion`・`kind`・`metadata`・任意の `spec`・任意の `relations` (`packages/catalog-model/src/entity/Entity.ts:28-54`)。知っておくべき不変条件は `EntityMeta` にある。`uid` と `etag` はサーバ所有だ。docstring はこれらが作成時にユーザによって設定できず、設定しようとするリクエストをサーバが拒否すると明記している (`Entity.ts:67-100`、当該ブロック内で `uid` が 77 行目、`etag` が 89 行目)。

entity ref はもう 1 つの基礎構造だ。`getCompoundEntityRef`・`parseEntityRef`・`stringifyEntityRef` が `kind:namespace/name` の文字列形式と `CompoundEntityRef` オブジェクトを相互変換する (`packages/catalog-model/src/entity/ref.ts:55`, `:77`, `:140`)。処理と stitching はこの ref 文字列をマップのキーに使う。だからエンジンの relation 差分ロジックは stringify した ref をキーにした `Map<string, string>` を組む。

処理キューのアイテムは `RefreshStateItem` だ: `id`・`unprocessedEntity`・`state`・`entityRef`・`locationKey`・`resultHash`。エンジンはタスクを処理するときまさにこれらのフィールドを分解する (`DefaultCatalogProcessingEngine.ts:155-172`)。

## 追う価値のあるパス

1 つの entity を `processTask` と result-hash の判断まで追う。オーケストレータが返った後、エンジンは completed entity・deferred entity・relations・refresh keys・引いた parents にわたるハッシュを組む (`DefaultCatalogProcessingEngine.ts:219-239`)。そしてファストパス:

```text
const resultHash = hashBuilder.digest('hex');
if (resultHash === previousResultHash) {
  // If nothing changed in our produced outputs, we cannot have any
  // significant effect on our surroundings; therefore, we just abort
  // without any updates / stitching.
  track.markSuccessfulWithNoChanges();
  return;
}
```

ハッシュが異なれば `updateProcessedEntity` が新しい processed entity を永続化し、前回の relations を返す。エンジンは旧/新の relations を `source:type->target` をキーにした 2 つのマップに変換し、出現または消滅した relation の source すべてを `setOfThingsToStitch` に加え、最後に `markForStitching` を呼ぶ (`DefaultCatalogProcessingEngine.ts:292-342`)。再 stitch されるのはこの集合であって、カタログ全体ではない。

## 読んで驚いた点

`DefaultCatalogProcessingEngine` は外部公開の `CatalogProcessingEngine` インターフェースを実装していない。`NOTE(freben)` のコメントが、この型名は歴史的なもので、今は複数の異なるエンジンがこのインターフェースの裏に隠れており、これはそのうちの 1 つだと述べている (`DefaultCatalogProcessingEngine.ts:55-60`)。

entity ごと・processor ごとの TTL 付きキャッシュがある。`CACHE_TTL = 5` (`DefaultCatalogProcessingEngine.ts:44`)。成功時はキャッシュが `ttl: CACHE_TTL` で書き直され、失敗時はエンジンが TTL をカウントダウンし、0 になるとキャッシュを `{}` に落とす (`DefaultCatalogProcessingEngine.ts:177-201`)。つまり失敗し続ける entity は数サイクルの間キャッシュ状態を保持してから、最終的にクリアされる。

メトリクスは意図的に二重に記録される。prom-client のカウンタとサマリは OpenTelemetry へ移行のため明示的に deprecated とされ、各メトリクスの help テキストに `DEPRECATED, use OpenTelemetry metrics instead` が焼き込まれた状態で、移行期間中は両方を emit している (`DefaultCatalogProcessingEngine.ts:388-409`)。
