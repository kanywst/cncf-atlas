# Litmus

> Cloud-native chaos engineering for Kubernetes, with a central control plane and a shared hub of reusable experiments.

- **Category**: Chaos Engineering
- **CNCF maturity**: Incubating
- **Language**: Go (control plane), TypeScript/React (web UI)
- **License**: Apache License 2.0
- **Repository**: [litmuschaos/litmus](https://github.com/litmuschaos/litmus)
- **Documented at commit**: `97cfc6f1` (tag 3.30.0, 2026-06-17)

## What it is

Litmus is a framework for running chaos experiments against Kubernetes workloads. You declare a fault as a Kubernetes custom resource, point it at a target, and Litmus injects the failure while checking whether the system holds its expected steady state.

The project splits into two halves. ChaosCenter is the control plane: a set of Go microservices plus a React UI that create, schedule, and visualize experiments. The execution plane is a set of operators that run inside each target cluster and inject the faults. This repository is mostly the control plane. The fault code lives in the sister repository `litmuschaos/litmus-go`, and the experiment bundles live in `litmuschaos/chaos-charts`.

The design is multi-cluster. One ChaosCenter instance manages many target clusters at once, and each cluster's agent dials back to the control plane rather than the other way around. Faults are shared and versioned through ChaosHub, so teams reuse experiment definitions instead of rewriting them.

## When to use it

- You run workloads on Kubernetes and want chaos experiments expressed as custom resources that fit a GitOps flow.
- You need to drive experiments across several clusters from one control plane, including clusters behind NAT or a firewall.
- You want reusable, shareable fault definitions and steady-state checks (probes) rather than one-off scripts.
- You want resilience scoring and Prometheus metrics from experiment results.

It is a weaker fit when your targets are not on Kubernetes, where a managed cloud-resource fault service may suit better, or when you want a hosted SaaS with no control plane to operate yourself.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [litmuschaos/litmus repository](https://github.com/litmuschaos/litmus) (pinned `97cfc6f1`, tag 3.30.0), accessed 2026-06-24.
2. [Litmus CNCF project page](https://www.cncf.io/projects/litmus/), accessed 2026-06-24.
3. [LitmusChaos becomes a CNCF incubating project](https://www.cncf.io/blog/2022/01/11/litmuschaos-becomes-a-cncf-incubating-project/), accessed 2026-06-24.
4. [LitmusChaos Q4 2025 update](https://www.cncf.io/blog/2026/01/22/litmuschaos-q4-2025-update-community-contributions-and-project-progress/), accessed 2026-06-24.
5. [LitmusChaos 3.0: robust, lean, developer-centric](https://www.cncf.io/blog/2023/11/07/litmuschaos-3-0-making-chaos-engineering-robust-lean-and-developer-centric/), accessed 2026-06-24.
6. [ChaosNative launches to accelerate Litmus adoption](https://www.prnewswire.com/news-releases/chaosnative-launches-to-accelerate-litmus-adoption-in-enterprises-301225911.html), accessed 2026-06-24.
7. [LitmusChaos proposal for Sandbox (cncf/toc #390)](https://github.com/cncf/toc/issues/390), accessed 2026-06-24.
8. [Litmus Docs: Installation](https://docs.litmuschaos.io/docs/getting-started/installation), accessed 2026-06-24.
9. [Litmus Docs: Architecture summary](https://docs.litmuschaos.io/docs/3.0.0/architecture/architecture-summary), accessed 2026-06-24.
10. [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md), accessed 2026-06-24.
11. [litmuschaos/litmus-go](https://github.com/litmuschaos/litmus-go), accessed 2026-06-24.
12. [litmuschaos/chaos-charts](https://github.com/litmuschaos/chaos-charts), accessed 2026-06-24.
13. [GitHub release 3.30.0](https://github.com/litmuschaos/litmus/releases/tag/3.30.0), accessed 2026-06-24.
14. [CNCF Landscape (Litmus)](https://landscape.cncf.io/?selected=litmus), accessed 2026-06-24.
