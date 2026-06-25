# Adoption & Ecosystem

## Who uses it

The adopters below come from the central [ADOPTERS.md in kubescape/project-governance](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md); the CLI repository's own `ADOPTERS.md` redirects there. The file lists AWS, Energi Danmark, Gitpod, Intel, Orange Business, Rabobank, and VMware (Bitnami) as well-known companies, plus the use-case entries below.

| Organisation | Use case | Source |
| --- | --- | --- |
| Cox Communications | Security analysis of K8s best practices across CI pipelines for around 3,000 apps | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |
| Swisscom AG | Scanning Helm charts and manifests against the CIS framework | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |
| Schwarz IT (SIT) | Continuous compliance for edge Kubernetes clusters | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |
| Fusioncore.ai | Software Bill of Behavior | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |
| ARMO | Vulnerability monitoring | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |

## Adoption signals

Measured from the GitHub API on 2026-06-24 ([repository](https://github.com/kubescape/kubescape)):

- 11,492 stars, 950 forks, 72 open issues; repository created 2021-08-12.
- Contributors number roughly 205 (last page of the GitHub contributors API, anonymous included).
- Latest release `v4.0.9`, published 2026-05-29.
- Distribution channels: Homebrew, Krew, Chocolatey, `install.sh`, Helm (in-cluster), a GitHub Action, and a VS Code extension. The README carries an OpenSSF Best Practices badge (#6944) and a Scorecard badge.

## Ecosystem

Related repositories in the `kubescape` org (observed via `gh repo list kubescape`, [repository](https://github.com/kubescape/kubescape)):

- `regolibrary`: the control set (NSA/CISA, MITRE, CIS) the scanner consumes, kept separate from the engine.
- `node-agent`: the eBPF runtime agent, which absorbed the host-sensor in 4.0.
- `operator`, `kubevuln`, `kollector`, `storage`, `gateway`, `synchronizer`: the in-cluster microservices, deployed by `helm-charts`.
- `cel-admission-library`: ready-made ValidatingAdmissionPolicy content; `vscode-kubescape`, `lens-extension`, `headlamp-plugin`, and `github-action` provide IDE and CI integration.

Integration points: Grype and Syft for CVE and SBOM data, Cosign/Sigstore for signature verification, Copacetic for image patching behind `kubescape patch`, Inspektor Gadget for eBPF runtime monitoring (per the README), and a Prometheus exporter.

## Alternatives

These are real differences, not strawmen.

| Alternative | Differs by |
| --- | --- |
| Trivy (Aqua) | Cross-artifact scanner (image, IaC, SBOM, secrets) with its own misconfiguration checks. Kubescape leans on framework compliance (NSA/CISA, MITRE, CIS) with risk and compliance scores and embeds Grype for image scanning. |
| kube-bench (Aqua) | Specialised in node-level CIS Kubernetes Benchmark checks. Kubescape includes CIS but spans workloads, manifests, Helm, IDE, and CI, and also does remediation and VAP generation. |
| Checkov / Polaris | Static checks of IaC and manifests. Runtime and in-cluster operators are out of their scope. |
| Falco (CNCF Graduated) | Specialised in runtime threat detection. Kubescape bundles posture, vulnerability, and runtime (via node-agent) into one platform, so it sits closer to complementary than competing. |
