# Internals

> Read from the source at commit `3a1a19f`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/virt-controller/virt-controller.go` | virt-controller `main`; calls `watch.Execute()` (`:27`) |
| `pkg/virt-controller/watch/vmi/vmi.go` | VMI reconcile loop, `execute()` (`:309`) |
| `pkg/virt-controller/watch/vmi/lifecycle.go` | `sync()` (`:66`), Pod creation (`:1090`) |
| `pkg/virt-controller/services/template.go` | `RenderLaunchManifest()` builds the launcher Pod spec (`:395`) |
| `pkg/virt-handler/vm.go` | node-side `syncVirtualMachine()` (`:2101`), gRPC to launcher (`:2113`) |
| `pkg/virt-launcher/virtwrap/manager.go` | `LibvirtDomainManager.SyncVMI()` (`:1804`) |
| `pkg/virt-launcher/virtwrap/converter/converter.go` | VMI to libvirt domain conversion entry point (`:43`) |
| `staging/src/kubevirt.io/api/core/v1/types.go` | the public API types |
| `pkg/virt-launcher/virtwrap/api/schema.go` | the libvirt domain Go representation |

## Core data structures

`VirtualMachineInstance` (`staging/src/kubevirt.io/api/core/v1/types.go:46`) represents one running VM as a plain Kubernetes object with `Spec` and `Status`. Its `VirtualMachineInstanceSpec` (`types.go:92`) carries the `Domain` spec plus Kubernetes scheduling vocabulary: `NodeSelector`, `Affinity`, `Tolerations`, `TopologySpreadConstraints`, and `EvictionStrategy`. Scheduling and eviction use the same words as a Pod, which is what lets VMs ride the standard scheduler.

`VirtualMachine` (`types.go:2075`) is the declarative parent that owns a VMI and expresses start/stop/restart intent. `VirtualMachineInstanceMigration` (`types.go:1887`) drives live migration as its own CR.

On the other side of the boundary lives `api.Domain` (`pkg/virt-launcher/virtwrap/api/schema.go:117`) and `api.DomainSpec` (`schema.go:227`), the Go representation of libvirt's domain XML. These are a separate type family from the VMI; the converter bridges the two.

## A path worth tracing

Follow a VMI from the controller to a running domain.

The VMI controller's reconcile entry is `execute(key)` at `pkg/virt-controller/watch/vmi/vmi.go:309`. Once expectations are met it calls sync and writes status (`vmi.go:370`):

```go
syncErr, pod := c.sync(vmi, pod, dataVolumes)
err = c.updateStatus(vmi, pod, dataVolumes, syncErr)
```

`sync()` at `pkg/virt-controller/watch/vmi/lifecycle.go:66` prepares DataVolumes, backend storage, and network, then renders the Pod spec (`lifecycle.go:156`):

```go
templatePod, err = c.templateService.RenderLaunchManifest(vmi)
```

`RenderLaunchManifest(vmi)` at `pkg/virt-controller/services/template.go:395` returns a `*k8sv1.Pod` carrying the compute container (the virt-launcher image), volumes, resources, and security context. The controller then creates it. `createPod()` at `pkg/virt-controller/watch/vmi/lifecycle.go:1090` runs the actual API call:

```go
pod, err := c.clientset.CoreV1().Pods(namespace).Create(context.Background(), pod, v1.CreateOptions{})
```

From here the standard scheduler binds the Pod. On the chosen node, `syncVirtualMachine()` at `pkg/virt-handler/vm.go:2101` assembles options and hands off over gRPC (`vm.go:2113`):

```go
err = client.SyncVirtualMachine(vmi, options)
```

Inside the launcher, `LibvirtDomainManager.SyncVMI()` at `pkg/virt-launcher/virtwrap/manager.go:1804` converts the VMI to a domain (`manager.go:1839`):

```go
if err := converter.Convert_v1_VirtualMachineInstance_To_api_Domain(vmi, domain, c); err != nil {
    logger.Error("Conversion failed.")
    return nil, err
}
```

`Convert_v1_VirtualMachineInstance_To_api_Domain(...)` at `pkg/virt-launcher/virtwrap/converter/converter.go:43` does not map fields itself. It builds a list of 30 configurators (`converter.go:78`) covering network, storage, CPU, memory, firmware (the OS configurator), and devices such as TPM, graphics, and watchdog. It appends one hypervisor configurator (`converter.go:160`): KVM by default, or the `mshv` one when the hypervisor name is `hyperv-direct`, Hyper-V with direct virtualization (`staging/src/kubevirt.io/api/core/v1/types.go:3425`). It then runs them in order through a `DomainBuilder` (`converter.go:171`):

```go
builder := convertertypes.NewDomainBuilder(configurators...)
if err := builder.Build(vmi, domain); err != nil {
    return err
}
```

`Build` calls each configurator's `Configure(vmi, domain)` and stops at the first error (`pkg/virt-launcher/virtwrap/converter/types/builder.go:42`). Back in `SyncVMI()`, the manager then defines the domain through `lookupOrCreateVirDomain()` (`manager.go:1847`) and starts QEMU.

## Things that surprised me

The whole declarative-to-imperative translation is funneled through one function (`converter.go:43`). Everything Kubernetes-shaped about a VM lives in the VMI types, everything libvirt-shaped lives in `api.Domain`, and the converter is the only seam. Inside that seam the work is split: each feature is its own configurator with a single `Configure(vmi, domain)` method (`types/builder.go:29`). The file is 248 lines at `3a1a19f`, down from 1,312 at the previous pin `55a003d`. To see everything a VMI can turn into, read the configurator list at `converter.go:78`.

The node component that you might expect to run libvirt does not. `virt-handler` holds no hypervisor; it only computes desired state and sends it to the per-VM `virt-launcher` over gRPC (`vm.go:2113`). The hypervisor lives in the Pod, and that placement keeps each VM inside the Pod sandbox the scheduler chose.
