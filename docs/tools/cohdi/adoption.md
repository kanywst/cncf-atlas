# Adoption & Ecosystem

## Who uses it

CoHDI is a young CNCF Sandbox project, so adoption is mostly the vendors building it rather than independent production users. The organisations below are the ones listed in the project's [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) (observed 2026-06-27). No other adopters are claimed here.

| Organisation | Use case | Source |
| --- | --- | --- |
| IBM Research (Since 2024) | Built the Composable Resource Operator before CoHDI; continues it as part of the project. | [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) |
| Fujitsu / Fsas Technologies Inc. (Since 2025) | Server and storage vendor developing CoHDI alongside CDI-ready server systems. | [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) |
| NEC (Since 2025) | Develops CDIM (Composable Disaggregated Infrastructure Manager) and collaborates with CoHDI. | [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) |
| NTT (Since 2022) | ICT infrastructure operator planning to integrate CoHDI into IOWN Data-Centric Infrastructure. | [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) |

The same ADOPTERS file notes two distributions that state they "will include" CoHDI as a solution for dynamic device scaling on worker nodes: Red Hat OpenShift and SUSE Rancher. Both are stated as planned, not shipped.

## Adoption signals

Measured from the GitHub API on 2026-06-27:

- `composable-resource-operator`: 23 stars, 8 forks, 10 contributors, about 58 commits. This is the most active of the three repositories.
- `composable-dra-driver`: 6 stars.
- `dynamic-device-scaler`: 6 stars.

The project carries an OpenSSF Best Practices badge (project 12016) and an OpenSSF Scorecard, both linked from the README. CNCF accepted it at Sandbox maturity on 2025-12-19 ([CNCF project page](https://www.cncf.io/projects/cohdi/)). The numbers are small; treat CoHDI as emerging, not yet broadly deployed.

## Ecosystem

CoHDI sits inside the Kubernetes device-management stack and depends on several neighbours:

- Kubernetes DRA and the scheduling SIGs, plus the upstream [KEP-5007](https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/5007-device-attach-before-pod-scheduled) that lets the scheduler hold a Pod until a device is attached.
- NVIDIA GPU Operator and the NVIDIA DRA driver. The operator depends on `github.com/NVIDIA/gpu-operator` in `go.mod` and restarts GPU stack DaemonSets by name after an attach.
- Metal3 BareMetalHost, cluster-api-provider-metal3, and the OpenShift Machine API, used to resolve a node to a machine UUID (`internal/cdi/fti/fm/client.go:416`).
- CDI provider backends: Fujitsu FTI_CDI (Composition Manager and Fabric Manager), SNIA Sunfish, and NEC.
- The other two CoHDI components, `composable-dra-driver` and `dynamic-device-scaler`, and project-cdim from NEC as a CDI platform on the fabric side.

## Alternatives

The honest comparison is that most alternatives operate at a different layer. CoHDI changes the physical hardware a node has; the others manage hardware that is already present.

| Alternative | Differs by |
| --- | --- |
| Plain Kubernetes DRA | Reserves and allocates devices, but the set of hardware wired to a node is fixed at boot. CoHDI operates the PCIe and CXL fabric to change that set at runtime. |
| NVIDIA GPU Operator | Manages driver, device-plugin, and DCGM lifecycle for GPUs that are statically present. CoHDI runs in front of it, attaching the GPU and then restarting the GPU Operator stack so the cluster notices. Complementary, not competing. |
| Project CDIM | The CDI management platform itself, below CoHDI on the fabric side. CoHDI calls into a CDI system; NEC lists CDIM as a collaboration, not a rival. |
| Cluster Autoscaler and node autoscalers | Add or remove whole nodes. CoHDI keeps the node count fixed and adds devices to existing nodes instead. |
