# Internals

> Read from the source at commit `719385f` (2026-11-13). Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/manager` | Single binary entrypoint; cobra root that registers the `controller`, `instance`, `backup`, `bootstrap`, and other subcommands (`cmd/manager/main.go:66`-`75`). |
| `internal/controller` | Operator-side reconcilers, one per resource kind. `cluster_controller.go` is the main loop. |
| `internal/cmd/manager/instance` | Instance manager subcommands run inside each Pod (`run`, `initdb`, `join`, `pgbasebackup`, `restore`). |
| `internal/management/controller` | In-Pod reconcilers that converge objects inside PostgreSQL via SQL (`database_controller.go` and others). |
| `pkg/management/postgres` | PostgreSQL process management, web servers, status extraction. |
| `pkg/management/url` | HTTP endpoint paths and ports for the instance manager. |
| `api/v1` | CRD Go types for the `postgresql.cnpg.io/v1` API group. |
| `internal/cnpi` | Client side of CNPG-i (the CloudNativePG Plugin Interface), the gRPC plugin mechanism. |

## Core data structures

The whole system turns on the `Cluster` CRD and a small set of related types in `api/v1/cluster_types.go`.

- `Cluster` (`api/v1/cluster_types.go:2891`) is the top-level resource, the standard Kubernetes shape with `Spec` and `Status`.
- `ClusterSpec` (`api/v1/cluster_types.go:217`) is the desired state. It holds `Instances` (`:264`), the `MinSyncReplicas` and `MaxSyncReplicas` bounds that govern synchronous replication quorum (`:272`, `:280`), `PostgresConfiguration` (`:284`), `ReplicationSlots` (`:298`), `Bootstrap` (`:302`), and `ReplicaCluster` (`:306`).
- `ClusterStatus` (`api/v1/cluster_types.go:913`) is the observed state. The pair `CurrentPrimary` and `TargetPrimary` (`:968`, `:973`) encodes failover and switchover progress: when they differ, an operation is in flight, and the reconciler reads exactly that condition at `internal/controller/cluster_controller.go:408`-`409`.
- `PostgresConfiguration` (`api/v1/cluster_types.go:1666`) is the declarative form of `postgresql.conf`.
- `BootstrapConfiguration` (`api/v1/cluster_types.go:1792`) selects how a new cluster is initialized (initdb, pg_basebackup, or recovery).
- `SecretsResourceVersion` (`api/v1/cluster_types.go:2920`) stores the `resourceVersion` of each managed Secret in status so the operator can detect rotation.

The runtime counterpart is `ClusterReconciler` (`internal/controller/cluster_controller.go:95`). It embeds the controller-runtime `client.Client` and carries the `InstanceClient` used to query Pods, the plugin repository, and the operator's TLS client certificate.

## A path worth tracing

Split-brain detection is a good loop to follow because it shows how the operator turns per-Pod HTTP responses into a safety decision.

The operator gathers status from every instance over mTLS (mutual Transport Layer Security):

```go
    instancesStatus := r.InstanceClient.GetStatusFromInstances(ctx, resources.instances)
```

That call is `internal/controller/cluster_controller.go:457`. The client implementation filters to active Pods and queries each one:

```go
    statusURL := url.Build("https", pod.Status.PodIP, url.PathPgStatus, url.StatusPort)
```

This is `pkg/management/postgres/webserver/client/remote/instance.go:318`. The scheme is hard-coded to `https` since [#11370](https://github.com/cloudnative-pg/cloudnative-pg/pull/11370) removed the per-Pod HTTP fallback. Here `url.PathPgStatus` is `/pg/status` (`pkg/management/url/url.go:55`) and `url.StatusPort` is `8000` (`pkg/management/url/url.go:79`). The responses become a `PostgresqlStatusList`.

Back in the reconcile loop, the operator counts how many Pods claim to be primary:

```go
    if primaryNames := instancesStatus.PrimaryNames(); len(primaryNames) > 1 {
```

This guard is `internal/controller/cluster_controller.go:478`. When more than one primary is seen, the operator does not force a resolution. It logs the old-primary detection, dumps status, and requeues after 5 seconds (`:484`-`487`) to let the demoted primary recognize its new role. The call chain end to end:

```text
Reconcile (cluster_controller.go:169)
  -> reconcile (cluster_controller.go:309)
    -> GetStatusFromInstances (cluster_controller.go:457)
      -> remote client GET https://<podIP>:8000/pg/status (remote/instance.go:318)
    -> instancesStatus.PrimaryNames() > 1 ? requeue 5s (cluster_controller.go:478)
    -> handleSwitchover (cluster_controller.go:590)
    -> finalizeReconciliation -> PhaseHealthy (cluster_controller.go:606)
```

## Things that surprised me

The instance manager is itself a full Kubernetes controller, not a passive agent. Inside each Pod it builds a controller-runtime manager and registers a reconciler for the same `Cluster` resource the operator watches:

```go
    err = ctrl.NewControllerManagedBy(mgr).
        For(&apiv1.Cluster{}).
        Named("instance-cluster").
        Complete(reconciler)
```

That is `internal/cmd/manager/instance/run/cmd.go:287`-`290`. So a single `Cluster` object is reconciled from two sides at once: centrally by the operator and locally by every Pod. The Kubernetes API server is doing the job that etcd plus Patroni would do in other stacks.

A second non-obvious point is how a failover is staged. When the primary fails, the operator first sets `TargetPrimary` to the marker `pending` (`api/v1/cluster_types.go:108`) instead of naming a replica (`internal/controller/replicas.go:148`). It then waits until every WAL receiver (the replica-side process that streams WAL from the primary) is down (`:172`), rechecks the synchronous-replication quorum when a `FailoverQuorum` is active (`:179`-`185`), and only then promotes the most advanced replica (`:191`). While `CurrentPrimary` and `TargetPrimary` disagree, the main loop marks the old primary unhealthy on every pass (`internal/controller/cluster_controller.go:408`-`430`). Until September 2026 that block also requeued after 1 second in every case, so the reconciler never reached the code that checks whether a `pending` failover can complete, and the failover could stall. [#11336](https://github.com/cloudnative-pg/cloudnative-pg/pull/11336) (backported to v1.30.1 and v1.29.3) limited the early requeue to targets that name a Pod (`:427`-`428`), so a pending failover now runs through to `handleSwitchover`. The multi-primary case still waits 5 seconds, trading speed for a chance to let the cluster self-heal before acting.
