# Internals

> Read from the source at commit `68f2617`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/crio/` | Process entry point; `main.go` builds the CLI app and gRPC server (`cmd/crio/main.go:1-60`) |
| `server/` | CRI gRPC implementation; one `Server` for both services, handlers split per RPC |
| `internal/oci/` | OCI runtime abstraction: the `RuntimeImpl` interface and three implementations |
| `internal/lib/` | `ContainerServer` core and the `sandbox` package (`Sandbox` type) |
| `internal/storage/` | containers/storage wrapper for image pull, layers, and rootfs |
| `internal/config/`, `pkg/config/` | `crio.conf` configuration model and runtime handlers |
| `internal/nri/` | Node Resource Interface plugin surface |
| `internal/resourcestore/` | Reservation and cleanup for asynchronous resource creation |

## Core data structures

`Server` (`server/server.go:69-104`) is the CRI server. It embeds `*lib.ContainerServer`, so runtime, store, and storage access come through the embedded type. It carries `pullOperationsInProgress` and `pullOperationsLock` to coalesce parallel pulls, a `resourceStore` for in-flight resources, an `nri` plugin handle, and a `hooksRetriever`.

`oci.RuntimeImpl` (`internal/oci/oci.go:60-86`) is the interface every runtime must satisfy. It declares the lifecycle calls: `CreateContainer`, `StartContainer`, `ExecContainer`, `StopContainer`, `CheckpointContainer`, and the rest. `Runtime` resolves a handler name to an implementation through `runtimeImplMap` (`internal/oci/oci.go:95-98`), and `ValidateRuntimeHandler` rejects an empty handler or empty runtime path before use (`internal/oci/oci.go:108-124`).

`oci.Container` (`internal/oci/container.go:44`) is one container. It separates `bundlePath` under `/var/run`, erased on reboot, from `dir` under `/var/lib`, which persists (`internal/oci/container.go:50-53`). It holds the `*specs.Spec`, the container `state`, and fine-grained locks: `opLock` for OCI runtime state transitions, `metaLock` for metadata, and `stopLock` for stop coordination (`internal/oci/container.go:63-74`).

`libsandbox.Sandbox` (`internal/lib/sandbox/sandbox.go:33`) is one pod. It keeps the namespace handles, the `infraContainer`, the member containers in a `memorystore.Storer`, the IPs, and the port mappings, guarded by a `stateMutex`.

## A path worth tracing

The conmon launch in `runtime_oci.go` is the heart of how CRI-O actually starts a container. `createContainer` assembles conmon arguments rather than runc arguments:

```text
args := []string{
    "-b", c.bundlePath,
    "-c", c.ID(),
    "--exit-dir", r.config.ContainerExitsDir,
    "-l", c.logPath,
    ...
    "--persist-dir", c.dir,
    "-r", c.RuntimePathForPlatform(r),
    "--runtime-arg", fmt.Sprintf("%s=%s", rootFlag, r.root),
    ...
}
```

That block is at `internal/oci/runtime_oci.go:145-160`. The `-r` flag is the OCI runtime path and `--runtime-arg` is the root passed through to runc. The command is then built against `r.handler.MonitorPath`, which is conmon, not runc:

```text
cmd := cmdrunner.Command(r.handler.MonitorPath, args...)
cmd.Dir = c.bundlePath
```

That is `internal/oci/runtime_oci.go:217-218`. CRI-O execs conmon; conmon execs runc. The bundle directory it points at holds the `config.json` written earlier in the pod path (`server/sandbox_run_linux.go:1343`).

## Things that surprised me

The `bundlePath` and `dir` split on `oci.Container` encodes a reboot story in the type itself (`internal/oci/container.go:50-53`). Runtime state under `/var/run` is meant to vanish on reboot, while persisted metadata under `/var/lib` survives, so recovery logic knows which directory to trust.

Pull coalescing lives on the server, not the storage layer. `pullArguments` keys on image, sandbox cgroup, credentials, and namespace (`server/server.go:106-113`), and a `pullOperation` holds a `WaitGroup` that later arrivals block on (`server/server.go:115-126`). Two pods pulling the same image with the same credentials wait on one network fetch.

The lock granularity on `oci.Container` is unusually fine. Three separate locks (`opLock`, `metaLock`, `stopLock`) split OCI state transitions, metadata reads, and stop coordination (`internal/oci/container.go:63-74`), so a metadata read does not block a long-running stop. The comment on `stopTimeoutChan` warns that once the kill loop begins the channel must not be used, a hand-off rule the type does not enforce on its own (`internal/oci/container.go:75-78`).
