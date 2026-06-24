# Internals

> Read from the source at commit `63eed4e`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/rook` | CLI entry; `main()` wires cobra commands (`cmd/rook/main.go:27`) |
| `cmd/rook/ceph` | The `ceph operator` subcommand and its `startOperator` runner (`cmd/rook/ceph/operator.go:54`) |
| `pkg/apis/ceph.rook.io/v1` | CRD Go types such as `CephCluster` (`pkg/apis/ceph.rook.io/v1/types.go:50`) |
| `pkg/operator/ceph` | Operator process and controller registration (`pkg/operator/ceph/operator.go`, `pkg/operator/ceph/cr_manager.go`) |
| `pkg/operator/ceph/cluster` | CephCluster controller and daemon orchestration (`pkg/operator/ceph/cluster/controller.go`, `pkg/operator/ceph/cluster/cluster.go`) |
| `pkg/daemon/ceph/client` | Runtime cluster identity and Ceph client helpers (`pkg/daemon/ceph/client/info.go`) |

## Core data structures

`CephCluster` is the top-level CRD (`pkg/apis/ceph.rook.io/v1/types.go:50`). It carries a `Spec ClusterSpec` and a `Status ClusterStatus`, and kubebuilder markers give it the short name `ceph` plus print columns for Health and FSID (`pkg/apis/ceph.rook.io/v1/types.go:49`). `ClusterSpec` is the declarative bundle: `CephVersion`, `Storage`, `Network`, `Placement`, `Resources`, and more (`pkg/apis/ceph.rook.io/v1/types.go:100`).

`ClusterInfo` is the runtime identity of a cluster (`pkg/daemon/ceph/client/info.go:38`). It holds the `FSID`, the monitor secret, the Ceph credential, the internal and external monitor maps, and the detected Ceph version. It also embeds a `Context context.Context` field (`pkg/daemon/ceph/client/info.go:62`).

`cluster` is the per-namespace orchestration state (`pkg/operator/ceph/cluster/cluster.go:64`): it bundles the `ClusterInfo`, the spec, the mon cluster, a `monitoringRoutines` map, and the observed generation. `ClusterController` sits above all of them and keeps a `clusterMap` keyed by namespace so it can hold several CephClusters at once (`pkg/operator/ceph/cluster/controller.go:86`).

## A path worth tracing

The end-to-end create path lives in `reconcileCephDaemons` (`pkg/operator/ceph/cluster/cluster.go:98`). It starts the monitors, checks that the cluster identity is established, then brings up the mgr and OSDs in order:

```go
clusterInfo, err := c.mons.Start(c.ClusterInfo, rookImage, cephVersion, *c.Spec)
// ...
// The cluster Identity must be established at this point
if err := c.ClusterInfo.IsInitialized(); err != nil {
    return errors.Wrap(err, "the cluster identity was not established")
}

if c.ClusterInfo.Context.Err() != nil {
    return c.ClusterInfo.Context.Err()
}
```

That is `pkg/operator/ceph/cluster/cluster.go:117` through `pkg/operator/ceph/cluster/cluster.go:130`. After the mons, `mgr.New(...).Start()` brings up the manager (`pkg/operator/ceph/cluster/cluster.go:145`) and `osd.New(...).Start()` brings up the OSDs (`pkg/operator/ceph/cluster/cluster.go:160`). Each stage calls `controller.UpdateCondition` to push the CR's `status.conditions` to `Progressing` with a human-readable message such as "Configuring Ceph Mons" (`pkg/operator/ceph/cluster/cluster.go:116`).

The call chain, top to bottom:

```text
ReconcileCephCluster.Reconcile   controller.go:311
  -> reconcile                   controller.go:320
    -> reconcileCephCluster      controller.go:456
      -> reconcileCephDaemons    cluster.go:98
        -> mons.Start            cluster.go:117
        -> mgr.New().Start       cluster.go:145
        -> osd.New().Start       cluster.go:160
```

## Things that surprised me

Two choices stand out, both about cancellation.

First, the operator reloads by demolition. On `SIGHUP` it does not patch live reconcilers; it tears down the whole controller-runtime manager and builds a new one, logging "cancelling all orchestrations!" as it goes (`pkg/operator/ceph/operator.go:110`). A settings change is therefore guaranteed to propagate, but any orchestration in flight is abandoned.

Second, `ClusterInfo` deliberately carries its own `context.Context` rather than using the shared clusterd context. The comment explains why: the context "cannot be in main clusterd context since this is a pointer passed through the entire life cycle of the operator. If the context is cancelled it will immediately be re-created, thus existing reconcile loops will not be cancelled." Putting the context on `ClusterInfo`, which is re-hydrated when a context is cancelled, lets a cancellation actually stop the reconcile loop it belongs to (`pkg/daemon/ceph/client/info.go:55`). That is why the mon-startup path checks `c.ClusterInfo.Context.Err()` directly (`pkg/operator/ceph/cluster/cluster.go:128`).
