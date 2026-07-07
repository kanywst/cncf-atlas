# Chaosblade

> A single command-line tool that injects faults across hosts, the JVM, C++, containers, and Kubernetes by dispatching versioned YAML experiment specs to per-domain executor binaries.

- **Category**: Chaos Engineering
- **CNCF maturity**: Sandbox
- **Language**: Go (the `blade` CLI; a separate Python AI layer lives under `blade-ai/`)
- **License**: Apache-2.0
- **Repository**: [chaosblade-io/chaosblade](https://github.com/chaosblade-io/chaosblade)
- **Documented at commit**: `39a0c02` (2026-06-18, near tag `blade-ai-v0.5.0`)

## What it is

Chaosblade is a chaos engineering tool from Alibaba. Chaos engineering is the practice of injecting controlled faults into a system to learn how it behaves under failure. The core deliverable is `blade`, a Go command-line interface (CLI) that creates, queries, and destroys fault-injection experiments such as CPU load, network latency, disk fill, and process kill.

The design centre is an experiment model: every scenario is a target plus an action plus flags, defined in versioned YAML rather than hard-coded. `blade` itself does not inject faults. It parses the YAML, builds an experiment record, and shells out to a separate executor binary (for example `chaos_os`) that does the real work. That separation lets one CLI cover hosts, the Java Virtual Machine (JVM), C++, Docker, the Container Runtime Interface (CRI), Kubernetes, and cloud providers without the CLI knowing each implementation.

State is kept in a local SQLite file, so a single host needs no external database to track running experiments and recover them.

## When to use it

- You want one consistent CLI and experiment grammar to inject faults across heterogeneous targets (bare host, JVM application, container, Kubernetes pod) rather than a different tool per layer.
- You need application-layer fault injection, such as JVM method exceptions or C++ line-level faults, that a network or node-level tool cannot reach.
- You want experiments to self-recover: a `timeout` flag schedules an automatic destroy so a forgotten experiment does not linger.
- It is a weaker fit if you want a fully declarative, Kubernetes-native, custom-resource-driven workflow as the primary interface. For that the operator (`chaosblade-operator`) or alternatives like Chaos Mesh and LitmusChaos sit closer to the cluster.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. chaosblade-io/chaosblade repository and README: <https://github.com/chaosblade-io/chaosblade>
2. Chaosblade CNCF project page (Sandbox, accepted 2021-04-28): <https://www.cncf.io/projects/chaosblade/>
3. ChaosBlade, An Open-Source Chaos Engineering Tool by Alibaba: <https://www.alibabacloud.com/blog/chaosblade---an-open-source-chaos-engineering-tool-by-alibaba_594850>
4. ChaosBlade: From the Chaos Engineering Experiment Tool to the Chaos Engineering Platform: <https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663>
5. ChaosBlade-Box, a New Version of the Chaos Engineering Platform Has Released: <https://chaosblade.io/en/blog/2022/06/24/ChaosBlade-Box-a-New-Version-of-the-Chaos-Engineering-Platform-Has-Released/>
6. ChaosBlade documentation: <https://chaosblade.io/en/docs/>
7. LFX Insights, ChaosBlade: <https://insights.linuxfoundation.org/project/chaosblade>
8. Chaos Engineering in the Wild: Findings from GitHub (arXiv 2505.13654): <https://arxiv.org/html/2505.13654>
9. Local clone at commit `39a0c02e5f34af980f561440c0f1c218a3cde821`: <https://github.com/chaosblade-io/chaosblade/tree/39a0c02e5f34af980f561440c0f1c218a3cde821>
