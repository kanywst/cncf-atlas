# Falco

> A runtime security engine that watches Linux kernel events and raises alerts when activity matches a rule.

- **Category**: Security & Compliance
- **CNCF maturity**: Graduated
- **Language**: C++
- **License**: Apache-2.0
- **Repository**: [falcosecurity/falco](https://github.com/falcosecurity/falco)
- **Documented at commit**: `5123e90` (master, 2026-06-18)

## What it is

Falco is a runtime security tool. It taps the stream of system calls a Linux host makes, evaluates each event against a set of rules, and emits an alert when a rule matches. A rule can describe a shell spawned inside a container, a write to a sensitive path, or an outbound connection to an unexpected address.

The project ships as a single `falco` binary written in C++. In Kubernetes it runs as a DaemonSet so every node has an agent reading its own kernel events. Event collection uses an eBPF probe on recent kernels and falls back to a kernel module on older ones. Beyond syscalls, a plugin framework lets Falco read other event sources such as Kubernetes audit logs and cloud provider trails.

Falco detects and alerts. It does not block or kill processes itself. That keeps the data path cheap and pushes response to downstream tooling, which fits its role as a detection engine rather than an enforcement layer.

## When to use it

- You want runtime threat detection on Linux hosts or Kubernetes nodes with a maintained, community rule library.
- You need to ingest non-syscall sources (Kubernetes audit, CloudTrail, Okta, GitHub) into one detection engine through plugins.
- You run a mix of kernel versions and need a tool that can fall back to a kernel module where eBPF CO-RE is unavailable.
- It is a weaker fit when you need in-kernel enforcement (process kill, connection drop) as a primary goal; a tool built around enforcement suits that better.

## In this deep-dive

- [History](./history): origin at Sysdig, CNCF donation, and graduation.
- [Architecture](./architecture): the binary, the engine, and how one event becomes one alert.
- [Adoption & Ecosystem](./adoption): cited adopters, GitHub signals, and the surrounding tools.
- [Internals](./internals): the rule data structures and the event-type index, read from source.
- [Getting Started](./getting-started): install on Kubernetes with Helm and confirm detection.

## Sources

1. [CNCF Announces Falco Graduation](https://www.cncf.io/announcements/2024/02/29/cloud-native-computing-foundation-announces-falco-graduation/) (2026-06-22)
2. [falcosecurity/falco on GitHub](https://github.com/falcosecurity/falco) (2026-06-22)
3. [Falco releases](https://github.com/falcosecurity/falco/releases) (2026-06-22)
4. [Falco's Journey to CNCF graduation, Sysdig](https://www.sysdig.com/blog/falco-cncf-graduation) (2026-06-22)
5. [Falco Graduates within the CNCF, falco.org](https://falco.org/blog/falco-graduation/) (2026-06-22)
6. [The Falco Project docs](https://falco.org/docs/) (2026-06-22)
7. [Falcoctl: install and manage rules and plugins](https://falco.org/blog/falcoctl-install-manage-rules-plugins/) (2026-06-22)
8. [Falco ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) (2026-06-22)
9. [eBPF Runtime Security Tools: Falco vs Tetragon vs Tracee](https://www.decryptiondigest.com/blog/ebpf-runtime-security-tools-falco-tetragon) (2026-06-22)
10. [Tetragon vs Falco 2026 Runtime Security Comparison](https://safeguard.sh/resources/blog/tetragon-vs-falco-runtime-security-2026) (2026-06-22)
11. [Try Falco on Kubernetes quickstart](https://falco.org/docs/getting-started/falco-kubernetes-quickstart/) (2026-06-22)
