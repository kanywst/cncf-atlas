# Internals

> Read from the source at commit `be1faef` (v0.60.3). Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/controller` | Process entrypoint, flag parsing, reconciler wiring, sidecar mode. |
| `pkg/app` | The `App` reconciler and the fetch/template/deploy pipeline. |
| `pkg/fetch`, `pkg/template`, `pkg/deploy` | Per-stage implementations that wrap the Carvel command-line tools. |
| `pkg/sidecarexec` | The sidecar RPC (remote procedure call) server and client that run external tools. |
| `pkg/apiserver` | The aggregated API server that serves `Package` and `PackageMetadata`. |
| `pkg/packageinstall`, `pkg/pkgrepository` | Reconcilers for `PackageInstall` and `PackageRepository`. |
| `pkg/apis` | The custom resource type definitions. |

## Core data structures

- **`App` / `AppSpec`** (`pkg/apis/kappctrl/v1alpha1/types.go:24` and `pkg/apis/kappctrl/v1alpha1/types.go:48`). The spec carries the three pipeline stages, `Fetch` (`pkg/apis/kappctrl/v1alpha1/types.go:58`), `Template` (`pkg/apis/kappctrl/v1alpha1/types.go:60`), and `Deploy` (`pkg/apis/kappctrl/v1alpha1/types.go:62`). `ServiceAccountName` (`pkg/apis/kappctrl/v1alpha1/types.go:52`) scopes the permissions used to deploy.
- **`PackageInstall` / `PackageInstallSpec`** (`pkg/apis/packaging/v1alpha1/package_install.go:24` and `pkg/apis/packaging/v1alpha1/package_install.go:47`). The `PackageRef` field (`pkg/apis/packaging/v1alpha1/package_install.go:57`) points at a package by name, and its `VersionSelection` carries a semantic-version constraint (`pkg/apis/packaging/v1alpha1/package_install.go:89`). A `PackageInstall` is the high-level abstraction that resolves to a generated `App`.
- **`PackageRepository` / `PackageRepositorySpec`** (`pkg/apis/packaging/v1alpha1/package_repository.go:20` and `pkg/apis/packaging/v1alpha1/package_repository.go:41`). Its `Fetch` field (`pkg/apis/packaging/v1alpha1/package_repository.go:50`) names an imgpkg bundle whose contents become available as packages.
- **`Package` / `PackageMetadata`** (`pkg/apiserver/apis/datapackaging/types.go:30` and `pkg/apiserver/apis/datapackaging/types.go:16`). These are not CRDs; they are the read-oriented views served by the aggregated API server.

## A path worth tracing

The interesting question is how an external tool actually runs, because the answer is not "the controller calls `exec`". Start at the deploy stage. `App.deploy` requires exactly one deploy entry and calls `kapp.Deploy` (`pkg/app/app_deploy.go:38`). `Kapp.Deploy` builds the argument list (`pkg/deploy/kapp.go:66`), constructs the command (`pkg/deploy/kapp.go:73`), and runs it through a `cmdRunner` (`pkg/deploy/kapp.go:79`):

```text
goexec.Command("kapp", args...)
...
err = a.cmdRunner.RunWithCancel(cmd, a.cancelCh)
```

That `cmdRunner` is not a plain executor. In `Run` the controller builds a sidecar client (`cmd/controller/run.go:153`) and passes its `CmdExec()` into the app factory (`cmd/controller/run.go:158`). So every tool invocation goes through `CmdExecClient`. Its `Run` method inspects the command name and, only for `kapp`, executes locally instead of over RPC (`pkg/sidecarexec/cmd_exec_client.go:38`):

```text
if cmdName == "kapp" {
    return r.local.Run(cmd)
}
```

`RunWithCancel`, the method the deploy path uses, has the same special case: `kapp` runs locally and anything else panics, because cancelable execution is not offered over the RPC channel (`pkg/sidecarexec/cmd_exec_client.go:81`). Fetch and template tools take the RPC path instead. On the server side, every requested command is checked against an allowlist before it runs (`pkg/sidecarexec/cmd_exec.go:40`):

```text
if _, found := r.allowedCmdNames[input.Command]; !found {
    return fmt.Errorf("Command '%s' is not allowed", input.Command)
}
```

The allowlist is populated when the sidecar starts (`cmd/controller/sidecarexec.go:20`):

```text
AllowedCmdNames: []string{
    // Fetch (calls impgkg and others internally)
    "vendir",
    // Template
    "ytt", "kbld", "sops", "helm", "cue",
},
```

`vendir` covers fetch; `ytt`, `kbld`, `sops`, `helm`, and `cue` cover template. The server turns that slice into a set in `NewServer` (`pkg/sidecarexec/server.go:35`). Notice what is absent: `kapp` is not in the allowlist, which is consistent with the deploy tool running locally rather than through the sidecar.

## Things that surprised me

- **`kapp` deliberately breaks the sidecar pattern.** The package documentation frames the sidecar as a security boundary that isolates binary execution (`pkg/sidecarexec/client.go:4`), yet the deploy tool runs in the main process (`pkg/sidecarexec/cmd_exec_client.go:38`). The reason is mechanical: `kapp` is a long-running, cancelable command, and `RunWithCancel` over RPC panics by design (`pkg/sidecarexec/cmd_exec_client.go:85`). Fetch and template are short and fit the request/response RPC; deploy does not.
- **Fetch retries silently for private registries.** When a fetch fails and the `App` references an image or imgpkg bundle, `vendir` is retried up to three times with a two-second sleep, to give the secretgen-controller time to populate placeholder pull secrets (`pkg/app/app_fetch.go:54`). This is invisible from the resource spec and only apparent in the code.
- **A typo is shipped in the allowlist comment.** The fetch comment reads "calls impgkg and others internally" (`cmd/controller/sidecarexec.go:21`), a transposition of "imgpkg". Harmless, but a reminder that the snippet here is verbatim from source.
- **The first config reconcile is synchronous on purpose.** Most reconcilers are wired into the manager and run asynchronously, but the config reconciler is also invoked once directly during startup (`cmd/controller/run.go:184`) so proxy and certificate-authority settings reach the sidecar before any tool executes.
