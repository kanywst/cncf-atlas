# Getting Started

> Verified against `v1.18.1`. Commands assume a running Kubernetes cluster and a working `kubectl`.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl` (a local kind or minikube cluster is fine).
- Helm 3, if you install with the chart.

## Install

With Helm:

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace
```

Or apply the release manifest directly:

```bash
kubectl apply -f https://github.com/kyverno/kyverno/releases/download/v1.18.1/install.yaml
```

## A first working setup

The goal is to require a label on every Pod and watch Kyverno block one that lacks it.

1. Confirm the controllers are running.

   ```bash
   kubectl get pods -n kyverno
   ```

1. Create a policy that requires the `team` label on Pods and enforces it.

   ```bash
   cat <<'EOF' | kubectl apply -f -
   apiVersion: kyverno.io/v1
   kind: ClusterPolicy
   metadata:
     name: require-team-label
   spec:
     validationFailureAction: Enforce
     rules:
       - name: check-team-label
         match:
           any:
             - resources:
                 kinds:
                   - Pod
         validate:
           message: "The label 'team' is required on every Pod."
           pattern:
             metadata:
               labels:
                 team: "?*"
   EOF
   ```

1. Try to create a Pod without the label. The admission request is denied.

   ```bash
   kubectl run nginx --image=nginx
   ```

Expected output:

```text
Error from server: admission webhook "validate.kyverno.svc-fail" denied the request:

resource Pod/default/nginx was blocked due to the following policies

require-team-label:
  check-team-label: 'The label ''team'' is required on every Pod.'
```

1. Create the same Pod with the label and it is admitted.

   ```bash
   kubectl run nginx --image=nginx --labels team=payments
   ```

## Verify it works

Confirm the policy is registered and ready:

```bash
kubectl get clusterpolicy require-team-label
```

The `READY` column should read `True`. You can also check that Kyverno registered its webhooks with the API server:

```bash
kubectl get validatingwebhookconfigurations | grep kyverno
```

## Where to go next

For production, read the official docs on high availability, the security and hardening guide, and how to scale the controllers. The CEL-based policy types (ValidatingPolicy and friends) are the forward direction and are documented separately. Start from the [Kyverno introduction](https://kyverno.io/docs/introduction/).
