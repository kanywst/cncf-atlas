# Internals

> Read from the source at commit `2df3b8c` (v0.40.7). Every claim here points at a file and line.

## Code map

The `main` entry point is small: `main.go:15` builds the cobra root with `cmd.NewPackCommand` (`main.go:19`) and exits 2 on a `SoftError`, otherwise 1 (`main.go:27`). The real work is split across three layers.

| Path | Responsibility |
| --- | --- |
| `cmd/` | Assembles the cobra root command. |
| `internal/commands/` | Per-subcommand flag definitions and input validation. |
| `pkg/client/` | Public API; `Client.Build` (`pkg/client/build.go:308`) orchestrates a build. |
| `internal/build/` | Lifecycle execution engine that runs phases as containers. |
| `pkg/dist/` | On-disk metadata types for buildpacks and builders. |
| `internal/builder/` | In-memory builder image representation. |

## Core data structures

`BuildOptions` (`pkg/client/build.go:85`) carries every input to `pack build`: `Image` and `Builder` (both required), `AppPath`, `Buildpacks`, `Extensions`, `Publish`, `PullPolicy`, the `TrustBuilder` closure, and cache settings. It is the contract between the CLI layer and the client layer.

`LifecycleOptions` (`internal/build/lifecycle_executor.go:72`) holds the full set of lifecycle parameters: `UseCreator` and `UseCreatorWithExtensions` (the trust branch), `LifecycleImage`, `Cache`, `Network`, uid/gid, and `CreationTime`. It is built from `BuildOptions` at `pkg/client/build.go:637`.

`LifecycleExecution` (`internal/build/lifecycle_execution.go:35`) is the state of one build run: the negotiated `platformAPI`, the randomly named layers and app volumes, the mount paths, the options, and the temp dir. The phase methods hang off it.

`dist.Order` (`pkg/dist/dist.go:41`) is the buildpack detection order. `Order` is a slice of `OrderEntry` (`pkg/dist/dist.go:43`); each entry has a `Group` of `ModuleRef` (`pkg/dist/dist.go:57`), where a `ModuleRef` is a `ModuleInfo` plus an `Optional` flag. The detect phase resolves this order to choose the buildpacks that apply.

`builder.Builder` (`internal/builder/builder.go:71`) is the in-memory view of a builder image: its `order` and `orderExtensions`, the lifecycle descriptor, additional buildpacks and extensions, uid/gid, and stack id. When `pack` makes an ephemeral builder, it adds buildpacks here before saving.

## A path worth tracing

The branch in `Run` is the most consequential code. After resolving caches and creating the bridge network, it splits on `UseCreator`.

```go
if !l.opts.UseCreator {
    if l.platformAPI.LessThan("0.7") {
        // DETECT then ANALYZE
    } else {
        // ANALYZE then DETECT
    }
    // ... restore, build (or extend), export in separate containers
}
return l.Create(ctx, buildCache, launchCache, phaseFactory)
```

The untrusted path (`internal/build/lifecycle_execution.go:240`) runs each phase in its own container so that only the phases that need root run trusted, while the rest drop to the CNB user. The trusted path falls through to `l.Create` (`internal/build/lifecycle_execution.go:349`), which runs everything in one container.

`Detect` (`internal/build/lifecycle_execution.go:482`) shows how a phase container is assembled. `NewPhaseConfigProvider` is given container operations that run before the container (`EnsureVolumeAccess`, then `CopyDir` to copy the app into the volume with the builder's uid/gid) and, when extensions are present, post-container operations that copy `analyzed.toml` and `generated/` back out with `CopyOutToMaybe` (`internal/build/lifecycle_execution.go:504`). The phase then runs via `phaseFactory.New(configProvider).Run(ctx)`.

## Things that surprised me

`pack` is a platform, not a build tool. The build logic lives in the separate `lifecycle` binaries, and `pack` only orchestrates the builder and lifecycle images as containers. The import of `github.com/buildpacks/lifecycle/api` (`internal/build/lifecycle_executor.go:9`) is there to share the Platform API contract and file formats, not build code.

Each build creates a disposable bridge network named `pack.local-network-<rand>` plus throwaway layers and app volumes (`internal/build/lifecycle_execution.go:217`), torn down with deferred, retried cleanup.

The trusted-builder warning is security-sensitive: combining an untrusted builder with volume mounts triggers an explicit warning about sensitive data exposure (`internal/commands/build.go:136`), and the trust decision determines whether a root phase shares a container with the rest of the build.

## Sources

1. [buildpacks/pack repository](https://github.com/buildpacks/pack)
2. [buildpacks/lifecycle repository](https://github.com/buildpacks/lifecycle)
