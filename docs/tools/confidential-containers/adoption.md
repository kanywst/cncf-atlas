# Adoption & Ecosystem

## Who uses it

The organizations below are listed in the project's [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) (observed 2026-06-27). Only adopters with that citable source are included.

| Organisation | Use case | Source |
| --- | --- | --- |
| Alibaba Cloud | Elastic Algorithm Service and Elastic GPU Service, protecting user data and AI models from the cloud provider | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Red Hat | OpenShift sandboxed containers on Intel TDX, AMD SEV-SNP, and IBM Z | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| IBM | LinuxONE plus OpenShift, integrated with Secure Execution for Linux | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Edgeless Systems | Contrast, running confidential deployments on Kubernetes | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| ByteDance | Jeddak Sandbox built on CoCo | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Intel | Enterprise-RAG and OPEA running on Intel TDX | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| JDCloud | JoyScale | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| NanhuLab | Trusted Big Data Sharing | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Switchboard | Distributed oracle on AMD SEV-SNP bare metal | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Kubermatic | KubeOne on bare metal | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| KubeArmor | Interoperability with CoCo | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |

## Adoption signals

GitHub figures from the GitHub API, observed 2026-06-27:

- trustee: 165 stars, 158 forks, roughly 60 contributors.
- guest-components: 125 stars, roughly 78 contributors.
- confidential-containers meta repository: 364 stars.

Trustee ships releases regularly; recent tags are v0.18.0 (2026-03-23), v0.19.0 (2026-04-30), and v0.20.0 (2026-05-19). The project lists sponsoring vendors including Alibaba Cloud, AMD, Arm, IBM, Intel, Microsoft, Red Hat, and Rivos, per the CNCF project page and Red Hat blog posts.

## Ecosystem

CoCo reuses rather than reinvents. It builds on Kata Containers for the VM sandbox, containerd for the container layer, ocicrypt-rs for encrypted images, and Rego (through the regorus engine) for policy. Inside the CNCF, the closest neighbors are Kata Containers (the sandbox runtime CoCo sits on) and SPIFFE/SPIRE for workload identity, though SPIRE issues software identities rather than hardware-backed TEE attestation. The guest side of CoCo (the Attestation Agent, Confidential Data Hub, and image-rs) lives in the [guest-components](https://github.com/confidential-containers/guest-components) repository and is the counterpart to trustee.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Edgeless Systems Constellation / Contrast | Productized confidential Kubernetes; Contrast itself is also a CoCo adopter rather than a pure competitor. |
| Enarx / Veracruz | Run WebAssembly inside a TEE; the unit is a Wasm runtime, not an unmodified container. |
| Gramine / Occlum / SCONE | LibOS approaches that place a single process into Intel SGX; CoCo's `enclave-cc` is closest here, while mainstream CoCo is VM-based. |
| Azure Confidential Containers / Google Confidential GKE Nodes | Cloud-managed and vendor-specific; CoCo is vendor-neutral OSS that spans multiple TEE types behind one attestation and KBS flow. |

The core distinction is that CoCo keeps unmodified Pods on Kubernetes and releases keys or secrets only to confidential VMs that pass remote attestation, while binding Intel TDX, AMD SEV-SNP, Intel SGX, IBM Secure Execution, Arm CCA, and NVIDIA GPU support behind a single `Verifier` abstraction.
