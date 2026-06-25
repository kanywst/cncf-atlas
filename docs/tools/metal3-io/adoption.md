# Adoption & Ecosystem

## Who uses it

The CNCF incubation announcement names a growing list of adopters. The organizations below are the ones cited there ([source 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)).

| Organisation | Use case | Source |
| --- | --- | --- |
| Red Hat | Project lead; bare metal provisioning | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |
| Ericsson | Project lead; telco/edge bare metal | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |
| Fujitsu | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |
| IKEA | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |
| SUSE | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |

## Adoption signals

For the baremetal-operator repository alone, observed 2026-06-24 via the GitHub API: 743 stars, 316 forks, around 133 contributors, Apache-2.0, created 2019-01-23, latest release v0.13.0 ([source 11](https://github.com/metal3-io/baremetal-operator)).

Project-wide figures from the CNCF incubation announcement (observed 2025-08): 1,523 GitHub stars, 8,368 merged pull requests, 1,434 issues, 186 contributors, 187 releases, and 57 active contributing organizations ([source 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)).

The project displays OpenSSF Best Practices (project 9985), OpenSSF Scorecard, and CLOMonitor badges in its README. Governance includes a vulnerability disclosure process, automated dependency updates, and SHA-pinned dependencies ([source 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)).

## Ecosystem

Around the baremetal-operator, the metal3-io organization ships several companion projects ([source 1](https://github.com/metal3-io/baremetal-operator), [source 7](https://metal3.io/)):

- `cluster-api-provider-metal3` (CAPM3): the Cluster API integration. BMO acts as its infrastructure backend through `Metal3MachineTemplate`.
- `ip-address-manager` (IPAM): IP address management for provisioned hosts.
- `ironic-standalone-operator` (IrSO): deploys Ironic itself on Kubernetes.
- `ironic-image` and `ironic-agent-image`: container images for the Ironic services and the in-band agent.
- `metal3-dev-env` and `metal3-helm-chart`: development environment and Helm packaging.

## Alternatives

The honest distinction: Metal3 is CRD-first (the `BareMetalHost` is a first-class resource), reuses Ironic's proven hardware coverage, and is the native Cluster API infrastructure provider for bare metal. General-purpose BMaaS tools differ on each of those axes ([source 8](https://thenewstack.io/bare-metal-in-a-cloud-native-world/), [source 9](https://github.com/alexellis/awesome-baremetal/blob/master/README.md), [source 10](https://www.spectrocloud.com/blog/how-to-provision-bare-metal-k8s-clusters-with-cluster-api-and-canonical-maas)).

| Alternative | Differs by |
| --- | --- |
| OpenStack Ironic (standalone) | The BMaaS engine Metal3 runs on. Vendor-neutral via IPMI/Redfish, but not Kubernetes-native. A foundation, not a competitor |
| Canonical MAAS | Mature, IaaS-style API with DNS and network management. External system, not Kubernetes-native; CAPI support via `cluster-api-provider-maas` |
| Tinkerbell | Microservices model where each provisioning step is a Docker workflow image. Does not use Ironic; declarative IaC leaning |
| Sidero (Sidero Labs) | CAPI-capable bare metal management oriented around Talos Linux |
| Foreman / xCAT | General-purpose lifecycle and large-cluster management; not Kubernetes-native |
