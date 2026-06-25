# Internals

> Read from the source at commit `97cfc6f1`. Every claim here points at a file and line.

## Code map

The control plane lives under `chaoscenter/`. The GraphQL server is where most logic sits, under `chaoscenter/graphql/server/`.

| Path | Responsibility |
| --- | --- |
| `chaoscenter/graphql/server/graph/` | gqlgen resolvers (`*.resolvers.go`), generated code, and GraphQL models |
| `chaoscenter/graphql/server/pkg/chaos_experiment/` | experiment CRUD service and handler |
| `chaoscenter/graphql/server/pkg/chaos_experiment_run/` | run management; `handler/handler.go:670` is the run entry point |
| `chaoscenter/graphql/server/pkg/chaos_infrastructure/` | agent connection management and the push to subscribers |
| `chaoscenter/graphql/server/pkg/probe/` | resilience probes (http/cmd/k8s/prom) and probe injection into manifests |
| `chaoscenter/graphql/server/pkg/database/mongodb/` | per-collection operators and schemas |
| `chaoscenter/graphql/server/pkg/authorization/` | RBAC rules (`MutationRbacRules`) and JWT |
| `chaoscenter/graphql/server/pkg/data-store/` | in-process state (the map of subscription channels) |

The actual fault injection is not in this repository. In 3.x, `litmus` is mostly the control plane plus a meta repository. The fault code lives in `litmuschaos/litmus-go`, whose README describes itself as an extension to `litmuschaos/litmus`.

## Core data structures

`chaoscenter/graphql/server/pkg/data-store/store.go:10` defines `StateData`: a struct of channel maps (`ConnectedInfra map[string]chan *model.InfraActionResponse` plus the maps that back other subscriptions) guarded by a `*sync.Mutex`. This is the live connection state of the control plane, and it is the part held only in process memory.

`chaoscenter/graphql/server/pkg/database/mongodb/chaos_experiment/schema.go:31` defines `ChaosExperimentRequest`, the persisted experiment record. It holds `Revision []ExperimentRevision` for manifest version history, `RecentExperimentRunDetails` for the last 10 runs, and `ExperimentType`, whose constants (`experiment`, `cronexperiment`, `chaosengine`) are at `schema.go:10-16`. The `Probes` type at `schema.go:46` records which probe names were mapped to which fault name.

`chaoscenter/graphql/server/pkg/database/mongodb/chaos_experiment_run/schema.go:6` defines `ChaosExperimentRun`, one execution. It carries `Phase`, `ResiliencyScore *float64`, the `FaultsPassed`/`FaultsFailed`/`FaultsAwaited`/`FaultsStopped`/`FaultsNA` counters, `ExecutionData` (the run status as JSON), and `Probes`.

The action pushed to an agent is `model.InfraActionResponse` wrapping an `ActionPayload` with `K8sManifest`, `Namespace`, `RequestType`, `ExternalData`, and `Username`, assembled at `chaoscenter/graphql/server/pkg/chaos_infrastructure/infra_utils.go:207-216`.

## A path worth tracing

Re-running an experiment ends with the server pushing an action onto an open channel. The push itself is short:

```go
r.Mutex.Lock()
if observer, ok := r.ConnectedInfra[subscriberRequest.InfraID]; ok {
    observer <- newAction
}
r.Mutex.Unlock()
```

That block is `infra_utils.go:218-222`, and the send is `infra_utils.go:220`. The handler that gets there starts at `chaoscenter/graphql/server/pkg/chaos_experiment_run/handler/handler.go:670` `RunChaosWorkFlow`, which sorts revisions newest-first, unmarshals `Revision[0].ExperimentManifest` into an Argo `v1alpha1.Workflow`, injects `notify_id` and per-template labels, writes a Queued run record to MongoDB, expands probes at `handler.go:934`, and calls `SendExperimentToSubscriber` at `handler.go:944`. The call chain is:

```text
RunChaosExperiment (chaos_experiment_run.resolvers.go:24)
  -> RunChaosWorkFlow (handler.go:670)
    -> GenerateExperimentManifestWithProbes (handler.go:934)
    -> SendExperimentToSubscriber (infra_utils.go:226)
      -> SendRequestToSubscriber (infra_utils.go:206)
        -> observer <- newAction (infra_utils.go:220)
```

## Things that surprised me

The version compatibility check is deliberately disabled. At `chaoscenter/graphql/server/server.go:77-80` the code that would reject a control plane whose version does not match the DB version is commented out, with a note that it will be added back "once DB upgrader job becomes functional." Today a version mismatch is not rejected.

RBAC is enforced per GraphQL mutation through a map (`authorization.MutationRbacRules`), with `ValidateRole` called at the top of each resolver. The `RunChaosExperiment` resolver does this at `chaos_experiment_run.resolvers.go:31`, checking the `ReRunChaosExperiment` rule before any work.

Connection liveness is process-local. Because `ConnectedInfra` is an in-memory map (`store.go:10-18`), a restart of the GraphQL server drops every agent until each redials, and a duplicate connection for the same infra ID is force-closed in `chaos_infrastructure.resolvers.go:281-285`. The control plane is effectively a singleton.
