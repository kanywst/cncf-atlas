# Adoption & Ecosystem

## Who uses it

These organisations are named in the project's `ADOPTERS.md` or the CNCF graduation announcement. Only cited adopters are listed.

| Organisation | Use case | Source |
| --- | --- | --- |
| LinkedIn | Policy enforcement on on-prem Kubernetes clusters; reported at 230+ clusters and 500K+ nodes, handling 20K admission requests per minute under stress without degradation. | [CNCF announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/), [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Coinbase | Mutation, replacing hand-written webhooks, and generating common objects into many similar namespaces. | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Bloomberg | Replacing custom validation and mutation webhooks in internal Kubernetes-based platforms. | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Mandiant | Policy enforcement across all clusters and onboarding, populating new namespaces with required resources and secrets. | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Giant Swarm | Defaulting logic on resources (primarily cluster-api) and replacing PSPs to enforce restrictions. | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Vodafone Group | Policy enforcement and automation on an internal Kubernetes service offering. | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |

`ADOPTERS.md` also lists Deutsche Telekom, T-Systems, Red Hat (RHACM integration), Saxo Bank, Wayfair, Yahoo, Velux, Groww, the Ohio Supercomputer Center, Arrikto (Kubeflow), and VSHN/APPUiO, among others.

## Adoption signals

- GitHub: 7,859 stars and 1,402 forks as observed on 2026-06-22 via the [GitHub REST API](https://api.github.com/repos/kyverno/kyverno).
- Contributors: the CNCF graduation announcement reports 3,624 contributors from 1,063 organisations, with maintainers spread across six organisations including Nirmata, Chainguard, and Cloudflare ([CNCF announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/)).
- Release cadence: the most recent release line at the documented commit is v1.18.1 (2026-05-18), following the 1.18 series ([Announcing Kyverno 1.18](https://www.cncf.io/blog/2026/05/05/announcing-kyverno-release-1-18/)).
- Maturity: CNCF Graduated as of 2026-03-16 ([CNCF project page](https://www.cncf.io/projects/kyverno/)).

## Ecosystem

- **kyverno/policies**: a library of ready-made policies, including the Pod Security Standards.
- **kubectl-kyverno**: the CLI under `cmd/cli`, used to test and apply policies outside the cluster.
- **Policy Reporter**: visualises the `PolicyReport` CRD that Kyverno emits.
- **GitOps**: policies are plain Kubernetes resources, so they distribute through Argo CD or Flux like any other manifest.
- **Image verification**: integrates with Sigstore/cosign for signature checks.
- **Red Hat RHACM**: integrates Kyverno for policy management.

## Alternatives

The main alternative is OPA Gatekeeper. The core difference is the language: Gatekeeper uses Rego, while a Kyverno policy is a Kubernetes YAML resource. Gatekeeper uses a two-part ConstraintTemplate plus Constraint model; Kyverno uses a single CRD. Gatekeeper centres on validation and mutation, while Kyverno also offers resource generation and image verification natively ([Nirmata comparison](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/), [policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/)).

The adjacent option is Kubernetes-native ValidatingAdmissionPolicy and MutatingAdmissionPolicy, both CEL-based and built into the API server. Kyverno aligns with these through its CEL policy types and can bind to them rather than replace them.

| Alternative | Differs by |
| --- | --- |
| OPA Gatekeeper | Rego language and a ConstraintTemplate + Constraint pair; validation and mutation focused, no native generation or image verification. |
| Native ValidatingAdmissionPolicy / MutatingAdmissionPolicy | Built into the Kubernetes API server, CEL only, no generation; Kyverno complements rather than replaces it. |

One published comparison measured footprints of roughly 270MB for Gatekeeper (controller plus audit) versus roughly 600MB for Kyverno across its four controllers ([policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/)). Those are a blog author's measurements, not official figures.
