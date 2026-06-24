# Internals

> Read from the source at commit `e96fd14b8`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/containerd` | Daemon entry point; selects built-in plugins |
| `cmd/containerd-shim-runc-v2` | The runc shim binary execed per container |
| `core/runtime/v2` | Task and shim lifecycle: TaskManager, ShimManager, bundle, binary |
| `core/containers` | Container metadata type and store |
| `core/content`, `core/snapshots`, `core/diff` | Blob store, layer snapshots, layer diff/apply |
| `core/metadata` | bolt-backed persistence |
| `core/remotes` | Registry pull and push |
| `plugins/services/*` | gRPC service plugins over core |
| `plugins/cri` | Kubernetes CRI implementation |
| `client/` | Go client SDK |

## Core data structures

`runtime.CreateOpts` (`core/runtime/runtime.go:36`) is the full input to task creation: the OCI `Spec`, the `Rootfs []mount.Mount`, `IO`, a `Runtime` string in `io.containerd.NAME.VERSION` form, `SandboxID`, and checkpoint fields.

`containers.Container` (`core/containers/containers.go:30`) is the persisted definition, not the running task. Its `ID` is unique within a namespace and immutable, and its `Runtime RuntimeInfo` is required and immutable, while `Spec` is required but mutable.

`Bundle` (`core/runtime/v2/bundle.go:122`) abstracts the on-disk OCI bundle directory as `ID` / `Path` / `Namespace`, and `Delete()` (`core/runtime/v2/bundle.go:132`) cleans it up atomically.

`ShimManager` (`core/runtime/v2/shim_manager.go:177`) holds the shim lifecycle: a namespaced shim set (`shims *runtime.NSMap[ShimInstance]`), the containerd and ttrpc addresses, a `runtimePaths sync.Map` caching runtime-name to fs-path, and an event exchange.

`shim` (`core/runtime/v2/shim.go:408`) is a handle to one shim process: `bundle *Bundle`, `client any` (the ttrpc client), `address`, and `version`.

`plugin.Registration` (`vendor/github.com/containerd/plugin/plugin.go:61`) is the assembly unit for the whole daemon: `Type`, `ID`, `Requires []Type`, and `InitFn`.

## A path worth tracing

Task creation is the most important path. The gRPC task service receives the create call at `plugins/services/tasks/local.go:171`, builds `runtime.CreateOpts` from the loaded container at `plugins/services/tasks/local.go:239`, rejects a duplicate task, then calls the v2 runtime:

```go
c, err := rtime.Create(ctx, r.ContainerID, opts)
```

That is `plugins/services/tasks/local.go:277`. It lands in `(*TaskManager).Create` at `core/runtime/v2/task_manager.go:159`, which writes the bundle (`core/runtime/v2/task_manager.go:160`), activates the rootfs mounts (`core/runtime/v2/task_manager.go:189`), and starts the shim (`core/runtime/v2/task_manager.go:213`). The shim manager resolves the runtime path and builds the binary handle at `core/runtime/v2/shim_manager.go:311` and `core/runtime/v2/shim_manager.go:316`, then `(*binary).Start` (`core/runtime/v2/binary.go:66`) execs the shim with `Action: "start"` (`core/runtime/v2/binary.go:80`), dials the printed address over ttrpc (`core/runtime/v2/binary.go:138`), and persists `bootstrap.json` (`core/runtime/v2/binary.go:144`). Finally the TaskManager wraps the shim (`core/runtime/v2/task_manager.go:220`) and sends the create RPC (`core/runtime/v2/task_manager.go:232`):

```text
local.Create (local.go:171)
  -> TaskManager.Create (task_manager.go:159)
       NewBundle (task_manager.go:160)
       mounts.Activate (task_manager.go:189)
       ShimManager.Start (task_manager.go:213 -> shim_manager.go:299)
         binary.Start (binary.go:66) exec shim, ttrpc dial, bootstrap.json
       shimTask.Create over ttrpc (task_manager.go:232)
```

## Things that surprised me

The daemon never runs a container in-process. The shim is a long-lived separate process, and the daemon can restart or upgrade without taking running containers down. On reconnect it rebuilds shim state by reading `bootstrap.json` through `restoreBootstrapParams` (`core/runtime/v2/shim_manager.go:343`). If a shim dies, the on-close callback `cleanupAfterDeadShim` (registered at `core/runtime/v2/shim_manager.go:326`) does the cleanup and emits the task-exit event, so exit collection is the shim's job, not the daemon's.

There is also a version-downgrade retry: when the create RPC returns not-implemented, the TaskManager lowers the task API version and retries (`core/runtime/v2/task_manager.go:232` through the `IsNotImplemented` branch), so a newer daemon can still drive an older shim.
