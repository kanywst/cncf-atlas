# Internals

> Read from the source at commit `8ff6260`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/` | Cobra CLI commands; most wrap a pipeline (`cmd/dev.go`, `cmd/run_pipeline.go`, `cmd/root.go`) |
| `pkg/devspace/pipeline/` | Execution engine: embedded shell (`engine/`) and built-in commands (`engine/pipelinehandler/commands/`) |
| `pkg/devspace/devpod/` | Development pod lifecycle and per-pod service startup |
| `pkg/devspace/services/sync/` | Client side of the two-way file sync (controller and stream wiring) |
| `pkg/devspace/sync/` | The sync engine proper: watch tree, upstream, downstream |
| `pkg/devspace/services/podreplace/` | Swap the target workload for a dev pod |
| `pkg/devspace/services/inject/` | Inject the `devspacehelper` binary into a container |
| `pkg/devspace/build/builder/` | Pluggable image builders: docker, buildkit, kaniko, custom |
| `pkg/devspace/config/versions/` | Config schema generations and in-memory upgrade |
| `helper/` | The `devspacehelper` binary that runs inside the container (sync server, SSH, restart) |

The Go module path is `github.com/loft-sh/devspace` (`go.mod:1`) even though the repository is `devspace-sh/devspace`; the module path is kept for import compatibility after the CNCF donation.

## Core data structures

The sync engine turns on the `Sync` struct (`pkg/devspace/sync/sync.go:68`). It holds the local watch tree (`tree notify.Tree`), an `upstream`, and a `downstream` (`sync.go:77`). `NewSync` (`sync.go:90`) builds the ignore parsers and, notably, excludes the sync log itself from the watch set so writes to it do not trigger an infinite sync loop (comment at `sync.go:112`). The local watch is provided by `github.com/loft-sh/notify` (`sync.go:17`), a Loft Labs fork of `rjeczalik/notify` that adds the recursive watch tree the engine relies on.

The two directions are separate types with separate transports:

- `upstream` (local to container), `pkg/devspace/sync/upstream.go`. `newUpstream` (`upstream.go:71`) takes a reader and a writer that are the `exec` stream's stdout and stdin. Its `mainLoop` (`upstream.go:201`) collects filesystem events, debounces them, and streams the changed files as an `archive/tar` (`upstream.go:4`) plus `compress/gzip` (`upstream.go:6`) payload into the writer. After applying an upload it can touch a restart file (`restart.TouchPath`, `upstream.go:298`) or restart the container (`upstream.go:331`, `RestartContainer` at `:716`).
- `downstream` (container to local), `pkg/devspace/sync/downstream.go`. `newDownstream` (`downstream.go:39`) talks gRPC to the helper: `mainLoop` (`downstream.go:158`) polls `d.client.ChangesCount` (`downstream.go:178`), and once enough changes have accumulated it calls `collectChanges` (`downstream.go:192`) and `applyChanges` (`downstream.go:198`). `collectChanges` streams from `d.client.Changes` (`downstream.go:107`). The gRPC contract lives in `helper/remote/remote.proto` with generated `remote.pb.go` and `remote_grpc.pb.go`.

So the protocol is asymmetric. Uploads are a raw compressed tar stream; downloads are gRPC. Both ride a single `kubectl exec` stdin/stdout pair, one per direction.

## A path worth tracing

Take `devspace dev` from the built-in `start_dev` command down to a running sync.

```text
start_dev (pipeline built-in)      pipelinehandler/handler.go:55
  -> StartDev                       commands/start_dev.go:27
       DevPodManager().StartMultiple  start_dev.go:74
  -> devPod.Start                   devpod/devpod.go:74
       -> startWithRetry            devpod.go:123
       -> start                     devpod.go:221   (pod replace if needed)
       -> startServices             devpod.go:501   (tomb: sync + port-forward)
            sync.StartSync          devpod.go:515
  -> controller.startSync           services/sync/controller.go:270
       inject.InjectDevSpaceHelper  controller.go:403  -> /tmp/devspacehelper
       sync.NewSync                 controller.go:462
       exec: sync upstream          controller.go:468
       exec: sync downstream        controller.go:513
       InitUpstream / InitDownstream controller.go:507 / :535
  -> Sync.Start -> mainLoop         sync/sync.go:166 / :209
       startUpstream (notify.Tree)  sync.go:232
       startDownstream              sync.go:268
       initialSync                  sync.go:277
```

The controller is where the two transports get set up. It creates the exec argument lists as `[/tmp/devspacehelper sync upstream ...]` (`controller.go:468`) and `[/tmp/devspacehelper sync downstream ...]` (`controller.go:513`), builds an `io.Pipe` for each so the exec streams look like readers and writers, then hands them to `syncClient.InitUpstream(...)` (`controller.go:507`) and `syncClient.InitDownstream(...)` (`controller.go:535`). The injection at `controller.go:403` is what makes the helper available in the first place: `InjectDevSpaceHelper` (`pkg/devspace/services/inject/inject.go:49`) places `devspacehelper` at the container path constant `/tmp/devspacehelper` (`inject.go:43`).

## Things that surprised me

**The shell is inside the binary.** DevSpace does not shell out to `/bin/sh`. It imports `mvdan.cc/sh/v3` (`engine.go:9`) and runs pipelines on that interpreter, so the same POSIX script and the same built-ins work on Windows without a shell installed. The built-ins are implemented by intercepting the interpreter's exec handler: `execHandler.ExecHandler` (`handler.go:121`) checks `handlePipelineCommands` for a match before delegating to the basic shell handler.

**The upload and download halves are different protocols.** It would be natural to assume the sync is symmetric. It is not. The upstream side ships a `tar`/`gzip` stream (`upstream.go:4`, `:6`), while the downstream side runs gRPC against the injected helper (`downstream.go:107`, `:178`). Both are multiplexed onto one `kubectl exec` channel per direction, which is why DevSpace needs nothing listening in the cluster.

**The watch layer is a fork the project owns.** Instead of depending on upstream `rjeczalik/notify`, DevSpace imports `github.com/loft-sh/notify` (`sync.go:17`) so it controls the recursive watch behavior that file sync performance rides on.

**Twelve config generations live in the tree.** `pkg/devspace/config/versions/` carries `v1beta1` through `v1beta11` plus `latest`, where `latest` is `v2beta1` (`pkg/devspace/config/versions/latest/schema.go:16`). Old `devspace.yaml` files are upgraded to the latest schema in memory, so a long-lived CLI keeps reading configs written years earlier without rewriting them on disk.
