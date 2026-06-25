# Internals

> Read from the source at commit `3b8885a`. Every claim here points at a file and line in [longhorn/longhorn-manager](https://github.com/longhorn/longhorn-manager).

## Code map

| Path | Responsibility |
| --- | --- |
| `main.go` | CLI entrypoint; bundles `daemon`, `csi`, `recurring-job`, upgrade, and uninstall subcommands (`main.go:63-74`). |
| `app/` | Subcommand bodies; `app/daemon.go` starts the resident manager and the controllers. |
| `k8s/pkg/apis/longhorn/v1beta2/` | All CRD type definitions (Volume, Engine, Replica, Node, InstanceManager, and more). |
| `controller/` | One controller per CRD; the reconcile logic that drives the data plane. |
| `datastore/` | Informer caches and typed clients behind a single `DataStore` facade. |
| `scheduler/` | `replica_scheduler.go`, pure placement logic for replicas. |
| `engineapi/` | gRPC clients to `longhorn-instance-manager` and the engine. |
| `csi/`, `webhook/`, `upgrade/` | CSI driver, admission/conversion webhooks, version migration. |

## Core data structures

All core types live under `k8s/pkg/apis/longhorn/v1beta2/`.

- **`Volume`** (`volume.go:454`) is the top-level CRD users touch. `VolumeSpec` (`volume.go:251`) carries `Size`, `NumberOfReplicas` (`volume.go:320`), `Frontend` (`volume.go:256`, one of `blockdev`/`iscsi`/`ublk`), `DataEngine` (`volume.go:336`, v1 or v2), plus data locality, access mode (RWO/RWX), migratable, encryption, and anti-affinity fields. `VolumeStatus` (`volume.go:378`) holds `OwnerID`, `State`, `Robustness`, and `Conditions`.
- **`Engine`** (`engine.go:241`) is the single front-end controller for one volume. It embeds `InstanceSpec`/`InstanceStatus` and exposes `Status.ReplicaModeMap`, the per-replica RW/ERR state the volume controller reads to judge replica health (`controller/volume_controller.go:744`).
- **`Replica`** (`replica.go:108`, spec at `replica.go:23`) is one replica equals one process. `Spec.NodeID`, `DiskID`, and `DataPath` pin its placement. It shares the same `InstanceSpec`.
- **`InstanceManager`** with `InstanceSpec` (`instancemanager.go:87`) and `InstanceStatus` (`instancemanager.go:108`) represents the per-node instance-manager pod. Both engine and replica embed the shared `InstanceSpec`, so one launch spec describes either kind of process.
- **`Node`** (`node.go`) is Longhorn's view of a node and its disks; the scheduler reads `Node.Spec.Disks` for capacity, reservation, and tags.

## A path worth tracing

The replica top-up in `replenishReplicas` (`controller/volume_controller.go:3066`) is the most instructive read, because it shows how Longhorn avoids re-copying entire volumes after a transient node failure.

It runs a sequence of guards before it ever creates a replica:

```text
replenishReplicas (volume_controller.go:3066)
  guard: hasEngineStatusSynced(e, rs)          -> :3096  (return if engine status not synced)
  guard: getRebuildingReplicaCount(e) != 0     -> :3100  (return if a rebuild is in flight)
  reuse: CheckAndReuseFailedReplica(...)        -> :3118
    backoff: IsInBackOffSinceUpdate(...)        -> :3124
    bump:    RebuildRetryCount++                -> :3130
  new:   RequireNewReplica(...) == 0            -> :3142
         newReplicaCR(v, e, hardNodeAffinity)   -> :3143
```

The reuse-before-create order is the point. When a node blips and a replica is dropped, the scheduler tries to bring that same replica back and resync it instead of allocating a fresh full copy. `RebuildRetryCount` (`controller/volume_controller.go:3130`) caps how many times a single replica can be reused so a permanently broken disk does not loop forever. The backoff check (`controller/volume_controller.go:3124`) spaces out retries.

## Things that surprised me

- **Top-up is one replica at a time.** If `getRebuildingReplicaCount(e)` is non-zero, `replenishReplicas` returns immediately (`controller/volume_controller.go:3100`), so rebuilds are serialized. The intent is to keep multiple simultaneous rebuilds from saturating I/O; recovery leans on sequential rebuild from a healthy replica.
- **There is an explicit guard against a known replica-IP-duplication bug.** Top-up is held until engine status has synced via `hasEngineStatusSynced` (`controller/volume_controller.go:3096`). The code references the upstream issue (longhorn/longhorn#687) as the reason.
- **The v2 (SPDK) data engine tears down in a strict order.** Deletion walks engine frontend, then engine (the raid bdev), then replica (the replica bdev), and will not advance a layer until the previous one is fully gone (`controller/volume_controller.go:400-473`, gated by `types.IsDataEngineV2` at `controller/volume_controller.go:365`). This avoids `spdk_tgt` "no such device" errors and is far stricter than the v1 path's simpler deletion.
