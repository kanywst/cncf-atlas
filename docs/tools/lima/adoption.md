# Adoption & Ecosystem

## Who uses it

The README lists adopters that embed Lima as their VM engine. These are the citable adopters; each is a tool rather than an end-user organisation, and each links from the README Adopters section.

| Project | Use case | Source |
| --- | --- | --- |
| Rancher Desktop | Kubernetes and container management on the desktop, using Lima as the VM engine | [rancherdesktop.io](https://rancherdesktop.io/) |
| Colima | Docker and Kubernetes on macOS/Linux with minimal setup, built on Lima | [github.com/abiosoft/colima](https://github.com/abiosoft/colima) |
| Finch | AWS command-line client for local container development | [github.com/runfinch/finch](https://github.com/runfinch/finch) |
| Podman Desktop | Podman Desktop GUI ships a plug-in for Lima virtual machines | [podman-desktop.io](https://podman-desktop.io/) |

Named end-user organisations are not established in the dossier. The maintainers opened discussion #2390 to gather user stories for CNCF due diligence.

## Adoption signals

Measured via the GitHub REST API on 2026-06-24:

- Stars: 21,323
- Forks: 908
- Contributors: about 215
- Latest release: v2.1.3 (2026-06-19); v2.0 shipped 2025-11-06 and v2.1 followed in early 2026, so releases land on a steady cadence.

Lima reached CNCF Incubating on 2025-10-14, which itself is a maturity signal.

## Ecosystem

The adapter tools above (Rancher Desktop, Colima, Finch, Podman Desktop) embed Lima as their VM engine. Lima ships templates for Ubuntu, Debian, Fedora, Alpine, and other distributions under `templates/`. Wrapper binaries (`nerdctl.lima`, `docker.lima`, `kubectl.lima`, `podman.lima`) let host commands drive the guest directly, and `limactl-mcp` exposes an MCP interface.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Colima | A thin, opinionated CLI over Lima preset for Docker/containerd. Lima itself gives finer YAML control and suits non-Ubuntu distros and reproducible dev VMs. |
| Multipass (Canonical) | Fast launcher for Ubuntu cloud images; host mounts use 9p, while Lima's virtiofs is faster for I/O. |
| Docker Desktop | Commercial, GUI-heavy, with bundled features and licensing terms. Lima is headless, lightweight, and Apache-2.0. |
| OrbStack | macOS-only commercial product, fast with a polished UI. Lima is open source and cross-host. |
| UTM / QEMU / VirtualBox | General-purpose VM tools. Lima adds developer-oriented automatic mounts, port forwarding, and templates on top. |

## Sources

1. [lima-vm/lima README](https://github.com/lima-vm/lima) (Adopters), accessed 2026-06-24.
2. [Rancher Desktop](https://rancherdesktop.io/), accessed 2026-06-24.
3. [Colima](https://github.com/abiosoft/colima), accessed 2026-06-24.
4. [Finch](https://github.com/runfinch/finch), accessed 2026-06-24.
5. [Podman Desktop](https://podman-desktop.io/), accessed 2026-06-24.
6. [Discussion #2390: user stories for CNCF due diligence](https://github.com/lima-vm/lima/discussions/2390), accessed 2026-06-24.
7. [GitHub REST API: repos/lima-vm/lima](https://api.github.com/repos/lima-vm/lima), accessed 2026-06-24.
8. [Lima vs Colima vs Multipass vs Docker Desktop](https://sumguy.com/lima-vs-multipass/), accessed 2026-06-24.
