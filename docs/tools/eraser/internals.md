# Internals

> Read from the source at commit `20576a24`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `main.go` | Entry point: starts the manager and registers the controllers |
| `api/` | CRD types; `v1` is the storage version, with `v1alpha1/2/3` plus `unversioned` config types and `zz_generated.conversion.go` |
| `controllers/` | `imagelist`, `imagejob`, `imagecollector`, `configmap`, and `util` reconcilers |
| `pkg/cri/` | CRI client: interface in `client.go`, `v1` and `v1alpha2` implementations, version fallback in `newClientWithFallback` |
| `pkg/remover/` | The deletion logic: `remover.go` and `helpers.go` |
| `pkg/collector/` | Collects the images present on a node |
| `pkg/scanners/trivy/`, `pkg/scanners/template/` | Trivy scanner and the generic `ImageProvider` interface |
| `pkg/utils/` | `GetRunningImages`, `GetNonRunningImages`, `IsExcluded`, security-context helpers |

## Core data structures

`unversioned.Image` is the normal form Eraser reduces a CRI image to: `ImageID`, `Names []string`, and `Digests []string` (`api/v1/imagejob_types.go:23-27`). It lets one physical image be looked up by its ID, any of its tags, or any of its digests.

The running and non-running sets are both `map[string]string` where the key is any of an image's identifiers (ID, name, or digest) and the value is the imageID (`pkg/utils/utils.go:129`, `pkg/utils/utils.go:149`). Each image is registered under all of its identifiers at once, so a lookup by tag, by digest, or by ID all resolve to the same imageID. This multi-key map is the whole basis of the "never delete a running image" guarantee.

`ImageListSpec` holds the delete targets as a plain `Images []string` (`api/v1/imagelist_types.go:20-23`); a `*` entry means prune everything non-running. `ImageJobStatus` tracks a sweep with `Failed`, `Succeeded`, `Desired`, `Skipped`, a `Phase`, and a `DeleteAfter` timestamp for delayed Job cleanup (`api/v1/imagejob_types.go:41-64`).

## A path worth tracing

The code worth reading is how a worker decides an image is safe to delete. It happens in `removeImages` (`pkg/remover/helpers.go:11`), which builds two maps and then walks the target list.

First it gets the ground truth from the runtime: `ListImages` for every image on the node and `ListContainers` for every running container (`pkg/remover/helpers.go:17`, `pkg/remover/helpers.go:45`). `GetRunningImages` walks the containers, and for each container's imageID it registers the imageID and every one of its Names and Digests into the running map (`pkg/utils/utils.go:129-146`). So any name or digest tied to an imageID that some container uses is treated as running.

`GetNonRunningImages` then takes every image on the node and registers, under all three keys, only the imageIDs absent from the running map (`pkg/utils/utils.go:149-169`).

```text
removeImages
  ListImages / ListContainers          -> node ground truth
  GetRunningImages                       -> map[id|name|digest] for in-use images
  GetNonRunningImages                    -> map[id|name|digest] for the rest
  for each target:
    hit in nonRunning and not excluded   -> DeleteImage
    hit in running                       -> skip, log "image is running"
    hit in neither                       -> log "image is not on node"
```

The delete loop pulls each target and acts on which map it hits (`pkg/remover/helpers.go:66-96`). A target found in the non-running map is deleted unless it is on the exclusion list (`pkg/remover/helpers.go:72-88`). A target found in the running map is explicitly skipped with an "image is running" log (`pkg/remover/helpers.go:90-94`). A target in neither is simply not on the node. A `*` target sets a `prune` flag that, after the loop, deletes every non-running, non-excluded image (`pkg/remover/helpers.go:67-68`, `pkg/remover/helpers.go:99-126`).

## Things that surprised me

The running-versus-not decision is made per imageID, not per name. If an image is in use under one tag, every other tag and digest that resolves to the same imageID is also treated as running and will not be deleted, because they were all registered into the running map together (`pkg/utils/utils.go:133-146`). The safety property against accidental deletion lives entirely in how this multi-key map is populated.

Workers are single-shot Pods from a Job, not a DaemonSet. Each finishes and is garbage-collected along with its PodTemplate and ConfigMap by owner reference plus a `deleteAfter` delay, so nothing resident stays on the node. The cost of avoiding a resident agent is that the controller carries the more intricate job-lifetime logic (`controllers/imagelist/imagelist_controller.go:179-255`).

The CRI client keeps a `v1` and a `v1alpha2` path and picks whichever the runtime answers to, trying each `Version` call in turn (`pkg/cri/client.go:47-67`). That fallback is why Eraser still attaches to older containerd and CRI-O runtimes.

Configuration is not a CRD. The two CRDs are only `ImageList` and `ImageJob`; everything tunable is read from a ConfigMap-based `EraserConfig` under `api/unversioned/config`, keeping the resource surface deliberately small.
