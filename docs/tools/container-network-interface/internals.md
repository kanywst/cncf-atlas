# Internals

> Read from the source at commit `7c27007`. Every claim here should point at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `libcni` | Runtime-side library: parse config, run plugin chains, cache results (`libcni/api.go`, `libcni/conf.go`) |
| `pkg/skel` | Plugin-side skeleton: dispatch `CNI_COMMAND` to callbacks (`pkg/skel/skel.go`) |
| `pkg/invoke` | Transport: build env, exec the binary, parse stdout (`pkg/invoke/args.go`, `pkg/invoke/raw_exec.go`, `pkg/invoke/exec.go`) |
| `pkg/types` | Config, result interface, and error types (`pkg/types/types.go`) |
| `pkg/types/100` | The current 1.x result struct and version converters (`pkg/types/100/types.go`) |
| `cnitool` | Reference CLI that drives `libcni` (`cnitool/main.go`) |

## Core data structures

`PluginConf` (aliased as `NetConf`) is one plugin's config: `CNIVersion`, `Name`, `Type`, `Capabilities`, `IPAM`, `DNS`, and the parsed `PrevResult` (`pkg/types/types.go:64-78`). It also carries `ValidAttachments`, supplied only during a GC operation.

`NetworkConfigList` is the whole conflist: a `Name`, `CNIVersion`, the `Plugins []*PluginConfig` chain, and the `DisableCheck` and `DisableGC` flags (`libcni/api.go:79-87`).

`RuntimeConf` is the per-call runtime input: `ContainerID`, `NetNS`, `IfName`, `Args`, and `CapabilityArgs` (`libcni/api.go:54-68`). The comment notes that libcni passes only the `CapabilityArgs` keys matching the plugin's advertised capabilities.

`Result` is an interface, not a struct, with `Version`, `GetAsVersion`, `Print`, and `PrintTo` (`pkg/types/types.go:128-142`). The current concrete form is `types/100.Result` with `Interfaces`, `IPs`, `Routes`, and `DNS` (`pkg/types/100/types.go:90-96`). An `Interface` holds `Name`, `Mac`, `Mtu`, `Sandbox`, `SocketPath`, and `PciID` (`pkg/types/100/types.go:270`), and an `IPConfig` holds an `Interface` index, `Address`, and `Gateway` (`pkg/types/100/types.go:298`).

`types.Error` carries a numeric `Code`, `Msg`, and `Details`. Well-known codes are defined as constants, including `ErrIncompatibleCNIVersion` (1), `ErrTryAgainLater` (11), and `ErrInternal` (999) (`pkg/types/types.go:233-247`).

## A path worth tracing

Follow a result from the plugin's stdout back into a typed Go value. `ExecPluginWithResult` runs the plugin, then hands the raw bytes to `fixupResultVersion` and `create.Create` (`pkg/invoke/exec.go:121-137`):

```go
stdoutBytes, err := exec.ExecPlugin(ctx, pluginPath, netconf, args.AsEnv())
if err != nil {
    return nil, err
}

resultVersion, fixedBytes, err := fixupResultVersion(netconf, stdoutBytes)
if err != nil {
    return nil, err
}

return create.Create(resultVersion, fixedBytes)
```

The interesting branch is `fixupResultVersion` (`pkg/invoke/exec.go:39-78`). It decodes the config version, then manually inspects the result's `cniVersion`. If that field is present and non-empty, it is used as-is. If it is missing or empty, the function assigns the config version rather than the spec-mandated 0.1.0, citing issue #895. A nil result map (plugin printed `null`) is replaced with an empty map first to avoid a panic.

Failures travel the opposite way. A plugin signals an error by printing a `types.Error` JSON to stdout and exiting non-zero; `pluginErr` unmarshals that back into a Go error, falling back to stderr text when stdout is empty (`pkg/invoke/raw_exec.go:72-84`).

## Things that surprised me

The "text file busy" retry. `RawExec.ExecPlugin` runs the binary up to six times, sleeping a second whenever the error contains "text file busy" (`pkg/invoke/raw_exec.go:44-57`). This guards against a race where a plugin binary was just written to disk and is not yet executable.

Result caching changes the consistency story. CHECK, DEL, and GC need the result that ADD returned, so libcni persists `cachedInfo` to `/var/lib/cni/results/` for spec 0.4.0 and above, and `getCachedResult` even falls back to a legacy on-disk format (`libcni/api.go:225-236`, `libcni/api.go:366`). The on-disk cache, not the live network, is the source of truth for teardown.

GC is a two-stage workaround. The library first deletes attachments that are cached but absent from the supplied valid-attachments set, then, on spec 1.1.0 and above, sends a GC command to each plugin (`libcni/api.go:770-842`). To survive a variable-name mistake in an earlier spec, it injects both `cni.dev/valid-attachments` and `cni.dev/attachments` with the same value, flagged by issue #1101 (`libcni/api.go:824-826`).
