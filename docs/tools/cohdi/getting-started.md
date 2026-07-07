# Getting Started

> Verified against tag `v0.2.0` (commit 761a00b). Commands assume a working `kubectl` context, Go 1.24+, Docker, and a container registry you can push to.

## Prerequisites

- Go version v1.24.0+ (the README and `go.mod` pin `go 1.24.0`).
- Docker version 17.03+.
- `kubectl` version v1.11.3+ and access to a Kubernetes v1.11.3+ cluster.
- For a real attach: a supported CDI provider (Fujitsu FTI_CDI, SNIA Sunfish, or NEC) and the composable fabric behind it. Without one, you can install and run the operator, but `ComposabilityRequest` objects will not complete.

## Install

Clone the repository and check out the documented version.

```bash
git clone https://github.com/CoHDI/composable-resource-operator.git
cd composable-resource-operator
git checkout v0.2.0
```

Build the manager binary to confirm the toolchain is set up. The `build` target runs `manifests`, `generate`, `fmt`, and `vet` first.

```bash
make build
```

## A first working setup

1. Install the CRDs into the cluster your kubeconfig points at.

   ```bash
   make install
   ```

2. Confirm both CRDs registered.

   ```bash
   kubectl get crds | grep cro.hpsys.ibm.ie.com
   ```

3. Build and push the operator image to your registry.

   ```bash
   make docker-build docker-push IMG=<some-registry>/composable-resource-operator:v0.2.0
   ```

4. Deploy the manager. The deployment needs a provider configured through environment variables (`CDI_PROVIDER_TYPE`, `DEVICE_RESOURCE_TYPE`, and provider endpoints); edit `config/manager` before applying if you are wiring real hardware.

   ```bash
   make deploy IMG=<some-registry>/composable-resource-operator:v0.2.0
   ```

5. Create a `ComposabilityRequest`. This is the spec form from the project README.

   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: cro.hpsys.ibm.ie.com/v1alpha1
   kind: ComposabilityRequest
   metadata:
     name: composabilityrequest-sample
   spec:
     resource:
       type: "gpu"
       size: 2
       model: "NVIDIA-A100-PCIE-40GB"
       target_node: "node1"
       allocation_policy: "samenode"
   EOF
   ```

## Verify it works

Check that the operator is running and that the request is progressing through its state machine.

```bash
kubectl get pods -n composable-resource-operator-system
kubectl get composabilityrequest composabilityrequest-sample -o jsonpath='{.status.state}'
```

With a configured fabric the state moves `NodeAllocating` to `Updating` to `Running`, and one `ComposableResource` per device appears.

```bash
kubectl get composableresource
```

Without a fabric, the request stays in an earlier state; that still confirms the CRDs and controller are installed and reconciling.

## Where to go next

- Uninstall with `make undeploy` and `make uninstall` when you are done.
- The [Architecture](./architecture) and [Internals](./internals) pages cover the reconcile state machines and the CDI provider layer.
- For production concerns (registry permissions, RBAC, the build-installer bundle), see the project [README](https://github.com/CoHDI/composable-resource-operator/blob/main/README.md) and the [Kubebuilder documentation](https://book.kubebuilder.io/introduction.html).
