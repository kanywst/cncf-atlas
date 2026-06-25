# Internals

> Read from the source at commit `c7f6cde`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/operator-sdk` | Binary entry point; `main.go` calls `cli.Run()`. |
| `internal/cmd/operator-sdk/cli` | CLI assembly: plugin bundles and extra commands (`cli.go:50-148`). |
| `internal/cmd/operator-sdk/run/bundle` | The `run bundle` command definition (`cmd.go:27-65`). |
| `internal/olm/operator` | Shared kube client config (`config.go`) and the OLM install/cleanup logic. |
| `internal/olm/operator/bundle` | `Install` orchestrator for `run bundle` (`install.go`). |
| `internal/olm/operator/registry` | Catalog creation and the OperatorInstaller state machine (`operator_installer.go`, `index_image.go`). |
| `internal/plugins/helm` | In-tree helm v1 kubebuilder plugin. |

## Core data structures

- `Install` (`internal/olm/operator/bundle/install.go:33-40`): the `run bundle` orchestrator. It holds `BundleImage` and embeds `*registry.IndexImageCatalogCreator` and `*registry.OperatorInstaller`, composing catalog creation and OLM install into one type.
- `OperatorInstaller` (`internal/olm/operator/registry/operator_installer.go:38-49`): the OLM-injection state. Fields include `CatalogSourceName`, `PackageName`, `StartingCSV`, `Channel`, `InstallMode`, `CatalogCreator`, `CatalogUpdater`, and `SupportedInstallModes`.
- `IndexImageCatalogCreator` (`internal/olm/operator/registry/index_image.go:93-111`): configures how a bundle is injected into an index image (`FBCContent`, `IndexImage`, `BundleImage`, `BundleAddMode`, `SecurityContext`, and more). It implements both the `CatalogCreator` and `CatalogUpdater` interfaces (`index_image.go:113-114`).
- `operator.Configuration` (`internal/olm/operator/config.go:32-42`): the kube client bundle shared by every OLM command, with `Namespace`, `RESTConfig`, a controller-runtime `Client`, `Scheme`, and `Timeout`.
- OLM CRD types come from the external `operator-framework/api v0.34.0` (`go.mod:17`): `v1alpha1.ClusterServiceVersion`, `Subscription`, `InstallPlan`, `CatalogSource`, and `v1.OperatorGroup`. The SDK creates and approves these; OLM does the reconcile.

## A path worth tracing

Follow `operator-sdk run bundle` from setup into the OLM writes. After `setup` loads the bundle and resolves package metadata (`install.go:73-150`), `OperatorInstaller.InstallOperator` performs the cluster mutations in order (`operator_installer.go:55-102`):

```text
InstallOperator (operator_installer.go:55)
  CatalogCreator.CreateCatalog       -> CatalogSource          (:56)
  ensureOperatorGroup                -> OperatorGroup          (:73)
  createSubscription                 -> Subscription (Manual)  (:79)
  waitForInstallPlan                 -> wait for InstallPlan   (:84)
  approveInstallPlan                 -> set Spec.Approved=true (:89)
  getInstalledCSV                    -> wait for CSV ready     (:94)
```

The subscription is created with manual approval (`operator_installer.go:281-285`):

```go
sub := newSubscription(o.StartingCSV, o.cfg.Namespace,
    withPackageChannel(o.PackageName, o.Channel, o.StartingCSV),
    withCatalogSource(csName, o.cfg.Namespace),
    withInstallPlanApproval(v1alpha1.ApprovalManual))
```

The CLI then approves the plan itself under conflict retry (`operator_installer.go:319-339`):

```go
if err := retry.RetryOnConflict(retry.DefaultBackoff, func() error {
    if err := o.cfg.Client.Get(ctx, ipKey, &ip); err != nil {
        return fmt.Errorf("error getting install plan: %v", err)
    }
    ip.Spec.Approved = true
    return o.cfg.Client.Update(ctx, &ip)
}); err != nil {
    return err
}
```

## Things that surprised me

The catalog format branch in `setup` is load-bearing. `fbcutil.IsFBC` (`install.go:98`) decides whether the index is a File-Based Catalog or SQLite. FBC generates declarative config content via `generateFBCContent` (`install.go:105-131`); SQLite still works but emits a deprecation warning telling you to migrate (`install.go:135`).

The manual-approval-then-self-approve dance is the subtle part. The subscription deliberately requests manual install-plan approval, then the same CLI run approves the generated plan. A reader expecting `run bundle` to create an automatic subscription would miss that the approval is an explicit second step the CLI performs on the user's behalf.

There is a known upstream gap baked into the code. The global `--verbose` flag is attached to the root command after kubebuilder builds the CLI (`cli.go:140-148`), with a `TODO(estroz): upstream PR for global --verbose` comment marking it as a local patch for a change not yet merged into kubebuilder.

## Sources

1. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
2. operator-framework/api (OLM CRD types): <https://github.com/operator-framework/api>
