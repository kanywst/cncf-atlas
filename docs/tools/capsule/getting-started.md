# Getting Started

> Verified against the Helm chart version 0.12.4. Commands assume a working cluster and a configured `kubectl` context.

## Prerequisites

- Helm 3.
- Kubernetes v1.16 or later, with the `MutatingAdmissionWebhook`, `ValidatingAdmissionWebhook`, `ResourceQuota`, and `LimitRanger` admission plugins enabled (source 6).
- `kubectl` pointed at the cluster where you have cluster-admin rights.

## Install

Install from the Open Container Initiative (OCI) registry:

```bash
helm install capsule oci://ghcr.io/projectcapsule/charts/capsule \
  --version 0.12.4 -n capsule-system --create-namespace
```

The HTTP chart repository works too:

```bash
helm repo add projectcapsule https://projectcapsule.github.io/charts
helm install capsule projectcapsule/capsule \
  --version 0.12.4 -n capsule-system --create-namespace
```

## A first working setup

1. Confirm the controller is running.

    ```bash
    kubectl get pods -n capsule-system
    ```

2. Create a tenant owned by a user named `alice`. The `Tenant` CRD is cluster-scoped, so no namespace is needed.

    ```bash
    kubectl apply -f - <<'EOF'
    apiVersion: capsule.clastix.io/v1beta2
    kind: Tenant
    metadata:
      name: oil
    spec:
      owners:
        - name: alice
          kind: User
    EOF
    ```

3. Inspect the tenant. The print columns show its namespace quota, namespace count, and Ready state.

    ```bash
    kubectl get tenant oil
    ```

When `alice` creates a namespace, the mutating webhook sets the tenant as its owner reference and the validating webhook checks quota, prefix, and metadata before it persists.

## Verify it works

Check that the tenant reports an Active state and that its conditions are Ready:

```bash
kubectl get tenant oil -o jsonpath='{.status.state}{"\n"}'
```

A healthy install prints `Active`. You can also confirm the admission webhooks are registered:

```bash
kubectl get validatingwebhookconfigurations | grep capsule
kubectl get mutatingwebhookconfigurations | grep capsule
```

## Where to go next

The official documentation covers production concerns this page does not: high availability, certificate management for the webhooks, resource pools for shared quota, and the rule and enforcement model. Start at the installation and operating guides (source 6) and the main documentation site (source 5).
