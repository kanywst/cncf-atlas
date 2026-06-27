# History

## Origin

Confidential Containers started in 2022 as a proof of concept that brought Trusted Execution Environment (TEE) isolation to Kubernetes workloads. The early work kept a custom branch of containerd, but that branch was later dropped and most of the runtime work was upstreamed into Kata Containers instead. Rather than write a new container runtime, the project reuses the Kata lightweight virtual machine as a sandbox and adds a layer of attestation and secret delivery on top. This history is described in Red Hat's [What is the Confidential Containers project?](https://www.redhat.com/en/blog/what-confidential-containers-project).

The project was accepted into the CNCF Sandbox on 2022-03-08, recorded on the [CNCF project page](https://www.cncf.io/projects/confidential-containers/) and the onboarding issue [cncf/sandbox#216](https://github.com/cncf/sandbox/issues/216). The trustee repository, the server-side attestation and key-broker implementation this deep-dive covers, was created on 2022-04-25.

## Timeline

| Year | Milestone |
| --- | --- |
| 2022 | Proof of concept; containerd branch later dropped, runtime work moved into Kata Containers. |
| 2022 | Accepted into the CNCF Sandbox on 2022-03-08 ([cncf/sandbox#216](https://github.com/cncf/sandbox/issues/216)). |
| 2022 | trustee repository created (2022-04-25). |
| 2026 | Steady trustee releases: v0.18.0 (2026-03-23), v0.19.0 (2026-04-30), v0.20.0 (2026-05-19). |

## How it evolved

CoCo settled on two runtime implementations with different isolation models. The default, `ccruntime`, uses Kata-based virtual machine isolation and boots an unmodified Pod inside a confidential VM. The second, [`enclave-cc`](https://github.com/confidential-containers/enclave-cc), uses Intel SGX process isolation instead of a VM; it is under consideration for deprecation. The VM path is now the mainstream, because it can take an unmodified Pod and place it directly inside a confidential VM without rebuilding the application as an enclave.

The attack model sharpened over time into the project's defining claim: the cloud operator, host operating system, and hypervisor all sit outside the trust boundary, and data is protected in use by the TEE. A guest Attestation Agent performs remote attestation against the Key Broker Service, and decryption keys or secrets are released into the confidential VM only after that attestation passes. Red Hat's [Understanding the Confidential Containers Attestation Flow](https://www.redhat.com/en/blog/understanding-confidential-containers-attestation-flow) walks through this flow.

## Where it stands now

Trustee ships releases on a regular cadence; recent tags include v0.18.0, v0.19.0, and v0.20.0 across the first half of 2026. Development is spread across the confidential-containers GitHub organization, with trustee and guest-components as the two main implementation repositories and `confidential-containers/confidential-containers` serving as the meta repository for governance, architecture docs, and the ADOPTERS list. The project remains a CNCF Sandbox project and continues to expand its set of supported TEE verifiers.
