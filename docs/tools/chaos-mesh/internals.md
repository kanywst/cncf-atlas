# Internals

> Read from the source at commit `8c13a9f`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/` | Seven binaries; the core three are `chaos-controller-manager`, `chaos-daemon`, `chaos-dashboard`. |
| `api/v1alpha1/` | CRD Go types and the shared interfaces every chaos object satisfies. |
| `controllers/common/` | The shared reconcile pipeline: steps, records, conditions, finalizers. |
| `controllers/chaosimpl/` | Per-fault-type `Apply` / `Recover` implementations behind the `ChaosImpl` interface. |
| `pkg/chaosdaemon/` | The node-side gRPC server that performs injection inside container namespaces. |
| `config/crd/bases/` | 23 generated CRD YAML definitions. |

## Core data structures

- `ChaosImpl` interface: the two methods every fault type implements, `Apply` and `Recover(ctx, index, records, obj) (Phase, error)` (`controllers/chaosimpl/types/types.go:25-29`). This is the seam that absorbs the difference between fault types.
- `Record`: the injection state of a single target, with `Id`, `SelectorKey`, `Phase`, `InjectedCount`, `RecoveredCount`, and `Events` (`api/v1alpha1/common_types.go:78-88`).
- `Phase` and `DesiredPhase`: `Phase` is `Not Injected` or `Injected` (`api/v1alpha1/common_types.go:89-97`); `DesiredPhase` is `Run` or `Stop` (`api/v1alpha1/common_types.go:61-67`). These two axes drive the reconciler's state machine.
- `InnerObject` and its variants: the common interface every chaos CRD satisfies, covering duration, paused, oneshot, and webhook validation (`api/v1alpha1/common_types.go:146-182`).
- `ExecStressRequest` (proto): the daemon request for stress injection, carrying `Scope`, `Target` (container id), `CpuStressors`, `MemoryStressors`, `EnterNS`, and `OomScoreAdj` (`pkg/chaosdaemon/pb/chaosdaemon.proto`).

## A path worth tracing

Follow a StressChaos from reconcile to a running `stress-ng`.

The `records` step decides what to do per target. When `desiredPhase` is `Run` and the current phase is not yet `Injected`, the operation is `Apply` unless the phase already starts with `Not Injected` (`controllers/common/records/controller.go:128-149`). On `Apply` it calls the impl and, if the phase changed, marks the status dirty; failures set a retry flag and append a failure event (`controllers/common/records/controller.go:151` onward).

The StressChaos impl resolves the container and calls the daemon.

```go
req := pb.ExecStressRequest{
    Scope:           pb.ExecStressRequest_CONTAINER,
    Target:          containerId,
    CpuStressors:    cpuStressors,
    MemoryStressors: memoryStressors,
    EnterNS:         true,
}
res, err := pbClient.ExecStressors(ctx, &req)
```

That is `controllers/chaosimpl/stresschaos/impl.go:77-87`; the stress argument strings come from `Stressors.Normalize()` at `impl.go:67-75`, and the returned PID and start time are written into `Status.Instances` at `impl.go:93-102`.

On the node, `ExecStressors` (`pkg/chaosdaemon/stress_server_linux.go:33`) dispatches to `ExecCPUStressors` (`:112`), which looks up the container PID with `crClient.GetPidFromContainerID` (`:118`), gets the cgroup attacher with `cgroups.GetAttacherForPID` (`:123`), builds the process with `bpm.DefaultProcessBuilder("stress-ng", ...).EnablePause()` and, when `EnterNS` is set, `SetNS(pid, bpm.PidNS)` (`:128-132`).

## Things that surprised me

The daemon does not start `stress-ng` running. It launches it paused via `EnablePause()`, attaches the paused process to the target container's cgroup, and only then sends `SIGCONT` to resume it (`pkg/chaosdaemon/stress_server_linux.go:128-167`). The order matters: attaching to the cgroup before resuming guarantees the load runs inside the target container's resource limits. Reversing it would let the load process briefly burn host resources with no limit. The resume itself is a blunt loop that re-sends `SIGCONT` and re-reads `comm` until the process name is no longer `pause`, with a TODO admitting it wants a better mechanism (`:148-167`).

The other non-obvious piece is how the parent reconcile is triggered. A predicate, `PickChildCRDPredicate`, fires the parent's reconcile only when one of `PodHttpChaos`, `PodIOChaos`, or `PodNetworkChaos` changes (`controllers/common/fx.go:154-169`), which is how node-side state flows back up to the user-facing chaos object.

## Sources

1. chaos-mesh/chaos-mesh source at commit `8c13a9f`: <https://github.com/chaos-mesh/chaos-mesh>
