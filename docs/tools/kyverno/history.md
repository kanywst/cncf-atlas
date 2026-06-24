# History

## Origin

Kyverno was created by Nirmata and donated to the CNCF in 2020. The name is Greek for "to govern". The premise was that Kubernetes already has a policy language: its own resource model. Instead of asking operators to learn a separate language to write admission rules, Kyverno makes each policy a Kubernetes custom resource managed with the same tools, RBAC, and GitOps pipelines as everything else in the cluster ([CNCF graduation announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | Created by Nirmata; accepted into the CNCF Sandbox on 2020-11-10. |
| 2022 | Moved to CNCF Incubating on 2022-07-13. |
| 2026 | Graduated within the CNCF on 2026-03-16; graduation announced at KubeCon + CloudNativeCon EU in Amsterdam on 2026-03-24. |
| 2026 | Release 1.18 ships an SSRF fix, advances the CEL-based policy types, and continues to scale back the older `ClusterPolicy` model. |

## How it evolved

The biggest shift is the move toward CEL. Early Kyverno expressed logic with JMESPath and YAML overlays inside `ClusterPolicy`. Recent releases add CEL-based policy types (ValidatingPolicy, MutatingPolicy, ImageVerificationPolicy, GeneratingPolicy) that align with the direction Kubernetes itself took with native ValidatingAdmissionPolicy and MutatingAdmissionPolicy. Kyverno positions these to complement the native admission policies rather than replace them, and release 1.18 continues to scale back the older `ClusterPolicy` model in favour of the CEL path ([Announcing Kyverno 1.18](https://www.cncf.io/blog/2026/05/05/announcing-kyverno-release-1-18/)).

Graduation required passing a third-party security audit plus a security assessment led by the CNCF TAG Security & Compliance. The TOC sponsor for graduation was Karena Angell ([CNCF graduation announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/)).

## Where it stands now

Kyverno is a CNCF Graduated project. At graduation the CNCF reported maintainers across six organisations including Nirmata, Chainguard, and Cloudflare, with 3,624 contributors from 1,063 organisations ([CNCF graduation announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/)). The most recent release line at the documented commit is v1.18.1 (2026-05-18). Governance and the maintainer list live in the `kyverno/community` repository ([GOVERNANCE.md](https://github.com/kyverno/community/blob/main/GOVERNANCE.md)). The stated direction is continued investment in the CEL-based policy types while supporting the existing `ClusterPolicy` users through the transition.
