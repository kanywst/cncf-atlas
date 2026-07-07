# History

## Origin

The code predates the CoHDI project. IBM Research built the Composable Resource Operator before CoHDI existed and contributed it as the project's core when CoHDI formed; the ADOPTERS file lists IBM Research with "Since 2024", and the `composable-resource-operator` repository was created on 2024-03-11. A fingerprint of that origin survives in the source: both CRDs still use the API group `cro.hpsys.ibm.ie.com` (`api/v1alpha1/groupversion_info.go:29`).

The problem it set out to solve is structural. Kubernetes assigns hardware to a node at boot and has no concept of composable hardware, so expensive accelerators sit statically pinned to hosts even when idle. That hurts utilisation and, as generative AI drives up power draw, cost and energy. CoHDI's pitch is to compose PCIe and CXL devices (GPU, DPU, IPU, SmartNIC, FPGA, NVMe, CXL memory) onto nodes on demand, an idea aligned with the IOWN Global Forum's Data-Centric Infrastructure as a Service (DCIaaS). This framing comes from the CNCF Sandbox proposal, [cncf/sandbox Issue #361](https://github.com/cncf/sandbox/issues/361).

## Timeline

| Year | Milestone |
| --- | --- |
| 2024 | IBM Research's Composable Resource Operator repository created (2024-03-11); later folded into CoHDI. |
| 2025-04 | Fujitsu and Red Hat engineers file the CNCF Sandbox proposal ([Issue #361](https://github.com/cncf/sandbox/issues/361)). |
| 2025 | CoHDI Japan starts as a Cloud Native Community Japan SIG. |
| 2025-12-19 | Accepted into CNCF at Sandbox maturity ([CNCF project page](https://www.cncf.io/projects/cohdi/)). |
| 2026-06-23 | Commit 761a00b, tag v0.2.0 (the version documented here). |

## How it evolved

CoHDI grew from a single IBM operator into a three-part suite. Alongside `composable-resource-operator` (the attach/detach engine), the project added `composable-dra-driver` to publish free pool devices into Kubernetes DRA ResourceSlices, and `dynamic-device-scaler` to watch for pending Pods and trigger composition. The operator itself broadened beyond its IBM roots to abstract multiple hardware vendors behind one interface: the `CdiProvider` interface (`internal/cdi/client.go:34`) now has Fujitsu FTI_CDI, SNIA Sunfish, and NEC implementations selected at runtime (`internal/controller/composableresource_adapter.go:63`).

The work ties into upstream Kubernetes scheduling. The intended trigger path depends on the scheduler holding a Pod until hardware can be attached, which is the subject of [KEP-5007 (device-attach-before-pod-scheduled)](https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/5007-device-attach-before-pod-scheduled).

## Where it stands now

The project is CNCF Sandbox as of 2025-12-19 and tags releases on the operator (the version here is `v0.2.0`). It is governed across multiple vendors: the ADOPTERS file records NTT, NEC, Fujitsu/Fsas Technologies, and IBM Research as participants, and a CoHDI Japan SIG runs under Cloud Native Community Japan. The codebase is still early. The README at this commit even carries an unresolved Git merge-conflict marker (`README.md:181`), a small sign of a young, fast-moving repository.
