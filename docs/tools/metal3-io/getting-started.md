# Getting Started

> Verified against the source at commit `56169b71` (near release v0.13.0). Commands assume a Linux host with `make`, `kubectl`, and a kind-capable container runtime.

## Prerequisites

- A Kubernetes cluster to host the operator. For local work, the repo's `make tilt-up` creates a kind cluster.
- An Ironic backend. The ironic provisioner is the production default; deploy it via the Ironic Standalone Operator (IrSO) or the `ironic-deployment/` kustomize bases.
- At least one server with a supported BMC reachable over IPMI or Redfish, and a network or virtual media boot path. The `fixture` backend can stand in for hardware during development.

## Install

The development workflow uses the repository Makefile ([source 1](https://github.com/metal3-io/baremetal-operator), [source 6](https://book.metal3.io/bmo/introduction)).

```bash
git clone https://github.com/metal3-io/baremetal-operator
cd baremetal-operator
make install
```

## A first working setup

1. Install the CRDs into the cluster.

   ```bash
   make install
   ```

1. Deploy the controller with kustomize, then run it locally with the ironic plugin loaded. The ironic backend must be deployed separately (IrSO or the `ironic-deployment/` bases).

   ```bash
   make deploy
   make run
   ```

1. Create a minimal `BareMetalHost`. A working host needs a BMC address, a credentials secret, the boot NIC MAC (the host NIC, not the BMC), and `online: true` ([source 6](https://book.metal3.io/bmo/introduction)).

   ```yaml
   apiVersion: metal3.io/v1alpha1
   kind: BareMetalHost
   metadata:
     name: node-0
   spec:
     online: true
     bootMACAddress: 00:11:22:33:44:55
     bmc:
       address: redfish://192.168.1.10/redfish/v1/Systems/1
       credentialsName: node-0-bmc-secret
   ```

## Verify it works

Check the host's status. The `State` column reflects the provisioning state machine (registering, inspecting, available, provisioning, provisioned).

```bash
kubectl get bmh
```

The short names `bmh` and `bmhost` are defined on the CRD (`apis/metal3.io/v1alpha1/baremetalhost_types.go:855`-`:863`), along with the printed columns for Status, State, BMC, Online, and Error.

## Where to go next

- The [Metal3 Book](https://book.metal3.io/bmo/introduction) covers production deployment, the Ironic backend, and BMC configuration.
- Unit tests assume envtest and run with `make unit` (plain `go test` will not work). End-to-end tests use libvirt VMs and a BMC emulator via `./hack/ci-e2e.sh`.
- For building Kubernetes clusters on bare metal, see `cluster-api-provider-metal3` (described in [Adoption & Ecosystem](./adoption)).
