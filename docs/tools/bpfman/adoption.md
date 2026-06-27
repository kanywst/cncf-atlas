# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md` or `USERS.md` file, and no primary source names an organisation running bpfman in production. This deep-dive will not invent adopters. What can be cited is the project's vendor backing and its standing in the CNCF.

All listed maintainers work at Red Hat (`MAINTAINERS.md`: Dave Tucker, Andrew McDermott, Andre Fredette, Billy McFall, with Andrew Stoycos emeritus). Red Hat originated the project in its Emerging Technologies group (source: [Red Hat Emerging Technologies](https://next.redhat.com/project/bpfman/)). Treat bpfman as a single-vendor Sandbox project until an ADOPTERS file or case study appears.

## Adoption signals

| Signal | Value | Observed |
| --- | --- | --- |
| GitHub stars | ~750 | 2026-06-27 |
| Forks | ~84 | 2026-06-27 |
| Open issues | ~23 | 2026-06-27 |
| Latest release | v0.6.0 (2026-03-31) | 2026-06-27 |
| Repo created | 2021-12-02 | 2026-06-27 |
| CNCF maturity | Sandbox (accepted 2024-06-19) | 2026-06-27 |

Source for the GitHub numbers: [bpfman/bpfman](https://github.com/bpfman/bpfman). The CNCF project page lists higher contributor and organisation counts, but those aggregate related repositories such as the operator and should not be read as bpfman core contributors (source: [CNCF project page](https://www.cncf.io/projects/bpfman/)). There is an in-progress proposal to ship bpfman as the default eBPF program manager in Fedora (source: [Fedora 40 write-up](https://www.ebpf.top/en/post/bpfman_fedora_40/)).

## Ecosystem

bpfman sits below the eBPF applications, as a manager rather than an application. It is built on `aya`, the Rust eBPF library. On Kubernetes it is driven by a separate operator and agent through Custom Resource Definitions (CRDs). It distributes bytecode as OCI (Open Container Initiative) images from any registry, integrates with systemd through socket activation for privilege separation, mounts maps into pods through its CSI (Container Storage Interface) driver, and exports logs and metrics to OpenTelemetry. It is frequently listed alongside other Kubernetes eBPF projects, though no primary source confirms those projects load their programs through bpfman (source: [eBPF Applications Landscape](https://ebpf.io/applications/)).

## Alternatives

The honest comparison is that bpfman is a use-neutral program manager, while most named eBPF projects are applications that manage their own programs. Pick bpfman when you need to run many independent eBPF programs on one node, especially several on a single XDP or TC hook, without privileged workloads. Pick an application like Cilium or Falco when you want that specific capability and are happy for it to own its own eBPF programs.

| Alternative | Differs by |
| --- | --- |
| bpftool / libbpf | Standard low-level eBPF tooling; no managed multi-program dispatcher for a shared XDP or TC hook, no restart-recovery database |
| Cilium | A networking and security application that ships and manages its own eBPF programs, not a neutral loader for arbitrary programs |
| Falco | A runtime security tool that owns its own eBPF probes rather than managing third-party programs |
| aya | The Rust eBPF library bpfman is built on; a toolkit for writing and loading programs, not a node-level lifecycle manager |
