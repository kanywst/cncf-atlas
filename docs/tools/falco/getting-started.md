# Getting Started

> Verified against the Helm chart for Falco `0.44.x`. Commands assume a Kubernetes cluster and Helm 3.

## Prerequisites

- A Kubernetes cluster where you can run a DaemonSet with the privileges to load an eBPF probe or kernel module.
- `kubectl` and `helm` configured against that cluster.
- For full eBPF (CO-RE) a Linux kernel of 5.8 or newer; older kernels fall back to the kernel module (source 6, 9).

## Install

```bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update
helm install falco falcosecurity/falco --namespace falco --create-namespace
```

To install the output forwarder and its web UI at the same time:

```bash
helm install falco falcosecurity/falco \
  --set falcosidekick.enabled=true \
  --set falcosidekick.webui.enabled=true
```

## A first working setup

1. Install the chart with the first command above. Falco deploys as a DaemonSet, one pod per node, each reading its own node's kernel events (source 6).

1. Wait for the pods to be ready:

   ```bash
   kubectl get pods --namespace falco --watch
   ```

1. Trigger a built-in rule. The default ruleset alerts on a shell started inside a container, so exec into any running pod and start one:

   ```bash
   kubectl exec -it <some-pod> -- /bin/sh
   ```

## Verify it works

Read the Falco logs and look for the rule match. The default rule "Terminal shell in container" fires from the step above:

```bash
kubectl logs --namespace falco -l app.kubernetes.io/name=falco | grep "Terminal shell"
```

A healthy install prints a Warning-priority line naming the rule, the container, and the user. If you enabled the web UI, the same event appears there.

## Where to go next

For the install paths, driver selection (eBPF versus kernel module), rule authoring, and output configuration, follow the official documentation (source 6) and the Kubernetes quickstart (source 11). For production concerns such as rule and plugin management, see `falcoctl` (source 7); for routing alerts to external systems, see `falcosidekick`.
