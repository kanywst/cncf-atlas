# Internals

> Read from the source at commit `0c6315b`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `crates/wash/src/main.rs` | CLI entry; `WashCliCommand` enum and command dispatch |
| `crates/wash/src/cli/dev.rs` | `wash dev` hot-reload loop |
| `crates/wash-runtime/src/host/mod.rs` | `HostApi` trait, `Host`, workload lifecycle |
| `crates/wash-runtime/src/engine/mod.rs` | `Engine`, WASI linker setup, workload initialization |
| `crates/wash-runtime/src/engine/workload.rs` | import resolution, plugin binding, service execution |
| `crates/wash-runtime/src/types.rs` | core data types mapped to the gRPC proto |
| `crates/wash-runtime/src/plugin/` | capability plugins (`wasi:*`, `wasmcloud:*`) |
| `proto/wasmcloud/runtime/v2/` | gRPC `WorkloadService` and `HostService` |

## Core data structures

The unit of deployment is `Workload` (`crates/wash-runtime/src/types.rs:27`). It holds a namespace and name, annotations, an optional `Service`, a `Vec<Component>`, a `host_interfaces: Vec<WitInterface>` list, and volumes. It mirrors the `workload.proto` message.

A `Component` (`crates/wash-runtime/src/types.rs:63`) is an executable component: `name`, `bytes` (the Wasm itself), an optional `digest`, `local_resources`, a `pool_size`, and `max_invocations`. A `Service` (`crates/wash-runtime/src/types.rs:53`) is the long-running variant: `bytes`, `digest`, `local_resources`, and `max_restarts` for restart-on-failure.

`LocalResources` (`crates/wash-runtime/src/types.rs:75`) carries the per-workload limits and wiring: `memory_limit_mb`, `cpu_limit` (default `-1`, meaning unlimited, set in `Default` at `crates/wash-runtime/src/types.rs:106`), a `config` map surfaced via `wasi:config/store`, an `environment` map for `wasi:cli/env`, `volume_mounts`, and `allowed_hosts: Arc<[AllowedHost]>` for egress.

`WorkloadState` (`crates/wash-runtime/src/types.rs:40`, `#[repr(i32)]`) is the wire-facing lifecycle enum: `Unspecified=0`, `Starting`, `Running`, `Completed`, `Stopping`, `Error`, `NotFound`. The numbers match the proto enum. Inside the host the representation is `HostWorkload` (`crates/wash-runtime/src/host/mod.rs:157`), with variants `Starting`, `Running(Box<ResolvedWorkload>)`, `Stopping`, and `Error(String)`; the conversion to `WorkloadState` is the `From` impl at `crates/wash-runtime/src/host/mod.rs:176`.

`HostHeartbeat` (`crates/wash-runtime/src/types.rs:150`) reports host id, hostname, HTTP port, version, labels, OS info, CPU and memory usage, component and workload counts, the host's WIT imports and exports, and environment such as the Kubernetes namespace. It is sent to the operator via `HostService.HostHeartbeat` (`proto/wasmcloud/runtime/v2/host_service.proto:12`).

## A path worth tracing

`Host::workload_start` (`crates/wash-runtime/src/host/mod.rs:636`) is where a workload comes to life. It first records intent, then does the work, then records the result, holding the write lock only for the short map updates.

```text
workload_start (host/mod.rs:636)
  workloads.write().insert(id, HostWorkload::Starting)   # :644
  workload_start_inner(request)                          # :647
    engine.initialize_workload(...) -> UnresolvedWorkload  (engine/mod.rs:294)
    unresolved.resolve(plugins, http_handler) -> ResolvedWorkload
    resolved.execute_service()                             (engine/workload.rs:518)
  match result:
    Ok  -> *workload = HostWorkload::Running(Box::new(rw)) # :665
    Err -> *workload = HostWorkload::Error(err.to_string())# :667
  return WorkloadStartResponse { workload_status { state, message } }
```

The state transition is computed before the second lock is taken (`crates/wash-runtime/src/host/mod.rs:649-657`): an error sets `WorkloadState::Error` with the error string, otherwise `WorkloadState::Running` with a success message. Then `and_modify` updates the existing map entry in place (`:664-668`).

`initialize_workload` (`crates/wash-runtime/src/engine/mod.rs:294`) is where compilation and validation happen: volumes are checked (HostPath must point at a real directory, EmptyDir is created as a temp dir), and the service plus each component are compiled into Wasmtime components before an `UnresolvedWorkload` is built. Import resolution then binds plugins: `resolve_component_imports` (`crates/wash-runtime/src/engine/workload.rs:804`) reads the component's WIT imports and pre-instantiates the matching plugin components into the linker.

## Things that surprised me

- Both WASI generations live on one linker. `add_wasi_to_linker` (`crates/wash-runtime/src/engine/mod.rs:65`) registers Preview 2 bindings and then Preview 3 bindings (the P3 block ends around `crates/wash-runtime/src/engine/mod.rs:188`). Which one a component uses is decided at runtime by `targets_wasip3` (`crates/wash-runtime/src/engine/mod.rs:196`), which checks for `@0.3` in the component's WASI imports or exports, with a separate `targets_wasip3_http` (`crates/wash-runtime/src/engine/mod.rs:210`) for HTTP. This lets one host run a mix of old and new WASI components during the migration.
- Sockets are a custom implementation, not upstream `wasmtime-wasi`. The linker setup swaps in `crate::sockets` for socket interfaces (`crates/wash-runtime/src/engine/mod.rs:65` and the P3 socket registration that follows). The reason is loopback support, so components on the same host can talk in-process without NATS.
- Egress is deny-by-default in the type itself. The doc comment on `allowed_hosts` states that an empty list means deny all, and the check lives in `crate::host::http::check_allowed_hosts` (`crates/wash-runtime/src/types.rs:92-103`). Allowlist strings are parsed at conversion time so the request hot path matches against the typed enum, not raw strings.
- The workspace forbids panics by lint. `Cargo.toml` sets `warnings = 'deny'` and `unsafe_code = 'deny'` (lines 20-21), plus clippy denies for `unwrap_used`, `expect_used`, `panic`, and `indexing_slicing` (lines 31-34). The runtime is written so there is no panic path to begin with.
