# Internals

> Read from the source at commit `56aace77`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/crossplane/main.go` | Entry point and kong CLI; `main()` at `cmd/crossplane/main.go:87` |
| `cmd/crossplane/core/core.go` | Wires up controllers; `(*startCommand).Run` at `cmd/crossplane/core/core.go:164` |
| `internal/controller/apiextensions/composite/` | XR reconciler and the function composer |
| `internal/controller/pkg/` | Package manager for Provider, Configuration, Function packages |
| `internal/controller/ops/` | Operations (v2): run a pipeline once like a Job |
| `internal/dag/` | DAG for package dependency resolution (`internal/dag/dag.go:17`) |
| `internal/engine/` | Dynamic controller lifecycle (`internal/engine/engine.go:17`) |
| `apis/apiextensions/` | API types for XRD, Composition, CompositionRevision |
| `proto/fn/v1/run_function.proto` | gRPC contract between Crossplane and functions |

## Core data structures

- **`PipelineStep`** (`apis/apiextensions/v1/composition_common.go:59`): one step of a function pipeline. It carries a `Step` name, a `FunctionRef`, an optional `Input`, `Credentials`, and `Requirements`. A Composition holds `Pipeline []PipelineStep` (`apis/apiextensions/v1/composition_types.go:54`).
- **`CompositeResourceDefinition`** (XRD) (`apis/apiextensions/v2/xrd_types.go:269`, spec at `apis/apiextensions/v2/xrd_types.go:40`): defines a new XR type. v2 added `Scope` (`apis/apiextensions/v2/xrd_types.go:60`, Namespaced or Cluster) and deprecated claim names (`apis/apiextensions/v2/xrd_types.go:114`).
- **`CompositionRevision`** (`apis/apiextensions/v1/composition_revision_types.go:102`): an immutable snapshot of a Composition. An XR can pin to a revision to control rollout.
- **`RunFunctionRequest` / `State` / `Resource`** (`proto/fn/v1/run_function.proto:39`, `:281`, `:292`): the protobuf contract. `State` holds the XR (`composite`) and a `map<string, Resource> resources` for composed resources. A function returns the complete desired state.
- **`FunctionComposer`** (`internal/controller/apiextensions/composite/composition_functions.go:130`): the pipeline executor. It orchestrates observe, run pipeline, and garbage collect.

## A path worth tracing

Trace an XR reconcile through the function pipeline. The reconciler resolves the Composition and CompositionRevision, then calls `Compose` (`internal/controller/apiextensions/composite/reconciler.go:745`). The composer is `(*FunctionComposer).Compose` (`composition_functions.go:288`):

```text
composition_functions.go:296  ObserveComposedResources   observe existing composed resources
composition_functions.go:307  FetchConnection            fetch XR connection details
composition_functions.go:312  AsState                    encode observed state into protobuf
composition_functions.go:323  desired starts as empty State
composition_functions.go:344  for each step in Revision.Spec.Pipeline
composition_functions.go:347    unmarshal fn.Input into structpb
composition_functions.go:356    inject Credentials from Secrets
composition_functions.go:378    pre-fetch bootstrap Requirements
composition_functions.go:405    rsp = c.pipeline.RunFunction(...)   gRPC call
composition_functions.go:418    carry desired into the next step
composition_functions.go:450    a FATAL result aborts with PipelineFatalError
composition_functions.go:484  for each desired resource, build composed resource
composition_functions.go:528    RenderComposedResourceMetadata      attach XR-derived metadata
```

The `FunctionRunner` interface is at `composition_functions.go:149`; its `RunFunction` method is what the gRPC client implements. Each function receives observed and desired state and returns a new desired state, which the next function sees.

## Things that surprised me

- **Functions return the complete desired state, not a diff.** The `desired` field comment in `proto/fn/v1/run_function.proto:135` states that leaving out fields returned as desired before will delete them from the objects in the cluster. A function that forgets to re-emit a field drops it, so each step must reproduce everything it wants to keep.
- **Pipeline TTL is the minimum non-zero value any function returns** (`composition_functions.go:413`). One short-lived function shortens the cache lifetime for the whole pipeline run.
- **Deletes skip the pipeline.** When an XR is being deleted, the reconciler removes the finalizer and returns early (`reconciler.go:618`), so functions never run on the delete path. Cleanup of composed resources relies on owner references and the garbage collector rather than function logic.
