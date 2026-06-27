# Adoption & Ecosystem

## Who uses it

The repository maintains an `ADOPTERS.md` file split into direct adopters and indirect adopters via ostree. The table below lists only the direct adopters it records, each citing the website that file points to.

| Organisation | Use case | Source |
| --- | --- | --- |
| Red Hat | Image Based Linux; bootc is the path for new RHEL images | [ADOPTERS.md:10](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| HeliumOS | An atomic desktop operating system | [ADOPTERS.md:11](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| AlmaLinux (Atomic SIG) | Atomic desktop and workstation respins | [ADOPTERS.md:12](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| Caligra (Workbench) | An OS to accelerate knowledge work | [ADOPTERS.md:13](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| CIQ | Rocky Linux from CIQ, Image Based Linux variants | [ADOPTERS.md:14](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| Universal Blue (Aurora/Bazzite/Bluefin) | Reliable, flexible Linux desktop images | [ADOPTERS.md:15](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |

`ADOPTERS.md` also lists indirect adopters via ostree (Endless, Fedora Project atomic desktops, Apertis, Playtron GameOS, Fyra Labs) and notes that not every one of these uses bootc directly today; carrying these users forward is a stated goal of the project (`ADOPTERS.md:23-24`).

## Adoption signals

Measured from the repository on 2026-06-26: roughly 2,134 stars, 204 forks, and around 94 contributors. The latest release at the documented commit is v1.16.2, with the workspace version pinned to 1.16.2 (`crates/lib/Cargo.toml:9`). The project was accepted into the CNCF Sandbox on 2025-01-21 (CNCF project page). Releases are frequent; the README documents that the CLI and API are considered stable with an in-place upgrade guarantee (`README.md:22-23`).

## Ecosystem

- composefs: a sibling Red Hat project, proposed to the CNCF Sandbox in the same batch, used as a bootc backing store (`crates/lib/src/bootc_composefs/`).
- bootupd: the external bootloader manager that `bootc install` invokes to set up the bootloader (`docs/src/bootc-install.md`).
- Image builders: standard `Containerfile`/`Dockerfile` builds with `podman`, `buildah`, or `docker`, plus external installers such as Anaconda and bootc-image-builder (`docs/src/bootc-install.md`).
- ostree and rpm-ostree: the predecessors bootc is designed to succeed.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| rpm-ostree | Hybrid image-plus-package model that layers RPMs on a base commit; bootc treats the whole OS as one OCI image and is positioned as its successor. |
| ostree (libostree) | The lower-level versioned-filesystem engine bootc still builds on; bootc adds the OCI-native, declarative interface on top. |
| Package managers (apt/dnf, transactional-update/snapper) | Per-package upgrades on a mutable root; bootc replaces the entire `/usr` atomically from a registry image with a rollback slot. |
| NixOS | Also image-like and atomic, but uses its own store and language; bootc prioritises compatibility with the existing OCI/Docker ecosystem. |

Choose bootc when you already ship containers and want the host OS in the same pipeline with registry-tag-driven updates. Choose a traditional package manager when you need to mutate the running system package by package, or NixOS when you want its declarative store model over OCI compatibility.

## Sources

1. [bootc ADOPTERS.md at commit a7f95e7](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md)
2. [bootc CNCF project page](https://www.cncf.io/projects/bootc/)
3. [coreos/rpm-ostree](https://github.com/coreos/rpm-ostree/)
4. [bootc-dev/bootc repository](https://github.com/bootc-dev/bootc)
