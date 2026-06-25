# Internals

> Read from the source at commit `80b9e95`. Every claim here should point at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `flagd/main.go` | Binary entry; calls `cmd.Execute` (`flagd/main.go:11`) |
| `flagd/cmd/start.go` | cobra `start` subcommand and startup flags |
| `flagd/pkg/runtime/from_config.go` | Wires telemetry, store, evaluator, services from startup config (`from_config.go:55`) |
| `flagd/pkg/service/flag-evaluation/` | gRPC/OFREP services; protocol multiplexing and the shared resolver |
| `core/pkg/evaluator/json.go` | The JSON/JSONLogic flag evaluator |
| `core/pkg/store/store.go` | In-memory flag store backed by `hashicorp/go-memdb` |
| `core/pkg/sync/isync.go` | `ISync` contract and the `DataSync` / `SourceConfig` types |
| `core/pkg/sync/builder/syncbuilder.go` | Picks a sync implementation by provider/scheme |
| `core/pkg/model/flag.go` | The `Flag` type |

## Core data structures

- `model.Flag` (`core/pkg/model/flag.go:10-20`): key, state, defaultVariant, variants map, targeting (`json.RawMessage`), source, and metadata. `FlagSetId` and `Priority` are tagged `json:"-"`, so they are not serialised; they exist only for indexing (`flag.go:12-13`).
- `sync.DataSync` (`core/pkg/sync/isync.go:29-41`): the contract a sync implementation sends to the runtime. It carries `FlagData` (the raw config string), `Source`, `Selector`, and the experimental `IncrementalUpdates` flag.
- `sync.SourceConfig` (`core/pkg/sync/isync.go:43-70`): per-source configuration (uri, provider, tls, selector, interval, headers, oauth).
- `store.Store` (`core/pkg/store/store.go:33-39`): wraps a `*memdb.MemDB` plus the ordered `sources` slice. The schema defines seven indexes (`store.go:47-118`); the source slice order is the priority used to break duplicate-key ties.
- Reason codes (`core/pkg/model/reason.go`): `TARGETING_MATCH`, `STATIC`, `DEFAULT`, `DISABLED`, `ERROR`, and the internal `FALLBACK`, which the API translates to `DEFAULT`.

## A path worth tracing

Follow a boolean resolution from the wire to the store.

`FlagEvaluationService.ResolveBoolean` reads the selector header, puts the selector and proto version on the context, and calls the shared `resolve` (`flagd/pkg/service/flag-evaluation/flag_evaluator_v1.go:214-231`):

```go
selectorExpression := req.Header().Get(flagdService.FLAGD_SELECTOR_HEADER)
selector := store.NewSelector(selectorExpression)
ctx = context.WithValue(ctx, store.SelectorContextKey{}, selector)
ctx = context.WithValue(ctx, evaluator.ProtoVersionKey, "v1")
```

The shared `resolve[T]` merges contexts, calls the resolver, and formats errors (`flag_evaluator.go:349-384`). The evaluation body `evaluateVariant` pulls the flag out of the store, then short-circuits on a disabled flag (`core/pkg/evaluator/json.go:335-352`):

```go
flag, metadata, err := je.store.Get(ctx, flagKey, &selector)
if err != nil {
    return "", map[string]interface{}{}, model.ErrorReason, metadata, errors.New(model.FlagNotFoundErrorCode)
}
...
if flag.State == Disabled {
    return "", nil, model.DisabledReason, metadata, nil
}
```

If targeting exists, flagd injects `$flagd` properties (flag key and timestamp) into the context, marshals it, and runs the JSONLogic rule (`json.go:364-378`):

```go
evalCtx = setFlagdProperties(je.Logger, evalCtx, flagdProperties{
    FlagKey:   flagKey,
    Timestamp: time.Now().Unix(),
})
...
err = jsonlogic.Apply(bytes.NewReader(targetingBytes), bytes.NewReader(b), &result)
```

The rule result is stripped of quotes and matched against the flag's variants; a valid variant returns `TARGETING_MATCH`, otherwise an error (`json.go:401-409`). With no targeting, the `defaultVariant` is returned with reason `STATIC` (`json.go:420`). Finally the generic `resolve[T]` type-asserts the chosen variant value to the requested type and returns `TYPE_MISMATCH` if it does not match (`json.go:316-320`):

```go
value, ok = variants[variant].(T)
if !ok {
    return value, variant, model.ErrorReason, metadata, errors.New(model.TypeMismatchErrorCode)
}
```

## Things that surprised me

- The store is a transactional `go-memdb` instance with seven indexes, not a map (`core/pkg/store/store.go:47-118`). Duplicate-key conflicts across sources are resolved by source order: `priority := slices.Index(s.sources, source)` and the higher-priority source wins (`store.go:232`). An unregistered source `panic`s (`store.go:236`).
- Source URIs are registered verbatim, including blob query strings like `?use_path_style=true`, and a sync must emit `DataSync.Source` matching that exact string (`flagd/pkg/runtime/from_config.go:84-90`).
- `null` from a targeting rule is handled distinctly from the string `"null"`: the code trims the result and checks for `"null"` before stripping quotes, so it can tell JSON null apart from a literal variant named `null` (`core/pkg/evaluator/json.go:384-398`).
- The `fractional` operator buckets on `targetingKey` when no explicit bucketing property is supplied (`core/pkg/evaluator/json.go:30-32`), giving deterministic percentage splits per user.
