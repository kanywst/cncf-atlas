# Adoption & Ecosystem

## Who uses it

The following organisations are listed in the project's own `ADOPTERS.md`, which records self-reported and publicly referenced use, with contacts. Each row is taken from that file.

| Organisation | Use case | Source |
| --- | --- | --- |
| Adobe | A Kubernetes fleet of over 18,000 nodes across multiple clouds and 22 of its own data-centre regions | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| 1&1 Mail & Media (GMX, WEB.DE, mail.com) | Base OS for on-prem bare-metal Kubernetes serving more than 40M users | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| DeepL | On-prem Kubernetes from CI/CD through GPU workloads | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| Equinix Metal | OS for the bare-metal cloud control plane | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| Finleap Connect | 12 production clusters, 300+ nodes in a regulated cloud-native stack | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| AT&T, Atsign, Digital Science, Genesis Cloud | Further documented adopters | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |

## Adoption signals

Implementation is spread across several repositories, so GitHub stars concentrate on the umbrella project rather than the build scripts. Observed 2026-06-24:

- [flatcar/Flatcar](https://github.com/flatcar/Flatcar) (umbrella: docs, governance, issues): about 1,197 stars, 27 contributors.
- [flatcar/scripts](https://github.com/flatcar/scripts) (the build implementation): about 84 stars, 94 forks, 228 contributors.
- CNCF accepted Flatcar at Incubating level in 2024, its first OS distribution at that level ([CNCF blog](https://www.cncf.io/blog/2024/10/29/flatcar-brings-container-linux-to-the-cncf-incubator/)).

## Ecosystem

Flatcar integrates with a cluster of cloud-native tools:

- **Ignition** for declarative first-boot configuration.
- **containerd** as the shipped runtime (with Docker available), composed as systemd-sysext (`src/build_image:42`).
- **systemd-sysext** for layering features onto the read-only `/usr`.
- **Cluster API** for automated Kubernetes node provisioning.
- **Nebraska**, an Omaha-protocol-compatible update server, for delivering image updates.

## Alternatives

All four below are container-optimised, immutable Linux distributions. The distinctions are about cloud scope, how locked-down the host is, and update philosophy ([HomeLab comparison](https://homelabstarter.com/homelab-immutable-os-comparison/), [DEV comparison](https://dev.to/matheus_releaserun/container-optimized-linux-distributions-compared-flatcar-bottlerocket-talos-and-fedora-coreos-4fj2)).

| Alternative | Differs by |
| --- | --- |
| Fedora CoreOS | Same CoreOS lineage but tracks Fedora and updates faster; upstream of RHCOS/OpenShift. Flatcar is more conservative to avoid disrupting running containers. |
| Bottlerocket (AWS) | EKS-focused, SSH disabled by default, signed kernel modules only. Strong if you are all-in on AWS; Flatcar spans multiple clouds and bare metal. |
| Talos (Sidero Labs) | Built from scratch with no shell or SSH and an API-only (`talosctl`) management model. The most locked-down, but a different operational style. Flatcar keeps SSH and Docker for easier debugging. |
