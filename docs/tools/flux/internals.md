# Internals

> Read from the source at commit `65d975b`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/flux/` | Cobra CLI; every subcommand including `bootstrap`, `create`, `get`, `reconcile`, `build`. |
| `pkg/bootstrap/` | Bootstrap orchestration: the `Reconciler` interface and its plain-git and provider implementations. |
| `pkg/bootstrap/provider/` | Git provider clients (GitHub, GitLab, Gitea, BitBucket) over go-git-providers. |
| `pkg/manifestgen/install/` | Generates `gotk-components.yaml`. |
| `pkg/manifestgen/sync/` | Generates `gotk-sync.yaml` (the self-referencing `GitRepository` and `Kustomization`). |
| `pkg/manifestgen/sourcesecret/` | Generates the Git or OCI auth secret. |
| `internal/build/` | Local `flux build kustomization` plus server-side diff. |
| `internal/{flags,tree,utils}` | CLI flag types, dependency-tree rendering, kube client and apply helpers. |
| `manifests/` | Versioned manifest material embedded into the binary. |

## Core data structures

`install.Options` (`pkg/manifestgen/install/options.go:21`) is the full input to an install: which components, the namespace (`flux-system`), the registry (`ghcr.io/fluxcd`), watch scope, NetworkPolicy, and the output `ManifestFile` (`gotk-components.yaml`). Defaults come from `MakeDefaultOptions` in the same file, which sets the four default components and three extras (`pkg/manifestgen/install/options.go:46`).

`sync.Options` (`pkg/manifestgen/sync/options.go`) describes the self-syncing pair: `Interval`, `URL`, `Branch`, `Tag`, `SemVer`, `Commit`, `Secret`, `TargetPath`, and `SparseCheckout`. Its defaults name everything `flux-system` (`pkg/manifestgen/sync/options.go:44`).

`sourcesecret.Options` describes the auth secret: SSH key algorithm, token auth, CA, and known_hosts. The GitHub bootstrap path chooses token auth or deploy key here (`cmd/flux/bootstrap_github.go:216`).

The `Reconciler` interface (`pkg/bootstrap/bootstrap.go:56`) is the contract the whole bootstrap turns on. It declares `ReconcileComponents`, `ReconcileSourceSecret`, `ReconcileSyncConfig`, and the `Report*Health` methods. `PlainGitBootstrapper` and `GitProviderBootstrapper` implement it, and `Run` uses type assertions to detect optional capabilities (`RepositoryReconciler`, `ReconcilerWithSyncCheck`) before calling them (`pkg/bootstrap/bootstrap.go:103`).

## A path worth tracing

Follow `ReconcileComponents` (`pkg/bootstrap/bootstrap_plain_git.go:119`), the heart of bootstrap.

It clones only if the working copy has no HEAD, and wraps the clone in a single retry with a 2-second backoff:

```go
b.logger.Actionf("cloning branch %q from Git repository %q", b.branch, b.url)
var cloned bool
if err = retry(1, 2*time.Second, func() (err error) {
    if err = b.cleanGitRepoDir(); err != nil {
        b.logger.Warningf(" failed to clean directory for git repo: %w", err)
        return
    }
    _, err = b.gitClient.Clone(ctx, b.url, repository.CloneConfig{ ... })
```

It generates the component manifests with `install.Generate` (`pkg/bootstrap/bootstrap_plain_git.go:155`), then commits them. The commit message is built from the version (`pkg/bootstrap/bootstrap_plain_git.go:168`), and the commit is allowed to be a no-op:

```go
commit, err := b.gitClient.Commit(git.Commit{
    Author:  b.signature,
    Message: commitMsg,
}, commitOpts...)
if err != nil && err != git.ErrNoStagedFiles {
    return fmt.Errorf("failed to commit component manifests: %w", err)
}
```

When the commit succeeded it pushes; when `git.ErrNoStagedFiles` came back it logs that components are up to date (`pkg/bootstrap/bootstrap_plain_git.go:193`). Only then does it consider an imperative apply, gated by `mustInstallManifests`:

```go
if mustInstallManifests(ctx, b.kube, options.Namespace) {
    b.logger.Actionf("installing components in %q namespace", options.Namespace)
    ...
    if _, err := utils.Apply(ctx, b.restClientGetter, b.restClientOptions, b.gitClient.Path(), componentsYAML); err != nil {
        return err
    }
}
```

`mustInstallManifests` (`pkg/bootstrap/bootstrap.go:140`) returns true when the `flux-system` Kustomization is missing or has an empty `Status.LastAppliedRevision`, which is exactly the first-run condition.

## Things that surprised me

The imperative `kubectl apply` only ever happens once. After the first run, `mustInstallManifests` returns false because the `flux-system` Kustomization has a non-empty `LastAppliedRevision` (`pkg/bootstrap/bootstrap.go:140`), and from then on the in-cluster `kustomize-controller` reconciles Flux's own components from Git. The CLI stops touching the cluster directly.

The CLI works offline. Versioned manifests are embedded with `//go:embed manifests/*.yaml` (`cmd/flux/manifests.embed.go:27`), so the install base is available without a network call. `install.Generate` keeps a fallback that fetches `manifests.tar.gz` from GitHub Releases when the base is missing (`pkg/manifestgen/install/manifests.go:37`).

Health checking normalizes revisions. `hasRevision` (`pkg/bootstrap/bootstrap.go:268`) compares the expected revision against `status.artifact.revision` for source objects and `status.lastAttemptedRevision` for the Kustomization, running both through legacy-revision transformation so an older revision format still matches.
