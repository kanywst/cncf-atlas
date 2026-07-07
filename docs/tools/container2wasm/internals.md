# Internals

> Read from the source at commit `74662a2`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/c2w` | Conversion CLI. `main` at `cmd/c2w/main.go:23`, `rootAction` at `cmd/c2w/main.go:94`. Translates flags into a buildx invocation. |
| `cmd/create-spec` | Build-time: unpacks the OCI image and writes the OCI spec and boot config. `main` at `cmd/create-spec/main.go:34`. |
| `cmd/init` | Run-time PID 1 inside the emulated Linux. Mounts, patches the spec, execs runc. `doInit` at `cmd/init/main.go:39`. |
| `cmd/c2w-net` | Host-side user-mode network stack using gvisor-tap-vsock (`cmd/c2w-net/main.go:15-17`). |
| `cmd/get-qemu-state` | Helper to extract QEMU snapshot state. |
| `embed.go` | Embeds the 1064-line Dockerfile via `//go:embed` (`embed.go:5-6`). |
| `config/{qemu,tinyemu,bochs}` | Kernel configs and template arguments per emulator. |
| `extras/c2w-net-proxy` | In-Wasm browser network proxy (`c2w-net-proxy.wasm`). |
| `extras/imagemounter` | Run-time mounter that passes an external bundle over 9p (`imagemounter.wasm`). |

## Core data structures

The types that carry state between build time and run time live in `cmd/init/types/types.go`:

- **`BootConfig`** is the boot configuration that `create-spec` writes at build time and `init` consumes at run time. Its fields include `Mounts`, `Cmd`, `CmdPreRun`, `Container`, `PostMounts`, and `Debug`.
- **`ContainerInfo`** holds the in-guest paths runc needs: `BundlePath`, `ImageConfigPath`, `ImageRootfsPath`, `RuntimeConfigPath`, and `ExternalBundle`.
- **`MountInfo`** is a declarative mount description (9p, overlay, proc, and so on), with `Async` and `Optional` flags for parallel and best-effort mounts. `mountAll` (`cmd/init/main.go:371`) processes them.
- **`runtimeFlags`** (`cmd/init/main.go:411`) holds values the host injects at run time through an `info` file: `mounts`, `env`, `entrypoint`, `args`, `withNet`, `mac`, and `bundle`. The `info` file uses a small line protocol with prefixes `m:`, `c:`, `e:`, `env:`, `n:`, `t:`, and `b:` (`cmd/init/main.go:440-485`).

The embedded `Dockerfile` (`embed.go:6`, `var Dockerfile []byte`) is effectively the fifth data structure: it is the converter, and the CLI is a thin shim that hands it to buildx.

## A path worth tracing

The non-obvious part of run time is how a pre-booted snapshot resumes and then hands control back to the container. The build snapshots the emulator after Linux has booted, using wizer:

```text
Dockerfile:313 (TinyEMU):
  wizer --allow-wasi --wasm-bulk-memory=true \
    -r _start=wizer.resume --mapdir /pack::/pack -o temu temu-org
```

`_start` is renamed to `wizer.resume`, so when a WASI runtime runs the module it resumes from the booted image instead of cold-booting. The default is `OPTIMIZATION_MODE=wizer` (`Dockerfile:29`); choosing `native` boots the kernel on every run. Bochs takes the same path at `Dockerfile:1029`, and `wasi-vfs pack` embeds `/pack` into the module at `Dockerfile:317` and `Dockerfile:1033`.

On the guest side, `init` cooperates with that snapshot boundary. `doInit` (`cmd/init/main.go:39`) reads `/oci/initconfig.json` (`cmd/init/main.go:44`), mounts `wasi0` (rootfs) and `wasi1` (pack) over 9p into `/mnt` (`cmd/init/main.go:88`), parses the host's `info` file with `parseInfo` (`cmd/init/main.go:422`), applies it to the OCI spec with `patchSpec` (`cmd/init/main.go:490`), writes `config.json`, and `exec`s runc (`cmd/init/main.go:300-311`). When the container exits it calls `poweroff -f` (`cmd/init/main.go:313`).

## Things that surprised me

- **The wizer handshake is visible in stdout.** Because the snapshot is taken mid-run, `init` prints a `==========` marker to stdout at the wizer boundary and waits for the host to signal before continuing (`cmd/init/main.go:124-141`). The boot/resume seam is coordinated through the console stream, not a hidden channel.
- **A container runs a full kernel and runc.** The `.wasm` is not the application. It is Bochs or TinyEMU, which boots a real Linux, which starts runc, which starts your container. Three layers of "runtime" sit under the workload before it executes.
- **Generated `.wasm` carries third-party licenses.** Because the emulator and kernel are compiled into the output, the produced `.wasm` bundles code under LGPL-2.1 (Bochs), MIT (TinyEMU), and other licenses (GRUB, BBL, Linux, tini, runc, binfmt), even though container2wasm itself is Apache-2.0 (`LICENSE:2-4`). The README calls this out, and anyone redistributing a generated `.wasm` should account for it.
- **The module path never moved.** The repository migrated to the `container2wasm/container2wasm` organization, but the Go module path is still `github.com/ktock/container2wasm` (`go.mod:1`).

## Sources

1. container2wasm source at commit [`74662a2`](https://github.com/container2wasm/container2wasm/commit/74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd), accessed 2026-06-26.
2. [container2wasm README](https://github.com/container2wasm/container2wasm/blob/main/README.md) (third-party licenses), accessed 2026-06-26.
