# Getting Started

> Verified against release `v1.8.4`. Commands assume a running Kubernetes cluster and `kubectl` configured against it.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl`.
- Nodes with hardware virtualization available. Where it is not (for example nested or emulated environments), the `KubeVirt` CR needs a software emulation setting.
- The `virtctl` CLI, obtained from the matching GitHub release.

## Install

The install entry point is `virt-operator`: apply the operator manifest, then a `KubeVirt` custom resource that tells the operator to deploy the rest ([docs/getting-started.md](https://github.com/kubevirt/kubevirt/blob/main/docs/getting-started.md), [docs/updates.md](https://github.com/kubevirt/kubevirt/blob/main/docs/updates.md)).

```bash
export RELEASE=v1.8.4
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-operator.yaml
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-cr.yaml
```

## A first working setup

1. Wait for the operator to deploy the control plane and report the install as available.

   ```bash
   kubectl -n kubevirt wait kv kubevirt --for condition=Available --timeout=10m
   ```

2. If your nodes lack hardware virtualization, enable software emulation on the `KubeVirt` CR before the previous step completes.

   ```bash
   kubectl -n kubevirt patch kubevirt kubevirt --type=merge \
     -p '{"spec":{"configuration":{"developerConfiguration":{"useEmulation":true}}}}'
   ```

3. Once the install is Available, create a `VirtualMachine` and start it with `virtctl`.

   ```bash
   virtctl start <vm-name>
   ```

## Verify it works

Confirm the KubeVirt install is healthy and the components are running.

```bash
kubectl -n kubevirt get kv kubevirt -o=jsonpath='{.status.phase}'
kubectl -n kubevirt get pods
```

A healthy install reports phase `Deployed` and shows `virt-api`, `virt-controller`, and `virt-handler` Pods running. After starting a VM, `kubectl get vmi` shows the instance and `virtctl console <vm-name>` attaches to its serial console.

## Where to go next

For production concerns such as upgrades, high availability, storage with CDI, and live migration, see the official [KubeVirt documentation](https://kubevirt.io/user-guide/) and the repository's [docs/updates.md](https://github.com/kubevirt/kubevirt/blob/main/docs/updates.md) for the supported update flow.
