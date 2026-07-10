# Getting Started

> Based on the official Getting Started flow (source 7) at commit `f5c408d` (nearest tag `v1.5.1`). Cozystack expects bare-metal or virtual-machine nodes, so a laptop cluster is not enough for a full install.

## Prerequisites

- One or more bare-metal machines (or VMs that can nest KubeVirt) to act as nodes.
- Talos Linux to run on those nodes; Cozystack manages the OS layer.
- `kubectl` and the `talm` bootstrap tool on your workstation.
- A planned Pod and Service CIDR and a `root-host` DNS name for the platform.

## Install

Cozystack installs in five stages, following the official guide (source 7):

1. Install Talos Linux on the nodes.
2. Bootstrap Kubernetes with `talm`.
3. Install Cozystack itself.
4. Create a tenant.
5. Deploy an application into the tenant.

Stage 3 is the Cozystack-specific step. You place a `cozystack-config` ConfigMap in the `cozy-system` namespace (bundle name, Pod and Service CIDRs, and `root-host`) and apply the installer manifest.

```bash
kubectl create namespace cozy-system
kubectl apply -f cozystack-installer.yaml
```

The installer deploys `cozystack-operator`. Its variant (`talos`, `generic`, or `hosted`) is set in the installer values (`packages/core/installer/values.yaml:8`). The operator then reconciles the `platform` package, which brings up the rest of the system components through Flux. The `root-host` and `bundle-name` you configured are read into the shared platform values (`packages/core/platform/templates/apps.yaml:22`).

## A first working setup

Once the platform is up, create a tenant and provision a managed database into it. A tenant is itself an `apps.cozystack.io` kind.

1. Create a tenant namespace and object.

   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: apps.cozystack.io/v1alpha1
   kind: Tenant
   metadata:
     name: my-tenant
     namespace: tenant-root
   spec: {}
   EOF
   ```

1. Provision a Postgres into the tenant. The `spec` here becomes the Helm values of the `packages/apps/postgres` chart (`pkg/registry/apps/application/rest.go:1605`).

   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: apps.cozystack.io/v1alpha1
   kind: Postgres
   metadata:
     name: my-db
     namespace: tenant-my-tenant
   spec:
     replicas: 2
   EOF
   ```

## Verify it works

Cozystack keeps no store of its own, so the underlying `HelmRelease` is the source of truth. Check both the Application view and the Flux object.

```bash
kubectl get postgres -n tenant-my-tenant
kubectl get helmrelease -n tenant-my-tenant
```

The `Postgres` object should report ready, and the corresponding `HelmRelease` (named with the kind's prefix) should reconcile to `Ready`. If the `HelmRelease` is stuck, the problem is in the chart install, which Flux's helm-controller logs.

## Where to go next

For real deployments, follow the official documentation at [cozystack.io](https://cozystack.io/docs/) for node sizing, storage (LINSTOR and Piraeus), networking (Cilium and Kube-OVN), tenant isolation, and the full managed-service catalog. Do not treat the single-node quickstart as a production topology.
