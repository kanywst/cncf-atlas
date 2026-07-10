# Internals

> Read from the source at commit `2487a24`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/scheduler/` | HTTP server that registers the extender, webhook, and metrics routes (`main.go:143-147`) |
| `cmd/device-plugin/nvidia/` | NVIDIA device-plugin entrypoint |
| `cmd/vGPUmonitor/` | Per-pod GPU usage monitor |
| `pkg/scheduler/` | Filter, Bind, Score, and the mutating webhook logic |
| `pkg/device/` | Vendor-neutral types plus one implementation per vendor (`nvidia`, `ascend`, `cambricon`, `hygon`, `metax`, `mthreads`, `iluvatar`, and others) |
| `pkg/device-plugin/nvidiadevice/nvinternal/` | Device-plugin implementation: `plugin/`, `rm/`, `cdi/`, `mig/`, `imex/` |
| `libvgpu` (submodule) | HAMi-core, the C/CUDA in-container isolation library, from a separate repository |

## Core data structures

The `Devices` interface (`pkg/device/devices.go:36`) is the contract every vendor implements. It gathers the operations the scheduler and webhook call without knowing the vendor: `MutateAdmission`, `Fit`, `PatchAnnotations`, `ScoreNode`, `GetNodeDevices`, `GenerateResourceRequests`, and the node-lock methods. Adding a new accelerator is implementing this interface and nothing else in the scheduler changes.

`DeviceUsage` (`pkg/device/devices.go:80`) is the scheduler's view of one physical GPU right now. It holds the time-slicing count and used count, total and used memory, total and used cores, NUMA node, type, health, and MIG usage. Every `Fit` decision is a comparison over the fields of this struct.

`ContainerDeviceRequest` (`pkg/device/devices.go:143`) is one container's ask: number of devices, memory in MB, a memory percentage, and a core percentage. A `MemPercentagereq` of 101 is the sentinel meaning "no percentage given," which `Fit` uses to fall back to the absolute memory value. The allocation result is carried as annotations between webhook, scheduler, and device plugin, encoded with split symbols so one string can describe several devices across several containers.

## A path worth tracing

The GPU-selection loop in `Fit` is the core of placement. `NvidiaGPUDevices.Fit` (`pkg/device/nvidia/device.go:749`) walks the node's devices and returns the first arrangement that satisfies the request, tallying why the rest failed.

```text
Fit(devices, request, pod, nodeInfo, allocated)   pkg/device/nvidia/device.go:749
  for i := len(devices)-1; i >= 0; i--            walk devices from the end
    dev := devices[i]
    if !dev.Health            -> reason[CardNotHealth]++
    checkType mismatch        -> reason[...]++
    NUMA / UUID constraints
    Count <= Used             -> no time-slice slot left
    Coresreq > 100 correction
    memory: Memreq, else Totalmem * MemPercentagereq / 100
    quota / free memory / free cores checks
    exclusive vs shared (cores == 100 conflict)
  return selected devices or the reason tally
```

Two details are worth calling out. The loop runs from the end of the slice (`for i := len(devices) - 1; i >= 0; i--`), so combined with the spread or binpack sort of the device list it fills from the tail first. And memory is computed as the absolute `Memreq` when given, otherwise derived from the percentage as `Totalmem * MemPercentagereq / 100`, which is why the 101 sentinel matters: it is how the code distinguishes "0 percent requested" from "no percentage requested at all."

The result of `Fit` flows up through `Scheduler.Filter` (`pkg/scheduler/scheduler.go:741`), which sorts nodes by score and writes the chosen devices into pod annotations. `Scheduler.Bind` (`pkg/scheduler/scheduler.go:670`) then marks the allocation `allocating` and calls the Kubernetes bind API. On the node, `Allocate` (`pkg/device-plugin/nvidiadevice/nvinternal/plugin/server.go:593`) reads those annotations back and turns them into environment variables and mounts.

## Things that surprised me

Runtime enforcement is not in Go at all. The device plugin's `Allocate` only injects `CUDA_DEVICE_MEMORY_LIMIT_<i>` and `CUDA_DEVICE_SM_LIMIT` and mounts `libvgpu.so` (`server.go:661-711`). The actual memory ceiling and compute throttle are enforced by the preloaded C library inside the container. The whole "virtual GPU" is a set of environment variables plus an `LD_PRELOAD` hijack, with no kernel or driver changes.

Isolation can be turned off by an environment variable. If a container carries `CUDA_DISABLE_CONTROL`, the plugin skips the `ld.so.preload` mount, so HAMi-core is never loaded and the container sees the full card (`server.go:695`). It is a deliberate escape hatch, and it means the isolation boundary depends on that variable not being set by the workload.

The extender guards its input size. The request body is read through `io.LimitReader` with a 1 MB cap (`pkg/scheduler/routes/route.go:33`, `route.go:50`), so a malformed or oversized extender call cannot exhaust memory in the scheduler process. It is a small defensive choice that is easy to miss and rarely documented.
