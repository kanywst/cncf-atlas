# Internals

> Read from the source at commit `b4e4b23` (`b4e4b232350d6967008372423e5aa7a967d80a9f`, 2026-11-13). Every claim here points at a file and line. Paths under `vendor/open-cluster-management.io/` are the API types and the add-on framework, which live in separate repositories and are vendored into `ocm`.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/` | Six binaries: `registration`, `work`, `placement`, `addon`, `registration-operator`, `server`. Each wires cobra subcommands from `pkg/cmd/`. |
| `pkg/cmd/hub`, `pkg/cmd/spoke` | The hub and managed cluster subcommands for each component. |
| `pkg/registration/hub` | Cluster acceptance, per-cluster namespace and RBAC, lease monitoring, cluster sets, ClusterProfile sync. |
| `pkg/registration/spoke` | The registration agent: bootstrap, ManagedCluster creation, status, claims, lease, add-on credentials. |
| `pkg/registration/register` | Credential drivers (`csr`, `token`, `aws_irsa`, `grpc`) behind one interface. |
| `pkg/work/spoke` | The work agent: apply, status feedback, AppliedManifestWork bookkeeping, executor authorization. |
| `pkg/work/hub` | ManifestWorkReplicaSet and ManifestWork garbage collection. |
| `pkg/placement` | The scheduling controller and its filter and prioritizer plugins. |
| `pkg/addon` | The hub add-on manager and the template-based add-on agent. |
| `pkg/operator` | The cluster-manager and klusterlet operators. |
| `pkg/server` | The gRPC transport server and its per-resource services. |

Non-test Go under `pkg/` is about 44,000 lines. Registration is the largest part at about 13,400, then work at 9,000 and the operators at 8,000.

## Core data structures

- **`ManagedCluster`** (`vendor/open-cluster-management.io/api/cluster/v1/types.go:48-76`). Cluster scoped, one per managed cluster. The spec carries `HubAcceptsClient` (`:64`), the hub admin's half of the handshake, `LeaseDurationSeconds` (`:70`), and `Taints` (`:76`). The status holds conditions, capacity, version, and claims, written by the agent.
- **`ManifestWork`** (`vendor/open-cluster-management.io/api/work/v1/types.go:37-56`). Namespaced in the target cluster's namespace. `Workload` holds raw manifests, `DeleteOption` sets what happens to applied resources on delete (Foreground, Orphan, or SelectivelyOrphan, `types.go:401-407`), `ManifestConfigs` sets per-resource update strategy and feedback rules, and `Executor` names the identity whose permissions the agent checks before applying. Without an executor, the agent applies with its own service account and skips the check (`pkg/work/spoke/auth/basic/auth.go:65-67`).
- **`AppliedManifestWork`**. Cluster scoped on the managed cluster, named `<hubHash>-<workName>` (`pkg/work/spoke/controllers/manifestcontroller/manifestwork_controller.go:215`). It records which resources the work applied, so the agent can delete the ones that drop out of the spec.
- **`Placement`** (`vendor/open-cluster-management.io/api/cluster/v1beta1/types_placement.go:58-102`). Namespaced. `ClusterSets`, `NumberOfClusters`, `Predicates` (label, claim, and CEL selectors at `:213-221`), `PrioritizerPolicy`, `SpreadPolicy` (`:93`), `Tolerations`, and `DecisionStrategy` for splitting the result into groups.
- **`ManagedClusterSet` and `ManagedClusterSetBinding`**. A set groups clusters (`vendor/open-cluster-management.io/api/cluster/v1beta2/types_managedclusterset.go:33-76`). A binding makes a set visible in one namespace (`ManagedClusterSetBinding`, listed per namespace at `pkg/placement/controllers/scheduling/scheduling_controller.go:227`). A Placement can only select from sets bound to its own namespace (`types_placement.go:18-26`).

## A path worth tracing

Follow one ManifestWork through the work agent, from `ManifestWorkController.sync` (`pkg/work/spoke/controllers/manifestcontroller/manifestwork_controller.go:132`).

The controller reads the work from a lister scoped to the cluster's hub namespace. It returns early if the work is being deleted, if the work finalizer is missing, or if the work already has a `Complete` condition (`manifestwork_controller.go:153-166`). The finalizer check matters: the agent does not touch resources for a work it could not later clean up.

Next it creates or patches the AppliedManifestWork (`manifestwork_controller.go:169`, body at `:213-240`). The name includes the hub hash, a SHA-256 of the hub API server URL (`pkg/work/helper/helpers.go:360-364`), so the same managed cluster can register with more than one hub without collisions.

Then it runs two reconcilers in order (`manifestwork_controller.go:98-110`, loop at `:178`). The first, `manifestworkReconciler.reconcile` (`manifestwork_reconciler.go:112`), does the apply. `parseAndSortManifests` (`:257`) decodes each manifest and stable-sorts it by a fixed rank table:

```go
var resourceApplyOrder = map[string]int{
    // Rank 0: cluster-scoped, no deps
    "PriorityClass":            0,
    "Namespace":                0,
    "CustomResourceDefinition": 0,
```

That table starts at `manifestwork_reconciler.go:56`. Namespaces and CRDs are rank 0, RBAC 1, service accounts and policies 2, config and storage 3, Services 4, workloads 5, and webhooks and APIServices 6. Kinds not in the table get 1000 and keep their spec order (`:279-287`). For each manifest, `applyOneManifest` (`:321`) skips ones already marked Complete, checks the `Executor`'s permissions with a SubjectAccessReview (`:351-358`; validator at `pkg/work/spoke/auth/basic/auth.go:62`), picks the applier for the update strategy, and applies (`:363-375`). The four appliers are `CreateOnly`, `ServerSideApply`, `Update`, and `ReadOnly` (`pkg/work/spoke/apply/apply.go:31-37`). `Update` is the default (`manifestwork_reconciler.go:368`). The whole loop runs inside `retry.RetryOnConflict` (`:150`).

The second reconciler, `appliedManifestWorkReconciler.reconcile`, compares the resources applied last time with the ones applied now and deletes the difference (`appliedmanifestwork_reconciler.go:90-99`). This is how removing a manifest from a ManifestWork removes it from the cluster.

Finally the controller patches status on both objects and requeues the work after a jittered 4 minutes (`manifestwork_controller.go:40,175-208`). Live status takes another route: `AvailableStatusController` polls applied resources about every 10 seconds by default, with up to 90% jitter (`pkg/work/spoke/options.go:38`, `pkg/work/spoke/controllers/statuscontroller/availablestatus_controller.go:103`) and evaluates feedback rules. Deployments, Jobs, Pods, and DaemonSets get built-in rules (`pkg/work/spoke/statusfeedback/rules/rule.go:76-79`).

## Things that surprised me

**Permission failures are not errors.** If the executor lacks permission for a resource, the agent records the failure in that manifest's condition, clears the error, and requeues after the shortest retry time any check asked for (`manifestwork_reconciler.go:180-189`). The work keeps reconciling at a shorter interval while the denial stands, and it does not land in the controller's error backoff. Server-side apply conflicts are also left out of the error list, since retrying cannot resolve them (`:191-195`).

**The CSR check is strict about names.** `validateCSR` requires exactly one organization `system:open-cluster-management:<cluster>` besides an optional shared group, then splits the common name on `:` and requires exactly two parts, cluster and agent, with the cluster part equal to the CSR's cluster label (`pkg/registration/register/csr/approve_reconciler.go:133-201`). Combined with the renewal rule that the requester must be the user named in the common name (`approve_reconciler.go:69-72`), an agent holding one cluster's certificate cannot renew into another cluster's name. A CSR for a new cluster name still needs a hub admin, or the alpha auto-approval gate.

**Certificate rotation is jittered.** The agent requests a new certificate when the remaining lifetime drops below a threshold picked at random between 20% and 25% (`pkg/registration/register/csr/csr.go:509-520`). Clusters that joined at the same moment spread their renewals out.

**Placement decisions are paged.** A single PlacementDecision holds at most 100 cluster names. A larger result is split across several PlacementDecision objects (`pkg/placement/controllers/scheduling/scheduling_controller.go:49,466-474`). Consumers must read every PlacementDecision carrying the placement's label (`cluster.open-cluster-management.io/placement`, `vendor/open-cluster-management.io/api/cluster/v1beta1/types_placementdecision.go:32`), since one object may hold only part of the result.

**Default scheduling is two prioritizers.** With no prioritizer policy, only Balance and Steady are on, each with weight 1, and every other prioritizer has weight 0 (`pkg/placement/controllers/scheduling/schedule.go:148-160`). Balance gives the highest score to clusters that appear in the fewest decisions of other placements (`pkg/placement/plugins/balance/balance.go:18-22,52-68`). Steady gives the highest score to clusters this placement already selected, so decisions do not churn (`pkg/placement/plugins/steady/steady.go:20-24`). Final scores are the weighted sum, and ties break by cluster name (`schedule.go:277-292`), so the same inputs always give the same decision.
