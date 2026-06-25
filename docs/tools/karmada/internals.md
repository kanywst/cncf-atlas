# Internals

> Read from the source at commit `658499d`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/` | One cobra binary per component; each `main` calls an `app.NewXxxCommand`. |
| `pkg/detector` | Watches templates, claims matching policies, builds `ResourceBinding` objects. |
| `pkg/scheduler` | Reacts to bindings and runs the filter/score/select/assign pipeline. |
| `pkg/scheduler/core` | The scheduling algorithm: `Schedule`, `SelectClusters`, `AssignReplicas`. |
| `pkg/controllers/binding` | Turns a scheduled binding into per-cluster `Work`. |
| `pkg/controllers/execution` | Applies `Work` manifests into member clusters. |
| `pkg/apis` | CRD types: `ResourceBinding`, `Work`, `PropagationPolicy`, `Cluster`. |
| `pkg/resourceinterpreter` | The interpreter framework and the Lua VM for custom CRDs. |
| `pkg/karmadactl` | The CLI, including `init` to bootstrap a control plane. |
| `operator/` | Manages Karmada instances via a `Karmada` CRD. |

## Core data structures

- `workv1alpha2.ResourceBindingSpec` (`pkg/apis/work/v1alpha2/binding_types.go:71`) is the scheduling workbench. It holds the `Resource` reference, `Replicas`, `ReplicaRequirements`, `Placement`, and the scheduling result `Clusters []TargetCluster` (`binding_types.go:100`). A newer `Components []Component` field (`binding_types.go:89`) targets multi-pod-template workloads (distributed training) and is gated behind the `MultiplePodTemplatesScheduling` feature gate.
- `workv1alpha2.TargetCluster` (`binding_types.go:287`) is one cluster plus its assigned replica count, the unit of a scheduling result.
- `workv1alpha1.Work` / `WorkSpec` (`pkg/apis/work/v1alpha1/work_types.go:44,57`) is the envelope delivered to a member cluster. Its `WorkloadTemplate` (`work_types.go:77`) carries `Manifests []Manifest` (`work_types.go:84`), each a `runtime.RawExtension` wrapping an arbitrary Kubernetes resource.
- `policyv1alpha1.PropagationSpec` (`pkg/apis/policy/v1alpha1/propagation_types.go:62`) selects targets with `ResourceSelectors []ResourceSelector` (`propagation_types.go:223`) and places them with `Placement` (`propagation_types.go:471`).

## A path worth tracing

Watch how a scheduled binding becomes `Work`. The binding controller's `Reconcile` (`pkg/controllers/binding/binding_controller.go:70`) calls `syncBinding` (`binding_controller.go:110`), which calls `ensureWork` (`pkg/controllers/binding/common.go:53`). For each target cluster, `ensureWork` clones the workload and overwrites its replica count with the scheduled value rather than trusting the template:

```go
// When syncing workloads to member clusters, the controller MUST strictly adhere to the scheduling results
```

That comment sits at `pkg/controllers/binding/common.go:80`. The replica revision happens for workload types (`common.go:86`), override policies are applied next (`ApplyOverridePolicies`, `common.go:109`), and the `Work` object is built with a per-cluster `ObjectMeta` (`common.go:134`) in namespace `karmada-es-<cluster>` (`pkg/util/names/names.go:80,92`). The execution controller then takes over: `Reconcile` (`pkg/controllers/execution/execution_controller.go:82`) to `syncToClusters` (`execution_controller.go:266`), which unmarshals each manifest and calls `tryCreateOrUpdateWorkload` (`execution_controller.go:311`), reaching `ObjectWatcher.Create`/`Update` (`execution_controller.go:324,332`).

## Things that surprised me

The genuinely non-obvious design choice is the **Lua-based Resource Interpreter Framework**. Rather than hard-coding how to handle every workload type, Karmada lets you inject interpretation logic as Lua scripts without recompiling Go. The interface in `pkg/resourceinterpreter/interpreter.go:50` declares operations like `GetReplicas`, `ReviseReplica`, and `AggregateStatus`. The declarative implementation builds a pool of gopher-lua VMs in `New` (`pkg/resourceinterpreter/customized/declarative/luavm/lua.go:46`) and runs user-defined functions via `RunScript` (`lua.go:74`), with typed entry points `GetReplicas` (`lua.go:129`) and `ReviseReplica` (`lua.go:185`). Scripts ship on a `ResourceInterpreterCustomization` CRD. The repo also bundles built-in interpreters under `default/native` and `default/thirdparty/resourcecustomizations` for Flux, Argo, Ray, Kubeflow, and Flink. This is what lets "no application changes" extend to arbitrary CRDs such as `FlinkDeployment`, `RayJob`, and `PyTorchJob`: their replica splitting and status aggregation are described in Lua, not Go.

The second surprise is the deliberate distrust of the template's own replica field. The scheduler accounts replicas as a scarce, scheduled resource, and `ensureWork` overwrites the template value on every sync (`pkg/controllers/binding/common.go:80-96`) so a workload cannot quietly route around the scheduler's quota and queue accounting by setting its own count.
