# Kubescape

> An open-source Kubernetes security platform that scans manifests, clusters, and images for misconfigurations, vulnerabilities, and runtime threats from the IDE to a running cluster.

- **Category**: Security & Compliance
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [kubescape/kubescape](https://github.com/kubescape/kubescape)
- **Documented at commit**: `8274975` (2026-06-23, after `v4.0.9`)

## What it is

Kubescape checks Kubernetes workloads against published security frameworks. It evaluates YAML manifests, Helm charts, and live cluster objects against the NSA/CISA Kubernetes Hardening Guidance, MITRE ATT&CK, and CIS Benchmark, then reports a risk score and a compliance score. The control logic is not baked into the binary: it is pulled from the separate `kubescape/regolibrary` repository and evaluated by an Open Policy Agent engine embedded in the CLI.

This repository is the CLI and scan engine. The in-cluster operator, vulnerability scanner, and runtime node-agent live in separate repositories under the same `kubescape` GitHub organisation and ship through Helm charts. The CLI also performs container image scanning by wrapping Anchore Grype and Syft, and image signature checks by calling Sigstore Cosign from inside the policy language.

Kubescape was started by ARMO in 2021 and entered the CNCF Sandbox in 2022. The CNCF Technical Oversight Committee accepted it as an Incubating project on 2025-01-13.

## When to use it

- You need to verify Kubernetes manifests or Helm charts against a named framework (NSA/CISA, MITRE, CIS) and gate CI on a risk or compliance score.
- You want one tool that covers posture scanning, image vulnerability scanning, and (with the in-cluster components) runtime detection.
- You want to keep control content updatable without rebuilding the scanner, including air-gapped operation with locally cached policies.
- It is a weaker fit when you only need node-level CIS Benchmark checks (kube-bench is narrower and simpler) or a single artifact scanner across many ecosystems (Trivy is broader outside Kubernetes posture).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a scan flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [kubescape/kubescape repository and GitHub API](https://github.com/kubescape/kubescape) (stars, forks, license, created date, release), observed 2026-06-24.
2. [Kubescape on CNCF projects](https://www.cncf.io/projects/kubescape/), observed 2026-06-24.
3. [Kubescape becomes a CNCF incubating project (CNCF blog)](https://www.cncf.io/blog/2025/02/26/kubescape-becomes-a-cncf-incubating-project/), observed 2026-06-24.
4. [ARMO Launches Expanded Version of Kubescape (BusinessWire)](https://www.businesswire.com/news/home/20211012005814/en/ARMO-Launches-Expanded-Version-of-Kubescape-Worlds-First-Open-Source-Kubernetes-Testing-Tool-Compliant-with-NSA-CISA-Hardening-Guidance), observed 2026-06-24.
5. [Kubescape one-year anniversary & open source announcement (Medium, ARMO)](https://medium.com/@jonathan_37674/kubescape-one-year-anniversary-open-source-announcment-armo-a1c25a44c054), observed 2026-06-24.
6. [Kubescape central ADOPTERS.md (kubescape/project-governance)](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md), observed 2026-06-24.
7. [Announcing Kubescape 4.0 (CNCF blog, Ben Hirschberg)](https://www.cncf.io/blog/2026/03/26/announcing-kubescape-4-0-enterprise-stability-meets-the-ai-era/), observed 2026-06-24.
8. [Kubescape 4.0 Brings Runtime Security and AI Agent Scanning (InfoQ)](https://www.infoq.com/news/2026/03/kubescape-40/), observed 2026-06-24.
9. [Kubescape Self-Assessment (CNCF TAG Security)](https://tag-security.cncf.io/community/assessments/projects/kubescape/self-assessment/), observed 2026-06-24.
10. [Kubescape Achieves CNCF Incubation Status (The New Stack)](https://thenewstack.io/kubescape-achieves-cncf-incubation-status/), observed 2026-06-24.
11. [ARMO raises $30M (VentureBeat)](https://venturebeat.com/security/first-fully-open-source-kubernetes-security-platform-armo-raises-30-million), observed 2026-06-24.
