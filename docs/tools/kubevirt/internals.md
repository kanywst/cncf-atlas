# Internals

> Read from the source at commit `55a003d`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/virt-controller/virt-controller.go` | virt-controller `main`; calls `watch.Execute()` (`:28`) |
| `pkg/virt-controller/watch/vmi/vmi.go` | VMI reconcile loop, `execute()` (`:306`) |
| `pkg/virt-controller/watch/vmi/lifecycle.go` | `sync()` (`:66`), Pod creation (`:1105`) |
| `pkg/virt-controller/services/template.go` | `RenderLaunchManifest()` builds the launcher Pod spec (`:325`) |
| `pkg/virt-handler/vm.go` | node-side `syncVirtualMachine()` (`:2043`), gRPC to launcher (`:2055`) |
| `pkg/virt-launcher/virtwrap/manager.go` | `LibvirtDomainManager.SyncVMI()` (`:1371`) |
| `pkg/virt-launcher/virtwrap/converter/converter.go` | VMI to libvirt domain conversion (`:967`) |
| `staging/src/kubevirt.io/api/core/v1/types.go` | the public API types |
| `pkg/virt-launcher/virtwrap/api/schema.go` | the libvirt domain Go representation |

## Core data structures

`VirtualMachineInstance` (`staging/src/kubevirt.io/api/core/v1/types.go:47`) represents one running VM as a plain Kubernetes object with `Spec` and `Status`. Its `VirtualMachineInstanceSpec` (`types.go:82`) carries the `Domain` spec plus Kubernetes scheduling vocabulary: `NodeSelector`, `Affinity`, `Tolerations`, `TopologySpreadConstraints`, and `EvictionStrategy`. Scheduling and eviction use the same words as a Pod, which is what lets VMs ride the standard scheduler.

`VirtualMachine` (`types.go:1938`) is the declarative parent that owns a VMI and expresses start/stop/restart intent. `VirtualMachineInstanceMigration` (`types.go:1750`) drives live migration as its own CR.

On the other side of the boundary lives `api.Domain` (`pkg/virt-launcher/virtwrap/api/schema.go:112`) and `api.DomainSpec` (`schema.go:215`), the Go representation of libvirt's domain XML. These are a separate type family from the VMI; the converter bridges the two.

## A path worth tracing

Follow a VMI from the controller to a running domain.

The VMI controller's reconcile entry is `execute(key)` at `pkg/virt-controller/watch/vmi/vmi.go:306`. Once expectations are met it calls sync and writes status (`vmi.go:364`):

```go
syncErr, pod := c.sync(vmi, pod, dataVolumes)
err = c.updateStatus(vmi, pod, dataVolumes, syncErr)
```

`sync()` at `pkg/virt-controller/watch/vmi/lifecycle.go:66` prepares DataVolumes, backend storage, and network, then renders the Pod spec (`lifecycle.go:156`):

```go
templatePod, err = c.templateService.RenderLaunchManifest(vmi)
```

`RenderLaunchManifest(vmi)` at `pkg/virt-controller/services/template.go:325` returns a `*k8sv1.Pod` carrying the compute container (the virt-launcher image), volumes, resources, and security context. The controller then creates it. `createPod()` at `pkg/virt-controller/watch/vmi/lifecycle.go:1105` runs the actual API call:

```go
pod, err := c.clientset.CoreV1().Pods(namespace).Create(context.Background(), pod, v1.CreateOptions{})
```

From here the standard scheduler binds the Pod. On the chosen node, `syncVirtualMachine()` at `pkg/virt-handler/vm.go:2043` assembles options and hands off over gRPC (`vm.go:2055`):

```go
err = client.SyncVirtualMachine(vmi, options)
```

Inside the launcher, `LibvirtDomainManager.SyncVMI()` at `pkg/virt-launcher/virtwrap/manager.go:1371` converts the VMI to a domain (`manager.go:1399`):

```go
if err := converter.Convert_v1_VirtualMachineInstance_To_api_Domain(vmi, domain, c); err != nil {
    logger.Error("Conversion failed.")
}
```

`Convert_v1_VirtualMachineInstance_To_api_Domain(...)` at `pkg/virt-launcher/virtwrap/converter/converter.go:967` maps CPU, memory, disk, network, and firmware into the libvirt XML representation, then the manager defines the domain and starts QEMU.

## Things that surprised me

The whole declarative-to-imperative translation is funneled through one function (`converter.go:967`). Everything Kubernetes-shaped about a VM lives in the VMI types; everything libvirt-shaped lives in `api.Domain`; the converter is the only seam. That keeps the boundary auditable but also makes that single function load-bearing for the entire feature surface.

The node component that you might expect to run libvirt does not. `virt-handler` holds no hypervisor; it only computes desired state and sends it to the per-VM `virt-launcher` over gRPC (`vm.go:2055`). The hypervisor lives in the Pod, not in the node agent, which is what keeps each VM inside the Pod sandbox the scheduler placed.
