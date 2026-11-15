# Internals

> Read from the source at commit `68d542af`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `server/cmd/main.go` | Server entry point: database, registry, seeding, providers, HTTP listener |
| `server/router/server.go` | All HTTP routes and their middleware chains |
| `server/handlers/` | Request handlers; design deploy in `design_engine_handler.go`, relationship evaluation in `policy_relationship_handler.go` |
| `server/models/pattern/stages/` | The stage chain a design goes through on deploy (`Format`, `Filler`, `Validator`, `DryRun`, `Provision`) |
| `server/models/pattern/planner/` | Dependency graph and parallel executor for a design's components |
| `server/models/pattern/patterns/` | Fan-out to clusters and the Kubernetes apply (`k8s/k8s.go`) |
| `server/policies/` | Native Go relationship engine, also built to WebAssembly (`wasm/`) |
| `server/models/meshsync_events.go` | Consumes MeshSync events into the database |
| `server/models/providers.go` | The `Provider` interface |
| `server/meshes/meshops.proto` | gRPC contract for adapters |
| `models/` | 479 bundled model directories: 24,198 component files and 6,790 relationship files |
| `mesheryctl/` | The CLI |
| `ui/` | The Next.js UI |

The counts under `models/` come from `find` at the documented commit. The relationship policies written in Rego live in `models/meshery-core/0.7.2/v1.0.0/policies/` (`server/models/seed_models.go:21`).

## Core data structures

- **`stages.Data`** (`server/models/pattern/stages/chain.go:12-18`): what every deploy stage receives. It holds the design (`Pattern *PatternFile`), a map from each component declaration's ID to its full definition, and `Other`, a `map[string]interface{}` guarded by a mutex that stages use to pass results along. The provision result for a component is stored under the key `<id>.isProvisioned` (`server/models/pattern/stages/provision.go:24`, `:117-119`).
- **`Chain`** (`chain.go:30-70`): a list of stage functions where each stage receives a `next` function and decides whether to call it. Adding a stage rewires the previous stage's `next` to point at the new one (`chain.go:56-64`). A stage that hits an error can stop the chain by calling `Terminate` instead of `next`, as `Provision` does (`provision.go:34-37`).
- **`Plan`** and **`ParallelProcessGraphNode`** (`server/models/pattern/planner/planner.go:95-142`, `parallel_process.go:96-144`): the dependency graph of a design and the per-node state used to run it. Each node counts its dependencies and has two channels, one for success signals and one for failure signals. Both channels are buffered to the dependency count and each dependency sends exactly once, so sends never block (`parallel_process.go:153-160`).
- **`DeploymentMessagePerContext`** (`server/models/pattern/patterns/patterns.go:41-45`): the per-cluster deploy result, a list of per-component messages plus the cluster's server name and host.

## A path worth tracing

[Architecture](./architecture) traced a deploy. This page traces the step that shapes a design before it is deployed: **relationship evaluation**. When a design is evaluated, Meshery works out which relationships hold between its components and what that implies, for example that a Deployment with a `namespace` belongs inside the matching Namespace, or that a missing Namespace should be added.

The route is `POST /api/registry/relationships/evaluate`. `handleRegistry` registers each such path twice, under `/api/registry` and the deprecated `/api/meshmodels` (`server/router/server.go:70-73`, `:361`).

```text
policy_relationship_handler.go:788  Handler.EvaluateRelationshipPolicy (route handler)
  :854      h.EvaluateDesign(payload, MAX_RE_EVALUATION_DEPTH)
policy_relationship_handler.go:339  Handler.EvaluateDesign
  :344-361  hydrate the design from the registry
  :368      useGoEngine := viper.GetBool("USE_GO_POLICY_ENGINE")
  :371-382  Go engine: load all registered relationships once
  :384      loop up to MAX_RE_EVALUATION_DEPTH (= 5, :270)
  :390      Go engine:   h.GoEngine.EvaluateDesign(design, rels)
  :393      Rego engine: h.Rego.RegoPolicyHandler(design, ...)
  :424      stop early when nothing more needs evaluation
  :439      deduplicate actions by (op, id)
```

Evaluation repeats because each round can change the design (add a component, patch a field), which can make new relationships apply. It stops when a round needs no further evaluation, or after five rounds with a warning that the result is partial (`policy_relationship_handler.go:424-431`).

Which engine runs is a deployment setting. The docs list `USE_GO_POLICY_ENGINE` with a default of `false`, so a stock server uses the Rego engine, and the local `make server` target sets it to `true` (`docs/content/en/installation/advanced/environment-variables.md:68`, `install/Makefile.core.mk:78`). The Rego policies are loaded at startup in a seeding stage (`server/cmd/main.go:332-340`).

The Go engine (`server/policies/engine.go`) registers six policies: match labels, alias, non-binding edge, binding edge, hierarchical parent-child, and hierarchical wallet (`engine.go:23-34`). `evaluate` runs them in phases, applying each phase's actions to the design before the next phase reads it (`engine.go:89-136`):

1. **Validate.** Existing relationships whose components are gone are marked deleted.
2. **Identify.** Each policy proposes new relationships, deduplicated against those already present.
3. **Inventory additions.** Parents the design is missing, such as the Namespace for a namespaced resource, are added. The comment says this mirrors a Rego rule and that without it the two engines diverged (`engine.go:110-118`).
4. **Side effects.** Approved relationships apply their effects, for example patching the bound component's configuration (`server/policies/doc.go:26-34`).

The package documentation sets a determinism contract: two runs over the same design must give the same output, so map keys are sorted before iteration and relationship IDs are UUIDv5 hashes of a canonical JSON seed (`server/policies/doc.go:75-91`).

## Things that surprised me

- **Two policy engines, one switch.** The Go port landed in April 2026 ([commit `31b22b91`](https://github.com/meshery/meshery/commit/31b22b91c95a72df2fc456a8a45694ddcafc08d2)), yet the documented default is still Rego. Production and the local developer target can therefore run different engines. The repository keeps parity tests between them (`server/policies/wasm_diff_test.go`, and the comment at `server/policies/policy_inventory.go:23`).
- **The same Go engine runs in the browser.** `server/policies/wasm/main.go` builds the engine with `GOOS=js GOARCH=wasm` and exposes `initEngine` and `evaluateDesign` to JavaScript, caching the registry relationships so they cross the boundary once per session (`wasm/main.go:1-5`, `:21-44`).
- **SQLite as a cache.** The server's database is a local SQLite file (`server/models/sql-utils.go:101-105`). The upstream agent guide (`AGENTS.md`) describes the backend as using PostgreSQL, but the server opens its own database with `Engine: database.SQLITE`.
- **Embedded MeshSync by default.** `MeshsyncDeploymentModeDefault` is `embedded` (`server/models/connections/meshsync_deployment_mode.go:44`). Connecting a cluster no longer means installing an operator in it.
- **Seeding cannot take the server down.** Model and policy seeding run in a goroutine, each stage wrapped by `RunSeedStage` so a panic in one stage is recovered and the HTTP listener stays up (`server/cmd/main.go:318-341`).
- **Stages that are gone but still listed.** The deploy chain still carries commented-out `Import`, `ServiceIdentifierAndMutator` and `Persist` stages (`server/handlers/design_engine_handler.go:259`, `:261`, `:274-275`).
- **A sleep to work around adapters.** For each target host of a component, the server first sleeps 50 microseconds, with a comment calling it a hack until adapters fix concurrent client creation (`design_engine_handler.go:584-587`).
- **The CRD timing problem is acknowledged in code.** A comment notes that a 200 from the Kubernetes API does not mean a just-created CRD is ready, so a dependent custom resource can still fail (`server/models/pattern/planner/parallel_process.go:137-138`).
