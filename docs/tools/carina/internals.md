# Internals

> Read from the source at commit `aec3a9f`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/carina-controller` | Control-plane entry point that runs the CSI (Container Storage Interface) controller. |
| `cmd/carina-node` | Node agent entry point that runs the reconciler and device manager. |
| `pkg/csidriver/driver` | CSI gRPC services; `controller.go` is the controller logic. |
| `pkg/csidriver/driver/k8s` | Creates `LogicVolume` resources and polls their status. |
| `controllers` | The node-side `LogicVolume` reconciler that calls into the device manager. |
| `pkg/devicemanager` | LVM (Logical Volume Manager), partition, and host-path implementations plus the shell executor. |
| `scheduler/schedulerplugin/localstorage` | The kube-scheduler `Filter` and `Score` plugin. |
| `api/v1`, `api/v1beta1`, `api/api.go` | Custom resource types and the LVM/disk Go models. |

## Core data structures

The `LogicVolume` CRD (custom resource definition) is the contract between controller and node. Its spec is defined at `api/v1/logicvolume_types.go:29` and the top-level type at `api/v1/logicvolume_types.go:63`. The spec carries `NodeName`, `Size`, `DeviceGroup`, `Pvc`, and `NameSpace`; the status carries `VolumeID`, `Code` (a gRPC code), `CurrentSize`, `DeviceMajor`, and `DeviceMinor` (`api/v1/logicvolume_types.go:43`). The resource is cluster-scoped with the short name `lv` (`api/v1/logicvolume_types.go:60`). One PVC maps to one `LogicVolume`. Idempotency comes from `IsCompatibleWith`, which treats a same-name, same-size object as compatible (`api/v1/logicvolume_types.go:72`):

```go
// IsCompatibleWith returns true if the LogicalVolume is compatible.
func (lv *LogicVolume) IsCompatibleWith(lv2 *LogicVolume) bool {
    if lv.Name != lv2.Name {
        return false
    }
    if lv.Spec.Size.Cmp(lv2.Spec.Size) != 0 {
        return false
    }
    return true
}
```

The `NodeStorageResource` CRD is the capacity source of truth. Its status is defined at `api/v1beta1/nodestorageresource_types.go:36`, with `Capacity` and `Allocatable` as `map[string]resource.Quantity` (`api/v1beta1/nodestorageresource_types.go:45`), plus `VgGroups`, `Disks`, and `RAIDs` (`api/v1beta1/nodestorageresource_types.go:51`). The top-level type is at `api/v1beta1/nodestorageresource_types.go:65`. The LVM groups are modeled by `api.VgGroup` (`api/api.go:4`), whose `VGFree` field (`api/api.go:10`) drives capacity checks; `api.PVInfo` (`api/api.go:15`) and `api.Disk` (`api/api.go:25`) model physical volumes and disks.

The node agent's hub is `DeviceManager` (`pkg/devicemanager/manager.go:54`), which holds the three volume backends `VolumeManager`, `Partition`, and `Host` (`pkg/devicemanager/manager.go:58`). `NewDeviceManager` injects a shared `exec.CommandExecutor` into each backend (`pkg/devicemanager/manager.go:67`), for example into `lvmd.Lvm2Implement` (`pkg/devicemanager/manager.go:73`). An internal event bus, `VolumeEvent` carrying a `Trigger` (`pkg/devicemanager/manager.go:48`), notifies capacity recalculation.

## A path worth tracing

Three volume types branch in `createLV` (`controllers/logicvolume_controller.go:163`): LVM, raw partition, and host directory. Following the LVM type to the shell is the most instructive path. After the reconciler retries `CreateVolume` (`controllers/logicvolume_controller.go:165`), `LocalVolumeImplement.CreateVolume` does the capacity check. The reserved-space guard is exact:

```go
if vgInfo.VGFree-size < carina.DefaultReservedSpace-carina.DefaultEdgeSpace { ////avoid edge conditions
    log.Warnf("%s don't have enough space, reserved 10g", vgName)
    return errors.New(carina.ResourceExhausted)
}
```

That check is at `pkg/devicemanager/volume/volume.go:65`. `DefaultReservedSpace` is `10 << 30` and `DefaultEdgeSpace` is `1 << 30` (`constants.go:27`), so a volume is refused once the free space would drop below 9 GiB. When the check passes, `LVCreateFromVG` builds the command (`pkg/devicemanager/lvmd/lvm.go:258`):

```go
func (lv2 *Lvm2Implement) LVCreateFromVG(lv, vg string, size uint64, tags []string, stripe uint, stripeSize string) error {
    args := []string{"-n", lv, "-L", fmt.Sprintf("%vg", size>>30), "-W", "y", "-y"}
```

The size is `size>>30`, so volumes are created at whole-GiB granularity. The final hop is the literal shell call `lv2.Executor.ExecuteCommand("lvcreate", args...)` (`pkg/devicemanager/lvmd/lvm.go:274`).

## Things that surprised me

The controller does no disk work and learns the result by polling. After creating the `LogicVolume` it loops with a 100ms `time.After` (`pkg/csidriver/driver/k8s/logicvolume_service.go:210`) and only returns when the node agent has written `.status.volumeID` (`pkg/csidriver/driver/k8s/logicvolume_service.go:224`). There is no watch and no callback; the API server is the channel.

bcache tiering is a separate code path, not a flag on the normal one. When a `cache-disk-ratio` parameter is set, `CreateVolume` hands off to `CreateBcacheVolume` (`pkg/csidriver/driver/controller.go:472`) before any single-volume logic runs. That function creates two LVM volumes, a slow backend and a fast cache, and makes the backend the owner of the cache so they are deleted together (`pkg/csidriver/driver/controller.go:557`). The cache policy defaults to `writethrough` unless `writeback` or `writearound` is requested (`pkg/csidriver/driver/controller.go:496`).

The success path writes a prefixed volume id rather than a raw name. On success the reconciler sets `lv.Status.VolumeID = carina.VolumePrefix + lv.Name` (`controllers/logicvolume_controller.go:178`), where `VolumePrefix` is `volume-` (`constants.go:98`), so the device path and the CRD name differ by that prefix.
