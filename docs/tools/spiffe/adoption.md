# Adoption & Ecosystem

## Who uses it

The adopters below are named in the CNCF graduation announcement, SPIRE's ADOPTERS file, or a public engineering write-up. SPIFFE is consumed through implementations such as SPIRE and through client libraries like go-spiffe, so these are organizations running the SPIFFE model in production.

| Organisation | Use case | Source |
| --- | --- | --- |
| Uber | Workload identity across GCP, OCI, AWS, and on-prem for stateless, stateful, batch, and CI jobs | [Uber blog](https://www.uber.com/en/blog/our-journey-adopting-spiffe-spire/) |
| ByteDance / TikTok | Zero-trust foundation protecting hundreds of thousands of workloads | [CNCF announcement](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/) |
| Square (now Block) | mTLS identity for hybrid infrastructure and Lambda workloads | [SPIRE case studies](https://spiffe.io/docs/latest/spire-about/case-studies/) |
| Bloomberg | Production adopter; presented TPM node attestation | [SPIRE ADOPTERS.md](https://github.com/spiffe/spire/blob/main/ADOPTERS.md) |

The graduation announcement and ADOPTERS file also list GitHub, Netflix, Pinterest, Niantic, Twilio, Duke Energy, Unity Technologies, and Z Lab, plus vendor integrations from HashiCorp, F5, Intel, IBM, Google, and VMware ([source #2](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/), [source #7](https://github.com/spiffe/spire/blob/main/ADOPTERS.md)).

## Adoption signals

Observed on 2026-06-24 via the GitHub API:

- `spiffe/go-spiffe`: 200 stars, 85 forks, 38+ contributors, latest release v2.8.1 (2026-06-19).
- `spiffe/spiffe` (the standards repository): 1788 stars, 200 forks, 54+ contributors.
- `spiffe/spire` (the reference implementation): 2407 stars.

The library's star count is modest because most operators interact with SPIFFE through SPIRE; go-spiffe is the application-side dependency, not the headline project.

## Ecosystem

SPIFFE integrates with Envoy (which distributes SVIDs over SDS), gRPC, Istio (which adopts the SPIFFE ID scheme), Kubernetes, Sigstore, and Tekton. go-spiffe provides the mTLS wiring for these through `spiffetls` and `spiffegrpc`. There are sibling client libraries for other languages: java-spiffe, c-spiffe, py-spiffe, and spiffe-rs. go-spiffe is distinguished by supporting the Workload API over a Windows named pipe.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Cloud provider workload identity (GKE Workload Identity, AWS IAM Roles Anywhere) | Native to one platform; SPIFFE is vendor-neutral and spans clouds and orchestrators |
| HashiCorp Vault workload identity | Secret-management product issuing identities; SPIFFE defines a standard plus a Workload API rather than a single product |
| Service mesh built-in mTLS (for example Linkerd's identity) | Couples identity to one mesh; SPIFFE federation (`federation/`) authenticates across separate trust domains |

The defining trait is that SPIFFE specifies a vendor-neutral identity standard and Workload API, and supports cross-domain federation, whereas cloud-specific workload identity stays inside a single provider.
