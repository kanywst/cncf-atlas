# Internals

> Read from the source at commit `19f82f4f`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `pkg/apis/agones/v1` | CRD types: `GameServer`, `Fleet`, `GameServerSet`. |
| `pkg/apis/allocation/v1` | `GameServerAllocation` type and validation. |
| `pkg/gameservers` | Single-`GameServer` lifecycle controller. |
| `pkg/gameserversets` | `GameServerSet` controller (maintains replica count). |
| `pkg/fleets` | `Fleet` controller (rolling updates of sets). |
| `pkg/fleetautoscalers` | `FleetAutoscaler` controller. |
| `pkg/gameserverallocations` | Allocation request handling. |
| `pkg/portallocator` | Dynamic HostPort allocation per Node. |
| `pkg/sdkserver` | gRPC SDK sidecar that patches the `GameServer`. |
| `cmd/` | Binaries: `controller`, `allocator`, `extensions`, `ping`, `processor`, `sdk-server`. |

## Core data structures

`GameServer` (`pkg/apis/agones/v1/gameserver.go:197`) is the resource the whole system turns on. Its `Spec` (a `GameServerSpec`, `pkg/apis/agones/v1/gameserver.go:222`) carries `Ports []GameServerPort` (`:227`), `Health Health` (`:229`), `SdkServer SdkServer` (`:233`), and the full `Template corev1.PodTemplateSpec` (`:235`). Embedding the entire Pod template means a game server is described as a Pod plus Agones metadata. The `Status` (a `GameServerStatus`, `pkg/apis/agones/v1/gameserver.go:318`) holds `State GameServerState` (`:320`), `Ports` (`:321`), and `Address` (`:322`).

`GameServerState` (`pkg/apis/agones/v1/gameserver.go:39`) is a string enum that drives reconciliation. The lifecycle constants are declared in order: `PortAllocation` (`:49`), `Creating` (`:51`), `Scheduled` (`:57`), `RequestReady` (`:59`), `Ready` (`:62`), and `Allocated` (`:74`).

`Fleet` (`pkg/apis/agones/v1/fleet.go:41`) is the Deployment analogue. Its `FleetSpec` (`pkg/apis/agones/v1/fleet.go:60`) holds `Replicas int32` (`:62`), `Strategy appsv1.DeploymentStrategy` (`:68`), `Scheduling apis.SchedulingStrategy` (`:70`), and `Template GameServerTemplateSpec` (`:85`). `GameServerSet` (`pkg/apis/agones/v1/gameserverset.go:40`) and its `GameServerSetSpec` (`pkg/apis/agones/v1/gameserverset.go:59`) are the ReplicaSet analogue.

`GameServerAllocation` (`pkg/apis/allocation/v1/gameserverallocation.go:52`) is the one-shot claim resource. Its `GameServerAllocationSpec` (`pkg/apis/allocation/v1/gameserverallocation.go:70`) carries `MultiClusterSetting` (`:73`), `Priorities` (`:100`), and `Selectors []GameServerSelector` (`:106`) to narrow which `Ready` servers can be claimed.

The port allocator's state is a `portRangeAllocator` (`pkg/portallocator/portallocator.go:115`). Its `portAllocations []portAllocation` field (`pkg/portallocator/portallocator.go:119`) is a slice of per-Node usage maps, where `portAllocation` is a `map[int32]bool` (`pkg/portallocator/portallocator.go:112`):

```go
type portRangeAllocator struct {
    logger             *logrus.Entry
    name               string
    mutex              sync.RWMutex
    portAllocations    []portAllocation
```

## A path worth tracing

The first reconcile step for a new `GameServer` is port allocation. `syncGameServerPortAllocationState` (`pkg/gameservers/controller.go:565`) guards on the `PortAllocation` state, allocates a port into a copy, and advances the state to `Creating`:

```go
func (c *Controller) syncGameServerPortAllocationState(ctx context.Context, gs *agonesv1.GameServer) (*agonesv1.GameServer, error) {
    if !(gs.Status.State == agonesv1.GameServerStatePortAllocation && gs.ObjectMeta.DeletionTimestamp.IsZero()) {
        return gs, nil
    }

    gsCopy := c.portAllocator.Allocate(gs.DeepCopy())

    gsCopy.Status.State = agonesv1.GameServerStateCreating
```

If the subsequent Update fails, the port is handed straight back to the pool with `c.portAllocator.DeAllocate(gsCopy)` (`pkg/gameservers/controller.go:580`), so a failed write does not leak ports.

The matching write on the SDK side is in `updateState` (`pkg/sdkserver/sdkserver.go:360`). It takes the read lock, copies the resource, stamps the persisted state, and later calls `patchGameServer` (`pkg/sdkserver/sdkserver.go:419`):

```go
    s.gsUpdateMutex.RLock()
    gsCopy := gs.DeepCopy()
    gsCopy.Status.State = s.gsState
```

The full call chain from a game binary's `Ready()` to the controller marking the resource `Ready`:

```text
SDKServer.Ready                         pkg/sdkserver/sdkserver.go:540
  enqueueState(RequestReady)            pkg/sdkserver/sdkserver.go:543
SDKServer.updateState                   pkg/sdkserver/sdkserver.go:360
  gsCopy.Status.State = s.gsState       pkg/sdkserver/sdkserver.go:396
  patchGameServer                       pkg/sdkserver/sdkserver.go:419
Controller.syncGameServerRequestReadyState  pkg/gameservers/controller.go:967
  gsCopy.Status.State = ...Ready        pkg/gameservers/controller.go:1014
  recorder.Event "SDK.Ready() complete" pkg/gameservers/controller.go:1023
```

## Things that surprised me

The port allocator does not trust incremental events to stay consistent. On startup `Run` (`pkg/portallocator/portallocator.go:163`) waits for caches to sync, then calls `syncAll` (`pkg/portallocator/portallocator.go:324`) to rebuild the entire per-Node port map from scratch ("start with a perfect slate straight away"). Steady-state reclamation is event-driven: the informer registers `DeleteFunc: pa.syncDeleteGameServer` (`pkg/portallocator/portallocator.go:154`), whose handler is `syncDeleteGameServer` (`pkg/portallocator/portallocator.go:311`).

There are two `Allocate` methods with the same name at different layers. The coordinator `portAllocator.Allocate` (`pkg/portallocator/portallocator.go:97`) fans out across range allocators, and each `portRangeAllocator.Allocate` (`pkg/portallocator/portallocator.go:179`) does the actual per-range assignment. The controller calls the coordinator, which delegates down.

The address can be written from two places. The normal path is `syncGameServerStartingState` (`pkg/gameservers/controller.go:916`), but if a fast game binary calls `Ready()` before the controller has populated the address, `syncGameServerRequestReadyState` fills it in itself before setting `Ready`, looking up the Node at `pkg/gameservers/controller.go:996` and applying address and port at `pkg/gameservers/controller.go:1000`.
