# Adoption & Ecosystem

## Who uses it

composefs has no `ADOPTERS` file in its repository, so there is no list of named end-user organisations to cite. Rather than invent any, the honest picture is integration-level: composefs is consumed as a backing format by other projects rather than deployed directly by named companies with public case studies. The projects that integrate it are listed below with sources.

| Project | Use case | Source |
| --- | --- | --- |
| bootc | Uses composefs as a backing store for bootable container host systems | [source 3](https://www.cncf.io/projects/composefs/) |
| OSTree (libostree) | Mounts a composefs image pointing into the OSTree object store instead of a hardlink checkout | [source 9](https://blogs.gnome.org/alexl/2022/06/02/using-composefs-in-ostree/), [source 11](https://github.com/ostreedev/ostree/issues/2867) |
| containers/storage | Overlay driver code that invokes `mkcomposefs` from podman and friends | [source 1](https://github.com/containers/composefs) |

## Adoption signals

Observed on 2026-06-26 via the GitHub REST API for `repos/containers/composefs` ([source 2](https://api.github.com/repos/containers/composefs)):

| Signal | Value |
| --- | --- |
| Stars | 661 |
| Forks | 55 |
| Watchers (subscribers) | 25 |
| Open issues | 30 |
| Repository created | 2021-10-07 |
| Top contributor | `alexlarsson` (609 commits) |

The CNCF project page reports different aggregate numbers from its own DevStats collection (stars 166, contributors 213, contributing organisations 96) because the counting basis differs from the raw GitHub API ([source 3](https://www.cncf.io/projects/composefs/)). composefs was accepted into the CNCF Sandbox on 2025-01-21 ([source 4](https://github.com/cncf/sandbox/issues/311)).

## Ecosystem

composefs sits on top of three Linux kernel features it does not own: overlayfs, EROFS, and fs-verity. Above it sit the consumers: bootc for bootable hosts, OSTree for content-addressed OS trees, and containers/storage for container layers ([source 1](https://github.com/containers/composefs), [source 3](https://www.cncf.io/projects/composefs/)). Language bindings extend its reach: `composefs-rs` provides Rust wrappers plus higher-level repository functionality, and containers/storage carries Go code wrapping `mkcomposefs` (`src/README.md:174-185`, [source 12](https://github.com/containers/composefs-rs)).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| tar + overlayfs (classic docker/podman layers) | Shares storage only at whole-layer granularity. composefs is content-addressed, so files shared across images with differing metadata dedup individually and share the page cache (`src/README.md:97-118`). |
| dm-verity over a disk image | Gives strong verification but duplicates storage, needs partition management, and is hard to update incrementally. composefs aims for comparable verification while keeping file-level flexibility (`src/README.md:20-33`). |
| Plain OSTree hardlink checkout | Cannot prevent tampering with the checkout directory at runtime. A composefs image plus fs-verity adds runtime verification (`src/README.md:120-140`). |
| squashfs or a plain EROFS image | Embeds file data in the image, so content cannot be shared or deduplicated across images. composefs separates metadata from data, which is the decisive difference. |
