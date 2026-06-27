# bpfman

> An eBPF (extended Berkeley Packet Filter) program manager that loads, attaches, and tracks eBPF programs on a node so applications do not need privileged access to the kernel.

- **Category**: Runtime
- **CNCF maturity**: Sandbox
- **Language**: Rust (with some Go for Kubernetes integration)
- **License**: Apache-2.0 (the embedded eBPF dispatcher bytecode is GPL-2.0-only or BSD-2-Clause)
- **Repository**: [bpfman/bpfman](https://github.com/bpfman/bpfman)
- **Documented at commit**: `8e5a9d2` (close to tag v0.6.0, 2026-04-21)

## What it is

bpfman manages the lifecycle of eBPF programs on a Linux host. eBPF lets you run sandboxed programs inside the kernel at hooks such as XDP (eXpress Data Path), TC (Traffic Control), kprobes, and tracepoints. Normally each application loads its own eBPF programs with elevated privilege and owns whatever hook it attaches to. bpfman makes that a managed operation: it loads bytecode, attaches it to a hook, and records the result so the state survives restarts.

Two capabilities define it. First, it lets several independent eBPF programs share a single XDP or TC hook through a dispatcher, which the kernel otherwise limits to one program per interface. Second, it persists every load and attach in an embedded database so that programs and their pins can be recovered after a crash or reboot.

bpfman is a management layer, not an eBPF application. It does not replace Cilium, Falco, or libbpf. It loads and unloads the programs those toolchains produce, distributed as Open Container Initiative (OCI) images, and keeps them coexisting safely on one node.

## When to use it

- You need multiple XDP or TC programs from different vendors on the same network interface.
- You want to load eBPF programs into a Kubernetes cluster without granting workloads privileged or CAP_BPF access.
- You want eBPF state (loaded programs, attachments, map pins) to survive process restarts and reboots.
- You distribute eBPF bytecode as OCI images and want a manager that pulls and loads them.

It is not the right tool if you only ship a single self-contained eBPF application that owns its own hook (Cilium and Falco already manage their own programs), or if you are not on Linux.

## In this deep-dive

- [History](./history): origin as bpfd, the rename, and the daemonless turn.
- [Architecture](./architecture): the workspace crates and how a load flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [bpfman/bpfman (GitHub, source of truth)](https://github.com/bpfman/bpfman)
2. [bpfman (CNCF project page)](https://www.cncf.io/projects/bpfman/)
3. [\[Sandbox\] bpfman application (cncf/sandbox issue #76)](https://github.com/cncf/sandbox/issues/76)
4. [Launching bpfman (install / load / attach)](https://bpfman.io/v0.6.0/getting-started/launching-bpfman/)
5. [bpfman documentation home](https://bpfman.io/main/)
6. [eBPF wrapped 2023 (Red Hat)](https://www.redhat.com/en/blog/ebpf-wrapped-2023)
7. [bpfman blog (rename announcement)](https://bpfman.io/main/blog/)
8. [bpfman (Red Hat Emerging Technologies)](https://next.redhat.com/project/bpfman/)
9. [Introduction to BPF Manager / Fedora 40](https://www.ebpf.top/en/post/bpfman_fedora_40/)
10. [eBPF Applications Landscape](https://ebpf.io/applications/)
