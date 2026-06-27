# Internals

> Read from the source at commit `8e5a9d2`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `bpfman/src/lib.rs` | Core operations: load, attach, detach, remove, database init |
| `bpfman/src/types.rs` | The `Program`, `Link`, `ProgramData`, `AttachInfo` types |
| `bpfman/src/multiprog/` | Dispatchers that let many programs share one XDP or TC hook |
| `bpfman/src/bin/cli/` | The `bpfman` CLI binary |
| `bpfman-api/` | The `bpfman-rpc` gRPC server wrapping the library |

## Core data structures

The system turns on a few types in `bpfman/src/types.rs`. The state of a program does not live in a struct field; it lives in a database tree. `ProgramData` is a thin wrapper over a `sled::Tree` (`bpfman/src/types.rs:1459`):

```text
pub struct ProgramData(pub sled::Tree);
```

Metadata such as name, location, global data, kernel info, and map pin path is read and written by key strings against that tree, not held as in-memory fields. The database tree is the source of truth.

`Program` is the enum of supported program types (`bpfman/src/types.rs:1268`), with variants such as `Xdp(XdpProgram)` and `Tc(TcProgram)`. Each variant holds a concrete type, for example `XdpProgram` (`bpfman/src/types.rs:2367`). Attachment state is kept separately. `Link` is its enum (`bpfman/src/types.rs:811`) and `LinkData` wraps its own tree (`bpfman/src/types.rs:166`):

```text
pub struct LinkData(pub(crate) sled::Tree);
```

Splitting `ProgramData` (loaded) from `LinkData` (attached) mirrors the v0.6.0 split of load and attach into separate operations. `AttachInfo` (`bpfman/src/types.rs:1334`) carries the per-type attach parameters: XDP takes priority, interface, proceed-on, and network namespace, while a kprobe takes a function name, offset, and container pid.

## A path worth tracing

The dispatcher is the non-obvious core. The kernel allows one XDP or TC program per interface, so bpfman installs its own dispatcher in that slot and inserts user programs as extensions. `Dispatcher` selects the kind (`bpfman/src/multiprog/mod.rs:23`):

```text
pub(crate) enum Dispatcher {
    Xdp(XdpDispatcher),
    Tc(TcDispatcher),
}
```

`XdpDispatcher` (`bpfman/src/multiprog/xdp.rs:50`) does not pull its bytecode from a registry. It uses bytecode compiled into the binary (`bpfman/src/multiprog/xdp.rs:63`):

```text
        let program_bytes = XDP_DISPATCHER_BYTES;
```

The slot table is fixed-size. The config is built with ten-element arrays, one entry per slot (`bpfman/src/multiprog/xdp.rs:65`):

```text
        let xdp_config = XdpDispatcherConfig::new(11, 0, [0; 10], [DEFAULT_PRIORITY; 10], [0; 10]);
```

When a user XDP or TC program is loaded, `load_program` (`bpfman/src/lib.rs:1232`) clones the dispatcher's file descriptor and loads the user program as an extension against it. For the XDP variant the extension is loaded with `ext.load(fd, "compat_test")` (`bpfman/src/lib.rs:1263`) and then pinned to the BPF filesystem as `prog_{id}` (`bpfman/src/lib.rs:1268`). The dispatcher's own keys in the sled (the embedded database) are defined as string constants such as `REVISION` (`bpfman/src/multiprog/xdp.rs:41`) and `NUM_EXTENSIONS` (`bpfman/src/multiprog/xdp.rs:45`).

## Things that surprised me

State recovery is built on the database rather than on a running process. `init_database` (`bpfman/src/lib.rs:869`) opens the sled store, and the library walks its prefixed trees to rebuild state after a restart. Because `ProgramData` and `LinkData` are just trees in `/run/bpfman/db`, recovery is a database scan, not a daemon's in-memory rebuild.

The kernel interface is entirely through the `aya` Rust crate (`aya = 0.13.1` in `Cargo.toml`), not libbpf. Choosing a pure-Rust eBPF library over the C toolchain is a defining trait of the project rather than an implementation detail.

Removal is the mirror of attach. `remove_program` (`bpfman/src/lib.rs:366`) delegates to `remove_program_internal` (`bpfman/src/lib.rs:397`), which detaches every link before deleting the program and its maps. A single detach is reached through `detach` (`bpfman/src/lib.rs:417`), which restores a link from its own tree and tears it down.
