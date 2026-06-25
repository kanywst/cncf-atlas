# Internals

> Read from the source at commit `bccd96d`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `packages/catalog-model/src/entity/Entity.ts` | The `Entity` and `EntityMeta` types every component keys off |
| `packages/catalog-model/src/entity/ref.ts` | Entity-reference parse/stringify utilities used as map keys throughout processing |
| `packages/catalog-model/src/kinds/` | The standard kinds plus newer `AiResourceEntityV1alpha1` and `McpServerApiEntity` |
| `plugins/catalog-backend/src/processing/DefaultCatalogProcessingEngine.ts` | The reconcile engine: poll, process, hash, persist, mark for stitching |
| `plugins/catalog-backend/src/processing/DefaultCatalogProcessingOrchestrator.ts` | Runs the processor chain for one entity and enforces location rules |
| `plugins/catalog-backend/src/processing/TaskPipeline.ts` | Watermark-driven polling pipeline that feeds the engine |
| `plugins/catalog-backend/src/stitching/DefaultStitcher.ts` | Assembles the final entity in `final_entities` |
| `packages/backend-plugin-api/src/services/definitions/CoreServices.ts` | Declares the DI core services |

## Core data structures

The `Entity` type is the spine: `apiVersion`, `kind`, `metadata`, optional `spec`, optional `relations` (`packages/catalog-model/src/entity/Entity.ts:28-54`). The invariant worth knowing is in `EntityMeta`: `uid` and `etag` are server-owned. The docstrings state they cannot be set by the user at creation time and the server will reject requests that try (`Entity.ts:67-100`, fields at `uid` line 77 and `etag` line 89 in that block).

Entity references are the other foundational structure. `parseEntityRef`, `stringifyEntityRef`, and `getCompoundEntityRef` convert between the `kind:namespace/name` string form and a `CompoundEntityRef` object (`packages/catalog-model/src/entity/ref.ts:55`, `:77`, `:140`). Processing and stitching use these ref strings as map keys, which is why the relation-diff logic in the engine builds `Map<string, string>` keyed by stringified refs.

The processing queue item is `RefreshStateItem`: `id`, `unprocessedEntity`, `state`, `entityRef`, `locationKey`, `resultHash`. The engine destructures exactly these fields when it processes a task (`DefaultCatalogProcessingEngine.ts:155-172`).

## A path worth tracing

Follow one entity through `processTask` and the result-hash decision. After the orchestrator returns, the engine builds a hash over the completed entity, the deferred entities, relations, refresh keys, and the parents it looked up (`DefaultCatalogProcessingEngine.ts:219-239`). Then the fast path:

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

If the hash differs, `updateProcessedEntity` persists the new processed entity and returns the previous relations. The engine turns old and new relations into two maps keyed by `source:type->target`, then adds to `setOfThingsToStitch` every source whose relation appeared or disappeared, and finally calls `markForStitching` (`DefaultCatalogProcessingEngine.ts:292-342`). That set, not the whole catalog, is what gets re-stitched.

## Things that surprised me

`DefaultCatalogProcessingEngine` does not implement the externally-visible `CatalogProcessingEngine` interface. A `NOTE(freben)` comment says the type's name is historic and that several different engines now hide behind that interface, of which this is one (`DefaultCatalogProcessingEngine.ts:55-60`).

There is a per-entity, per-processor cache with a TTL. `CACHE_TTL = 5` (`DefaultCatalogProcessingEngine.ts:44`). On a successful run the cache is rewritten with `ttl: CACHE_TTL`; on failure the engine counts the TTL down and, when it hits zero, drops the cache to `{}` (`DefaultCatalogProcessingEngine.ts:177-201`). So a failing entity keeps its cached state for a few cycles before the cache is finally cleared.

Metrics are recorded twice on purpose. The prom-client counters and summaries are explicitly marked deprecated in favour of OpenTelemetry, with `DEPRECATED, use OpenTelemetry metrics instead` baked into each metric's help text while both are emitted during the migration (`DefaultCatalogProcessingEngine.ts:388-409`).
