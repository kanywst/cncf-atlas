# Getting Started

> Verified against v2.8.3. Commands assume a running Kubernetes cluster, `kubectl`, and Helm 3.

## Prerequisites

- A Kubernetes cluster you can administer.
- `kubectl` configured against that cluster.
- Helm 3 for the chart install.
- Knowledge of your node container runtime and its socket path (for example containerd at `/run/containerd/containerd.sock`).

## Install

Add the chart repository and install into a dedicated namespace.

```bash
helm repo add chaos-mesh https://charts.chaos-mesh.org
kubectl create ns chaos-mesh
helm install chaos-mesh chaos-mesh/chaos-mesh \
  --namespace=chaos-mesh \
  --set chaosDaemon.runtime=containerd \
  --set chaosDaemon.socketPath=/run/containerd/containerd.sock \
  --version 2.8.3
```

The chart deploys the controller-manager, the chaos-daemon DaemonSet, and the dashboard. Before deploying, the chart README points to the official prerequisites and install-by-helm guide ([helm/chaos-mesh README](https://github.com/chaos-mesh/chaos-mesh/blob/master/helm/chaos-mesh/README.md)).

## A first working setup

1. Confirm the components are running.

```bash
kubectl get pods -n chaos-mesh
```

1. Apply a minimal PodChaos that kills one pod matched by a label selector. Save it as `pod-kill.yaml`.

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill-example
  namespace: chaos-mesh
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - default
    labelSelectors:
      app: my-app
```

1. Apply the experiment.

```bash
kubectl apply -f pod-kill.yaml
```

## Verify it works

Check the experiment status; the controller records selection and injection state on the object.

```bash
kubectl describe podchaos pod-kill-example -n chaos-mesh
```

Look for the `Selected` and `AllInjected` conditions and a target pod in the `default` namespace being terminated. The dashboard shows the same experiment and its event timeline.

## Where to go next

For production installation, runtime configuration, namespace scoping, RBAC, and security hardening, follow the official Chaos Mesh documentation ([Quick Start](https://chaos-mesh.org/docs/quick-start)) and the production install-by-helm guide referenced from the chart README.

## Sources

1. Chaos Mesh Quick Start: <https://chaos-mesh.org/docs/quick-start>
2. helm/chaos-mesh README: <https://github.com/chaos-mesh/chaos-mesh/blob/master/helm/chaos-mesh/README.md>
