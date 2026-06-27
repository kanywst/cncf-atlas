# History

## Origin

bootc is the top layer of a roughly fifteen-year lineage of work led by Colin Walters at Red Hat. The thread starts with OSTree (2011), a system for version-controlled, atomically updated bootable filesystem trees, managed Git-style as a library (libostree) plus a CLI. On top of libostree sits rpm-ostree, which adds a hybrid image-plus-package model: a base commit with RPMs layered on it, used to drive Fedora CoreOS, Silverblue, and IoT (LWN, [Article 979182](https://lwn.net/Articles/979182/)).

The step that made bootc possible was teaching ostree to treat OCI/Docker images as a transport for an ostree commit. Fedora declared this "ostree native containers" feature stable and introduced bootc as the new, purpose-built interface, with the stated plan of moving Fedora editions to OCI delivery (Fedora Project Wiki, [Changes/OstreeNativeContainerStable](https://fedoraproject.org/wiki/Changes/OstreeNativeContainerStable)). bootc's pitch is to make creating an OS image as easy as creating an application container, with the same tools.

## Timeline

| Year | Milestone |
| --- | --- |
| 2011 | OSTree project begins; the underlying technology bootc still uses today. |
| 2022 | The bootc repository is created (GitHub repository createdAt 2022-11-30). |
| 2024 | DevConf.cz keynote on bootable containers; the project lives under `containers/bootc`. |
| 2025 | Accepted into the CNCF Sandbox on 2025-01-21; RHEL 10 ships bootc as the path for new images. |
| 2026 | Active releases continue; latest tag at the documented commit is v1.16.2. |

## How it evolved

The project moved from a research feature inside rpm-ostree to a standalone CLI and library. The README marks the current state: the CLI and API are considered stable, with a commitment that every existing system can be upgraded in place across future changes (`README.md:22-23`). Versioning follows semantic versioning, a practice the project dates from the 1.2.0 release (`README.md:33-37`).

A second evolution is the storage backend. The original backend is the ostree-container store. The codebase now carries a parallel composefs backend under `crates/lib/src/bootc_composefs/`, and the runtime dispatches between the two at the top of each operation. composefs is a separate Red Hat project that was proposed to the CNCF Sandbox in the same batch as bootc.

When the project joined the CNCF, it moved from the `containers` GitHub organisation to a dedicated `bootc-dev` organisation; the crate manifests still point `repository` at `https://github.com/bootc-dev/bootc` (`crates/lib/Cargo.toml:6`).

## Where it stands now

bootc is a CNCF Sandbox project (accepted 2025-01-21) maintained primarily by Red Hat engineers, with governance and maintainer files in the repository (`GOVERNANCE.md`, `MAINTAINERS.md`). The crate pins edition 2024 and a minimum Rust of 1.85.0, kept close to what ships in the latest RHEL 9 (`crates/lib/Cargo.toml:3,10-11`). The stated direction is to be the successor to ostree and to seamlessly carry forward its existing users (`ADOPTERS.md:23-24`).

## Sources

1. [Making containers bootable for fun and profit (LWN)](https://lwn.net/Articles/979182/)
2. [Changes/OstreeNativeContainerStable (Fedora Project Wiki)](https://fedoraproject.org/wiki/Changes/OstreeNativeContainerStable)
3. [bootc CNCF project page](https://www.cncf.io/projects/bootc/)
4. [bootc source at commit a7f95e7](https://github.com/bootc-dev/bootc/tree/a7f95e743aa54a2f966edc1a0417ef6d509df9af)
