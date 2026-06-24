# Internals

> Read from the source at commit `74fa4fce`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/helm/helm.go` | Thin `main`: set the managed-fields name and run the root command. |
| `pkg/cmd` | Cobra command layer; flag parsing and chart/value resolution. |
| `pkg/action` | Business logic per subcommand and the shared `Configuration`. |
| `pkg/engine` | Go `text/template` chart renderer. |
| `pkg/chart` | Chart data model (v2) plus `internal/chart/v3`. |
| `pkg/storage`, `pkg/storage/driver` | Release persistence; secret/configmap/memory/sql drivers. |
| `pkg/kube` | Kubernetes client wrapper (build, create, update, wait). |
| `pkg/registry`, `pkg/getter`, `pkg/downloader`, `pkg/repo`, `pkg/pusher` | Chart fetch and publish, including OCI. |
| `pkg/provenance` | OpenPGP signing and verification. |

## Core data structures

`Release` is one deployment of a chart (`pkg/release/v1/release.go:30`). It holds `Name`, `Info`, `Chart`, `Config` (the override values), `Manifest` (the rendered YAML), `Hooks`, `Version` (the revision), `Namespace`, and `ApplyMethod` (`"ssa"` or `"csa"`). Rollback walks these revisions.

`Chart` is the package model (`pkg/chart/v2/chart.go:38`): `Metadata` (from Chart.yaml), `Lock`, `Templates`, `Values` (the defaults), `Schema` (an optional JSON Schema), and `Files`. Private `parent` and `dependencies` fields make subcharts a tree.

`Driver` abstracts where releases are stored (`pkg/storage/driver/driver.go:99`). It composes `Creator`, `Updator`, `Deletor`, `Queryor`, and `Name()`; the secret, configmap, memory, and sql backends each implement it.

`Configuration` is the action-layer shared context (`pkg/action/action.go`): `KubeClient`, `Releases` storage, `Capabilities`, `RESTClientGetter`, and `CustomTemplateFuncs`. `getStorage` reads `HELM_DRIVER` and constructs the driver (`pkg/action/action.go:675`).

`renderable` is the engine's internal unit (`pkg/engine/engine.go:137`): the template string `tpl`, its `vals`, and a `basePath` namespace prefix.

## A path worth tracing

`helm install` runs through `Install.RunWithContext` (`pkg/action/install.go:284`). The interesting part is the ordering: Helm renders, builds objects, and checks for conflicts before it writes anything, then saves the release to storage before it touches the cluster.

```text
runInstall (pkg/cmd/install.go:159)
  -> Install.RunWithContext (pkg/action/install.go:284)
       IsReachable                      install.go:296
       availableName                    install.go:308
       ProcessDependencies              install.go:313
       getCapabilities                  install.go:352
       ToRenderValuesWithSchemaValidation install.go:366
       createRelease (Revision=1)       install.go:375
       renderResources                  install.go:378 -> action.go:279
       KubeClient.Build                 install.go:394
       existingResourceConflict         install.go:415
       (dry-run returns)                install.go:423
       Releases.Create                  install.go:465
       performInstallCtx                install.go:472
```

`renderResources` checks the chart's `KubeVersion` constraint against the cluster, then renders. When it talks to a real cluster it builds an engine with `engine.New(restConfig)`; otherwise it uses a plain `engine.Engine` (`pkg/action/action.go:300`, `pkg/action/action.go:305`, `pkg/action/action.go:311`). Both call `e.RenderWithContext(ctx, ch, values)` (`pkg/action/action.go:309`, `pkg/action/action.go:315`). After rendering it pulls `NOTES.txt` out of the file map into a separate buffer so it is not treated as a manifest (`pkg/action/action.go:329`).

## Things that surprised me

The engine re-injects the `missingkey` option on every cloned template, choosing `missingkey=error` in strict mode and `missingkey=zero` otherwise (`pkg/engine/engine.go:189`). The comment points at [golang/go#43022](https://github.com/golang/go/issues/43022): the option fields on a `text/template` are private, so a clone loses the setting and it has to be set again by hand.

Install does an extra existence check that upgrade does not. Before creating anything, it calls `existingResourceConflict` and refuses to proceed if a rendered resource already exists, unless `--take-ownership` switches it to `requireAdoption` (`pkg/action/install.go:412`, `pkg/action/install.go:415`). The reasoning is in the code: if Helm adopted pre-existing resources into a new release, uninstalling that release would delete resources Helm never created.

Release state is not stored as plain YAML. `encodeRelease` JSON-marshals the release, gzips it at `gzip.BestCompression`, and base64-encodes the result (`pkg/storage/driver/util.go:38`), which is then stored in a Secret of type `helm.sh/release.v1` (`pkg/storage/driver/secrets.go:284`).
