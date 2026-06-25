# Internals

> Read from the source at commit `9a3f1c4`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/limactl` | CLI (cobra); `main()` at `cmd/limactl/main.go:33`. |
| `pkg/instance` | Instance lifecycle: `Create`, `Prepare`, `Start`, `StartWithPaths`. |
| `pkg/hostagent` | Host-side daemon driving the VM, SSH, mounts, port forward, DNS. |
| `pkg/driver` + `pkg/driver/{qemu,vz,wsl2,krunkit}` | VM backend abstraction and in-tree drivers. |
| `pkg/driver/external` | gRPC contract for out-of-tree drivers. |
| `pkg/guestagent` + `cmd/lima-guestagent` | Agent inside the VM serving `GuestService`. |
| `pkg/cidata` | cloud-init ISO9660 generation. |
| `pkg/limatype` | Core data types (`Instance`, `LimaYAML`). |
| `pkg/registry` | Driver registration and lookup. |

## Core data structures

- **`limatype.Instance`** at `pkg/limatype/lima_instance.go:26` holds runtime state: `Name`, `Status`, `Dir`, `VMType`, `Arch`, `CPUs`, `Memory`, `Disk`, `SSHLocalPort`, `HostAgentPID`, `DriverPID`, and `Config *LimaYAML`. `Status` is a string alias (`pkg/limatype/lima_instance.go:15`) with values such as `Running`, `Stopped`, and `Broken`.
- **`limatype.LimaYAML`** at `pkg/limatype/lima_yaml.go:16` is the full template schema a user writes: `VMType`, `Images`, `Mounts`, `MountType`, `PortForwards`, `Provision`, `Containerd`, `Networks`, `Rosetta`, `Plain`, and more. Many fields are pointers so jsonschema can express nullability, and `base` allows template inheritance.
- **`driver.Driver`** interface at `pkg/driver/driver.go:81` composes `Lifecycle`, `GUI`, `SnapshotManager`, and `GuestAgent`, plus `Info`, `Configure`, `FillConfig`, `SSHAddress`, and `AdditionalSetupForSSH`. `Info` at `pkg/driver/driver.go:110` carries capability flags in `Features`.
- **Driver registry** at `pkg/registry/registry.go:41` keeps two maps: `internalDrivers` and `ExternalDrivers`. `Get` at `pkg/registry/registry.go:73` resolves a name (external drivers take precedence), and `Register` at `pkg/registry/registry.go:197` registers in-tree drivers. For example, the QEMU driver registers itself in an `init()` via `registry.Register(...)` at `pkg/driver/qemu/register.go:15`.

## A path worth tracing

The interesting path is how the CLI hands off to the background hostagent. `StartWithPaths` (`pkg/instance/start.go:168`) does not run the VM in-process; it re-executes `limactl` with the `hostagent` subcommand as a detached child:

```go
"hostagent",
// ... args assembled ...
haCmd = exec.CommandContext(ctx, limactl, args...)
haCmd.SysProcAttr = executil.BackgroundSysProcAttr
haCmd.Stdout = haStdoutW
haCmd.Stderr = haStderrW
// ...
} else if err := haCmd.Start(); err != nil {
```

The argument string is set at `pkg/instance/start.go:218`, the command at `pkg/instance/start.go:234`, and `haCmd.Start()` at `pkg/instance/start.go:249`. The parent then watches the child's stdout for JSON progress events. The child runs `hostagentAction` (`cmd/limactl/hostagent.go:43`), builds the agent with `hostagent.New` (`cmd/limactl/hostagent.go:109`), and calls `ha.Run` (`cmd/limactl/hostagent.go:136`). `Run` boots the VM with `a.driver.Start(ctx)` (`pkg/hostagent/hostagent.go:424`), then enters `startRoutinesAndWait` (`pkg/hostagent/hostagent.go:498`).

## Things that surprised me

- **External drivers are full gRPC services.** `pkg/driver/external/driver.proto:7` defines `service Driver` with more than 30 RPCs, including `Start` returning `stream StartResponse`, plus `CreateSnapshot`, `Stop`, and others. Driver selection goes through `CreateConfiguredDriver` at `pkg/driverutil/instance.go:25`, which calls `registry.Get`. Lifecycle hooks shell out to the external binary directly: `handlePreConfiguredDriverAction` runs `exec.CommandContext(ctx, extDriverPath, "--pre-driver-action")` at `pkg/driverutil/vm.go:56`. This lets a backend like krunkit ship out-of-tree and still plug into core.
- **Everything is split into separate executables.** Beyond drivers, `cmd` holds `*.lima` wrappers (`nerdctl.lima`, `docker.lima`, `kubectl.lima`, `podman.lima`, `apptainer.lima`), the per-driver `lima-driver-*` binaries, and `limactl-mcp`. Plugins and drivers are deliberately separate processes.
- **Supply-chain metadata in `go.mod`.** The module file opens with `// gomodjail:confined` (`go.mod:1`) and `//gosocialcheck:trusted` (`go.mod:7`), and individual dependencies carry `// gomodjail:unconfined` markers. These annotations classify dependencies for sandboxing as a supply-chain hardening measure.

## Sources

1. Lima source at commit [`9a3f1c4`](https://github.com/lima-vm/lima/commit/9a3f1c443389c673eb619f7b1922b1a4d8e4fd16), accessed 2026-06-24.
