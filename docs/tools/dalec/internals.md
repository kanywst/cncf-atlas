# Internals

> Read from the source at commit `0d888c2`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/frontend/` | The frontend binary BuildKit runs; entrypoint and internal subcommands |
| repository root (`package dalec`) | The spec data model and shared logic: `spec.go`, `load.go`, `source*.go`, `artifacts.go`, `tests.go`, generators |
| `frontend/` | Router, request handling, target forwarding, and signing (`MaybeSign`) |
| `targets/linux/rpm/distro/` | RPM distro handlers (Azure Linux, AlmaLinux, Rocky Linux) |
| `targets/linux/deb/distro/` | DEB distro handlers (Debian, Ubuntu) |
| `targets/windows`, `targets/plugin` | Windows targets and external-frontend forwarding |
| `packaging/linux/rpm`, `packaging/linux/deb` | Spec-to-`.spec` / spec-to-`debian/` conversion and the `rpmbuild`/`dpkg` LLB |

## Core data structures

`Spec` (`spec.go:20`) is the root of the parsed YAML. It holds `Name`, `Version`, and `Revision` (`spec.go:22`, `spec.go:29`, `spec.go:32`), `License` (`spec.go:75`), `Sources map[string]Source` (`spec.go:56`), `Patches map[string][]PatchSpec` (`spec.go:63`), `Build ArtifactBuild` (`spec.go:66`), `Artifacts` (`spec.go:82`), `Targets map[string]Target` (`spec.go:85`), `Dependencies *PackageDependencies` (`spec.go:89`), `Image *ImageConfig` (`spec.go:95`), and `Tests []*TestSpec` (`spec.go:103`). Every distro handler reads from this one struct.

`Source` (`source.go:31`) is a tagged union of source kinds: `DockerImage`, `Git`, `HTTP`, `Context`, `Build`, `Inline`, and `LLB`. Its invariant is stated in a comment: exactly one must be non-nil (`source.go:33`). Filtering fields (`Path`, `Includes`, `Excludes`) live at `source.go:46`, `source.go:50`, `source.go:52`, and `Generate []*SourceGenerator` (`source.go:65`) drives the gomod/cargohome/pip cache generators. A custom `UnmarshalYAML` (`source.go:70`) keeps the original YAML node as a source map.

`Router` and `Route` (`frontend/router.go:73`, `frontend/router.go:49`) are the dispatch core. A `Route` carries `FullPath` (`frontend/router.go:51`), a `Handler` of type `gwclient.BuildFunc` (`frontend/router.go:54`), an `Info Target` (`frontend/router.go:57`), and an optional `Forward *Forward` (`frontend/router.go:61`).

`distro.Config` (`targets/linux/rpm/distro/distro.go:14`) is one distro's configuration: `FullName` and `ImageRef` (`distro.go:15`, `distro.go:16`), `ReleaseVer` (`distro.go:20`), `BuilderPackages` (`distro.go:23`), `BasePackages []dalec.Spec` (`distro.go:26`), an `InstallFunc PackageInstaller` (`distro.go:31`), and `CacheName`/`CacheDir` (`distro.go:35`, `distro.go:41`). Azure Linux, AlmaLinux, and Rocky Linux are each a value of this struct, which is how they share the RPM code path.

The RPM `.spec` file is generated from `specTmpl` (`packaging/linux/rpm/template.go:23`), a `text/template`. It fills `Name`, `Version`, `Release`, `License`, and `Summary` (`template.go:25`), then the `%description`, `PrepareSources`, `BuildSteps`, `Install`, `Post`, `Files`, and `Changelog` sections (`template.go:44`). This template is the concrete point where a Dalec spec turns into an RPM spec file.

## A path worth tracing

Take the `azlinux3/container` target end to end: spec to RPM to minimal container.

```text
HandleContainer(cfg)          targets/linux/rpm/distro/distro.go:125
  -> Config.BuildContainer     container.go:17
       -> Config.BuildPkg      pkg.go:47
            spec.Preprocess    pkg.go:54   run source generators
            rpm.BuildRoot      pkg.go:58   assemble rpmbuild tree
            rpm.Build          pkg.go:70   run rpmbuild as LLB
       -> frontend.MaybeSign   pkg.go:72   sign if requested
       -> cfg.Install(pkgs)    container.go:68  install RPM into /tmp/rootfs
```

The route's handler is `linux.HandleContainer(cfg)` (`targets/linux/rpm/distro/distro.go:125`), which calls `Config.BuildContainer` (`targets/linux/rpm/distro/container.go:17`). Building the container needs the package first, so `Config.BuildPkg` (`targets/linux/rpm/distro/pkg.go:47`) prepares a worker image with build dependencies (`pkg.go:50`), runs the spec's generators via `spec.Preprocess` (`pkg.go:54`), builds the `rpmbuild` tree with `rpm.BuildRoot` (`pkg.go:58`), fixes the `.spec` path at `SPECS/<name>/<name>.spec` (`pkg.go:60`), and runs `rpmbuild` as LLB with `rpm.Build` (`pkg.go:70`).

Signing overlays the result. `frontend.MaybeSign` (`pkg.go:72`) produces a signed state and copies it over the unsigned output with `st.File(llb.Copy(signed, "/", "/"))` (`pkg.go:76`), so an unsigned build and a signed build differ only by this overlay step.

`BuildContainer` then installs the package into a fresh root filesystem: it picks a base with `spec.GetSingleBase(targetKey)` (`container.go:23`), mounts an install-time repository (`container.go:31`), runs `cfg.Install(pkgs, ...)` on the worker to place the RPM under `/tmp/rootfs` (`container.go:68`), applies `InstallPostSymlinks` if the spec declares post-install symlinks (`container.go:76`), and returns the rootfs state. Every one of these steps appends to the LLB graph; BuildKit solves it with parallelism and caching.

## Things that surprised me

The frontend never runs the build. Each function above returns an LLB state, not a finished artifact. The whole `HandleContainer` chain is graph construction, and the real `rpmbuild`, install, and copy happen only when BuildKit solves the graph. That inversion is why Dalec needs no build server and gets caching and parallelism from BuildKit for free.

Plugin extension is a route overwrite, not a registry. `Router.Add` lets a later route with the same `FullPath` silently replace an earlier one, and the comment says this is deliberate: target forwarding uses it to override built-ins (`frontend/router.go:79`). `WithTargetForwardingHandler` (`frontend/router.go:399`) is what installs the override when a spec points at an external frontend. Extending Dalec means shadowing a built-in route rather than registering into a separate plugin table.

The router wraps every request in a `recover`. `Router.Handler` defers a recover that turns any panic into a joined error return (`frontend/router.go:91`), so a bug in one target's handler surfaces as a build error instead of taking down the frontend process that BuildKit is talking to.
