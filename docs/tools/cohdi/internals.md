# Internals

> Read from the source at commit `761a00b` (tag v0.2.0). Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/main.go` | Wires the Manager, three reconcilers, and the webhook. |
| `api/v1alpha1` | The two CRD types and the `cro.hpsys.ibm.ie.com` group. |
| `internal/controller` | Reconcilers and the provider adapter. |
| `internal/cdi` | The `CdiProvider` interface and vendor implementations. |
| `internal/cdi/fti` | Fujitsu FTI_CDI: token cache plus Composition Manager (`cm`) and Fabric Manager (`fm`). |
| `internal/webhook/v1alpha1` | The `ComposabilityRequest` validating webhook. |
| `internal/utils` | GPU driver checks, visibility checks, draining, name generation. |

## Core data structures

`ScalarResourceDetails` (`api/v1alpha1/composabilityrequest_types.go:40`) is the body of a `ComposabilityRequestSpec` (`api/v1alpha1/composabilityrequest_types.go:36`). It carries the type enum, model, size, allocation policy, and optional target node:

```go
type ScalarResourceDetails struct {
    // +kubebuilder:validation:Enum="gpu";"cxlmemory"
    Type string `json:"type"`
    // +kubebuilder:validation:MinLength=1
    Model string `json:"model"`
    // +kubebuilder:validation:Minimum=0
    Size        int64 `json:"size"`
    ForceDetach bool  `json:"force_detach,omitempty"`
    // +kubebuilder:validation:Enum="samenode";"differentnode"
    // +kubebuilder:default=samenode
    AllocationPolicy string    `json:"allocation_policy,omitempty"`
    TargetNode       string    `json:"target_node,omitempty"`
    OtherSpec        *NodeSpec `json:"other_spec,omitempty"`
}
```

The status side aggregates per-device state in `ComposabilityRequestStatus` (`api/v1alpha1/composabilityrequest_types.go:67`), whose `Resources` map values are `ScalarResourceStatus` (`api/v1alpha1/composabilityrequest_types.go:74`).

Each device is one `ComposableResource`, whose status (`api/v1alpha1/composableresource_types.go:36`) is where the operator records the result of a CDI call:

```go
type ComposableResourceStatus struct {
    State       string `json:"state"`
    Error       string `json:"error,omitempty"`
    DeviceID    string `json:"device_id,omitempty"`
    CDIDeviceID string `json:"cdi_device_id,omitempty"`
}
```

`DeviceID` is the device serial number; `CDIDeviceID` is the fabric-side UUID (Universally Unique Identifier). The vendor seam is the `CdiProvider` interface (`internal/cdi/client.go:34`):

```go
type CdiProvider interface {
    AddResource(instance *v1alpha1.ComposableResource) (deviceID string, CDIDeviceID string, err error)
    RemoveResource(instance *v1alpha1.ComposableResource) error
    CheckResource(instance *v1alpha1.ComposableResource) error
    GetResources() (deviceInfoList []DeviceInfo, err error)
}
```

`GetResources` returns a slice of `DeviceInfo` (`internal/cdi/client.go:25`), the normalised form (NodeName, MachineUUID, DeviceID, CDIDeviceID) the upstream syncer uses to compare fabric state against the cluster.

## A path worth tracing

Attaching one GPU runs from `ComposableResource` to an HTTP PATCH against the Fabric Manager. `handleAttachingState` (`internal/controller/composableresource_controller.go:209`) first confirms the NVIDIA driver exists via `utils.EnsureGPUDriverExists` (`internal/utils/gpus.go:64`), then, when `DeviceID` is unset, calls the provider (`internal/controller/composableresource_controller.go:231`):

```text
handleAttachingState
  -> adapter.CDIProvider.AddResource(resource)        controller :231
       -> FTIClient.AddResource                        fm/client.go :100
            -> getNodeMachineID(TargetNode)            fm/client.go :103
            -> token.GetToken()                        fm/client.go :109
            -> build ScaleUpBody                        fm/client.go :115
            -> PATCH .../machines/<id>/update           fm/client.go :147
            -> inspect OptionStatus[:1]                 fm/client.go :195
  -> write DeviceID / CDIDeviceID to status            controller :245-247
  -> CheckGPUVisible                                    controller :288 / gpus.go :185
  -> state Online                                       controller :293
```

`FTIClient.AddResource` (`internal/cdi/fti/fm/client.go:100`) resolves the node to a machine UUID, fetches an OAuth2 token, builds a `ScaleUpBody` (`internal/cdi/fti/fm/client.go:115`), and sends the PATCH (`internal/cdi/fti/fm/client.go:147`). It judges success on the first character of the returned `OptionStatus` (`internal/cdi/fti/fm/client.go:195`):

```go
                if resource.OptionStatus[:1] == "0" {
                    return resource.SerialNum, resource.ResourceUUID, nil
                } else if resource.OptionStatus[:1] == "1" {
                    clientLog.Info("the FM attached device called is in Warning state in FM", "ComposableResource", instance.Name)
                    return resource.SerialNum, resource.ResourceUUID, nil
                } else if resource.OptionStatus[:1] == "2" {
```

A leading `0` is success and `1` is a Warning that is still treated as success, returning `SerialNum` as the device ID and `ResourceUUID` as the CDI device ID (`internal/cdi/fti/fm/client.go:196`). Back in the reconciler, `utils.CheckGPUVisible` (`internal/utils/gpus.go:185`) confirms the cluster sees the new device (`internal/controller/composableresource_controller.go:288`) before the state becomes `Online` (`internal/controller/composableresource_controller.go:293`). Detach is the reverse: `handleDetachingState` (`internal/controller/composableresource_controller.go:333`) drains the GPU with `utils.DrainGPU` (`internal/utils/gpus.go:330`) and then calls `RemoveResource` (`internal/controller/composableresource_controller.go:367`).

## Things that surprised me

The node-to-machine-UUID resolution is tightly coupled to bare-metal stacks. `getNodeMachineID` (`internal/cdi/fti/fm/client.go:416`) has two paths: on OpenShift it chases a chain of annotations starting from `machine.openshift.io/machine` (`internal/cdi/fti/fm/client.go:423`) through Metal3 objects; otherwise it strips the `fsas-cdi://` prefix off the Node's `spec.providerID` (`internal/cdi/fti/fm/client.go:457`).

The token cache pre-refreshes. `CachedToken` (`internal/cdi/fti/token.go:58`) holds an OAuth2 token behind a `sync.RWMutex` with a 30-second `leeway`, and `GetToken` (`internal/cdi/fti/token.go:74`) treats a token as expired `leeway` early so a call never races the real expiry. The credentials for the password grant in `Token` (`internal/cdi/fti/token.go:103`) come from a Kubernetes Secret.

One real sharp edge: `resource.OptionStatus[:1]` (`internal/cdi/fti/fm/client.go:195`) slices the first byte of the string directly. An empty `OptionStatus` from the Fabric Manager would panic the reconciler rather than return an error. It does not affect getting started, but it is the kind of input-trust gap worth knowing about in a fabric-facing client.
