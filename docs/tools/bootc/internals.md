# Internals

> Read from the source at commit `a7f95e7`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `crates/cli/src/main.rs` | Process global init, builds the Tokio runtime, calls into the library. |
| `crates/lib/src/cli.rs` | `Opt` enum (the CLI surface), argument parsing, and `upgrade`/`switch`/`rollback` handlers. |
| `crates/lib/src/spec.rs` | The declarative host model: `Host`, `HostSpec`, `HostStatus`, `BootEntry`. |
| `crates/lib/src/deploy.rs` | `pull`, `stage`, and `deploy`: fetch an image and queue a new deployment. |
| `crates/lib/src/install.rs` | `install_to_disk`, `install_to_filesystem`, `install_to_existing_root`. |
| `crates/lib/src/bootc_composefs/` | The composefs storage backend (boot, update, switch, rollback). |
| `crates/ostree-ext/` | OCI to ostree commit import/export and `ManifestDiff`. |

## Core data structures

The whole system turns on the host model in `crates/lib/src/spec.rs`. It is deliberately Kubernetes-shaped.

`Host` (`crates/lib/src/spec.rs:26`) is the single top-level object. It flattens a k8s `Resource` for apiVersion/kind/metadata and splits user intent from observed state:

```rust
pub struct Host {
    /// Metadata
    #[serde(flatten)]
    pub resource: k8sapitypes::Resource,
    /// The spec
    #[serde(default)]
    pub spec: HostSpec,
    /// The status
    #[serde(default)]
    pub status: HostStatus,
}
```

The constants above the struct fix the API identity: `API_VERSION = "org.containers.bootc/v1"` and `KIND = "BootcHost"` (`crates/lib/src/spec.rs:18-19`), and there is exactly one object, named `host` (`crates/lib/src/spec.rs:21`).

`HostSpec` (`crates/lib/src/spec.rs:65`) is the intent: an optional target `image` and a `boot_order` (`crates/lib/src/spec.rs:67,70`). `BootOrder` (`crates/lib/src/spec.rs:42`) is just `Default` or `Rollback`, which is how a rollback is requested declaratively. The target image is an `ImageReference` (`crates/lib/src/spec.rs:88`) carrying `image`, `transport`, and an optional `signature` (`crates/lib/src/spec.rs:90-95`); `ImageSignature` (`crates/lib/src/spec.rs:76`) selects ostree-remote, container-policy, or insecure verification.

`HostStatus` (`crates/lib/src/spec.rs:432`) is the observed A/B-plus-rollback state: `staged`, `booted`, `rollback`, `other_deployments`, and `rollback_queued` (`crates/lib/src/spec.rs:434-445`). Each slot is a `BootEntry` (`crates/lib/src/spec.rs:317`), which records the per-deployment observed state: `image`, `cached_update`, `incompatible`, `pinned`, `soft_reboot_capable`, `download_only`, and `store` (`crates/lib/src/spec.rs:319-335`).

## A path worth tracing

Follow an upgrade from the CLI dispatch down to the deployment being staged.

`run_from_opt` matches the subcommand and chooses the backend:

```rust
        Opt::Upgrade(opts) => {
            let storage = &get_storage().await?;
            match storage.kind()? {
                BootedStorageKind::Ostree(booted_ostree) => {
                    upgrade(opts, storage, &booted_ostree).await
                }
                BootedStorageKind::Composefs(booted_cfs) => {
                    upgrade_composefs(opts, storage, &booted_cfs).await
                }
            }
        }
```

That block is at `crates/lib/src/cli.rs:1771-1780`. The ostree path enters `upgrade` (`crates/lib/src/cli.rs:1154`), which reads the current `Host`, fetches, compares digests, and on a real change calls `crate::deploy::stage` (`crates/lib/src/cli.rs:1329`).

The actual fetch is `pull` (`crates/lib/src/deploy.rs:773`). It calls `prepare_for_pull` and short-circuits if the image is already present, otherwise checks disk space and pulls:

```rust
    match prepare_for_pull(repo, imgref, target_imgref, booted_deployment).await? {
        PreparedPullResult::AlreadyPresent(existing) => {
```

That match is at `crates/lib/src/deploy.rs:781-782`; the `Ready` arm calls `check_disk_space_ostree` then `pull_from_prepared` (`crates/lib/src/deploy.rs:797,808`).

`stage` (`crates/lib/src/deploy.rs:1012`) wraps the work in a three-step progress report (`steps_total: 3` at `crates/lib/src/deploy.rs:1046`), builds the origin KeyFile with `origin_from_imageref`, calls `deploy`, and finally pulls bound images:

```rust
    let origin = origin_from_imageref(spec.image)?;
    let deployment =
        crate::deploy::deploy(sysroot, from, image, &origin, lock_finalization).await?;
```

That is `crates/lib/src/deploy.rs:1075-1077`; `pull_bound_images` follows at `crates/lib/src/deploy.rs:1099`. `deploy` (`crates/lib/src/deploy.rs:899`) computes kernel arguments from the merge deployment via `bootc_kargs::get_kargs` (`crates/lib/src/deploy.rs:912`) and stages the new tree on a worker thread with `ostree.stage_tree_with_options(...)` (`crates/lib/src/deploy.rs:948`), returning the staged deployment (`crates/lib/src/deploy.rs:962`).

## Things that surprised me

The most interesting code in `deploy` is a workaround for a foreign-function-interface (FFI) quirk. The libostree types `ostree::Deployment` and `glib::KeyFile` are marked `!Send`, so they cannot be moved into the `spawn_blocking` worker thread. Rather than fight the type, `deploy` lowers them to plain data before the move:

```rust
    // Clone all the things to move to worker thread
    let ostree = sysroot.get_ostree_cloned()?;
    // ostree::Deployment is incorrectly !Send 😢 so convert it to an integer
    let merge_deployment = from.as_merge_deployment();
    let merge_deployment = merge_deployment.map(|d| d.index() as usize);
    let ostree_commit = image.ostree_commit.to_string();
    // GKeyFile also isn't Send! So we serialize that as a string...
    let origin_data = origin.to_data();
```

That is `crates/lib/src/deploy.rs:917-924`. The deployment becomes a `usize` index and the KeyFile becomes a string. Inside the worker thread the code rehydrates them: it re-indexes the deployment list with `merge_deployment.map(|m| &deployments[m])` (`crates/lib/src/deploy.rs:945`) and reloads the origin with `origin.load_from_data(&origin_data, glib::KeyFileFlags::NONE)?` (`crates/lib/src/deploy.rs:947`). It is a small, pragmatic answer to a real safety constraint that the FFI bindings get wrong.

A second non-obvious detail is argv0 dispatch. `Opt::parse_including_static` checks the program name and, if invoked as `ostree-container`, `ostree-ima-sign`, or `ostree-provisional-repair`, rewrites the arguments to route into `internals ostree-ext` (`crates/lib/src/cli.rs:1750-1751`). One binary serves several historical entry points.

## Sources

1. [bootc source at commit a7f95e7](https://github.com/bootc-dev/bootc/tree/a7f95e743aa54a2f966edc1a0417ef6d509df9af)
