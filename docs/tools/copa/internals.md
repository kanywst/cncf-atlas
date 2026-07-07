# Internals

> Read from the source at commit `0f6f0ab`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `pkg/cmd/` | Cobra command wiring, flag parsing, and validation (`src/pkg/cmd/cmd.go`) |
| `pkg/patch/` | Patch orchestration: `patch.go`, `single.go`, `multi.go`, `core.go` |
| `pkg/pkgmgr/` | OS package-manager adapters: apk, dpkg, rpm, pacman |
| `pkg/langmgr/` | Language-library and toolchain patching (experimental) |
| `pkg/report/` | Report parsing and the scanner-plugin interface (Trivy built in) |
| `pkg/buildkit/` | BuildKit client, driver selection, platform discovery |
| `pkg/imageloader/` | Loading the solved image into Docker or Podman |
| `pkg/frontend/`, `cmd/frontend/` | BuildKit frontend entry point (`src/cmd/frontend/main.go:22`) |
| `pkg/vex/`, `pkg/bulk/`, `pkg/types/` | OpenVEX output, config-file batch patching, shared option/error/API types |

## Core data structures

`types.Options` is the input to the whole patch operation, built from CLI flags in `src/pkg/cmd/cmd.go:86-113` (the type lives in `pkg/types`). It carries Image, Report, PatchedTag, Platforms, Push, PkgTypes, Progress, OCIDir, ExitOnEOL, and the rest of the flag surface.

`unversioned.UpdateManifest` (`src/pkg/types/unversioned/types.go:10-16`) is the scanner-neutral normal form of "what to update". It holds `Metadata` (OS, config, node version), `OSUpdates`, `LangUpdates`, and an internal summary. Every scanner plugin converts its own report into this shape, which is why nothing below the parser depends on the scanner.

`unversioned.UpdatePackage` (`src/pkg/types/unversioned/types.go:59-67`) is one package's update instruction: Name, InstalledVersion, FixedVersion, VulnerabilityID, Type, Class, and PkgPath.

`pkgmgr.PackageManager` (`src/pkg/pkgmgr/pkgmgr.go:32-35`) is the contract every OS adapter satisfies: `InstallUpdates(ctx, *UpdateManifest, bool) (*llb.State, []string, error)` and `GetPackageType()`. The returned `*llb.State` is the BuildKit graph that installs the fixes.

`patch.Result` and `patch.Options` (`src/pkg/patch/core.go:23-63`) are the core layer's I/O. `Result` carries the BuildKit gateway result, the package type, the packages that errored, the validated updates, and the saved patched state and config data.

## A path worth tracing

The non-obvious code is how Copa patches an image that has no package manager inside it (distroless or scratch). `setupPackageManager` reads the OS metadata from the report and dispatches to the right adapter, erroring if the metadata is missing (`src/pkg/patch/core.go:304-311`). For a Debian-family image that lands in the dpkg adapter.

`(*dpkgManager).InstallUpdates` resolves a tooling image that does have `apt` (`getAPTImageName`), then calls `probeDPKGStatus` to decide whether the target is a normal image or a distroless one (`src/pkg/pkgmgr/dpkg.go:136-140`). The probe inspects the shape of the dpkg status data (for example a `status.d` directory) to tell the two apart (`src/pkg/pkgmgr/dpkg.go:199`).

```text
InstallUpdates
  getAPTImageName        -> resolve a tooling image that has apt
  probeDPKGStatus        -> normal image or distroless?
    normal    -> installUpdates          (run apt in the image)
    distroless-> unpackAndMergeUpdates    (download .deb in tooling image, merge artifacts in)
  validateDebianPackageVersions -> assert installed >= required
```

For a normal image the adapter runs the package manager in place via `installUpdates`. For a distroless image it takes the `unpackAndMergeUpdates` path: download the fixed `.deb` files in the tooling image, unpack them, and merge only those artifacts into the target filesystem, since the target has neither a shell nor a package manager to run (`src/pkg/pkgmgr/dpkg.go:146-152`, `src/pkg/pkgmgr/dpkg.go:175-185`). Finally `validateDebianPackageVersions` checks that each installed package is at least the required version (`src/pkg/pkgmgr/dpkg.go:188`).

## Things that surprised me

Package names from the scanner report are interpolated into shell commands, so a malicious or malformed name is an injection surface. `ValidateOSPackageNames` sanitizes each name with a regular expression and a metacharacter check before it reaches a command (`src/pkg/pkgmgr/pkgmgr.go:80-100`). The trust boundary is the scanner output, and Copa does not assume it is clean.

The distroless path inverts the usual mental model. Nothing runs inside the image being patched. The apt work happens in a separate tooling image, and the target only ever receives unpacked files. That is what makes patching a shell-less, package-manager-less image possible at all (`src/pkg/pkgmgr/dpkg.go:175-185`).

A report that produces zero applicable updates is not a failure. `patchSingleArchImage` returns `ErrNoUpdatesFound` when both OS and language updates are empty (`src/pkg/patch/single.go:149-153`), and `main` maps that error to exit code 0 (`src/main.go:58-61`), so a clean image does not break a pipeline.
