# Internals

> Read from the source at commit `e8b5a0c`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/cmd` | Four binaries: `clusternet-agent`, `clusternet-scheduler`, `clusternet-controller-manager`, `clusternet-hub`. |
| `src/pkg/apis` | CRD type definitions for the `apps`, `clusters`, `proxies`, and `shadow` groups. |
| `src/pkg/scheduler` | Cluster scheduler framework: filter, score, predict, and bind plugins. |
| `src/pkg/controllermanager/deployer` | Expands Subscription into Base, then Base into Description. |
| `src/pkg/agent/deployer` | Child-side deployers (generic and Helm) that apply Descriptions. |
| `src/pkg/hub` | Aggregated API server, shadow registry, and proxy exchanger. |
| `src/pkg/predictor` | Resource predictor framework that estimates remaining cluster capacity. |

## Core data structures

All of these are CRDs under `src/pkg/apis`.

- `Subscription` and `SubscriptionSpec` (`src/pkg/apis/apps/v1alpha1/subscription.go:34`, `src/pkg/apis/apps/v1alpha1/subscription.go:43`) are the distribution input. `Subscribers` (`src/pkg/apis/apps/v1alpha1/subscription.go:92`) selects clusters, `Feeds` (`src/pkg/apis/apps/v1alpha1/subscription.go:103`) lists what to distribute, and `SchedulingStrategy` (`src/pkg/apis/apps/v1alpha1/subscription.go:65`) chooses between full replication and capacity-based dividing. The scheduler writes its output to `Status.BindingClusters`.
- `ManagedCluster`, `ManagedClusterSpec`, and `ManagedClusterStatus` (`src/pkg/apis/clusters/v1beta1/types.go:354`, `src/pkg/apis/clusters/v1beta1/types.go:191`, `src/pkg/apis/clusters/v1beta1/types.go:234`) represent one registered child. Status carries `NodeStatistics` (`src/pkg/apis/clusters/v1beta1/types.go:372`), `PodStatistics` (`src/pkg/apis/clusters/v1beta1/types.go:390`), and `ResourceUsage` (`src/pkg/apis/clusters/v1beta1/types.go:400`), updated by heartbeat and read by the scheduler's predict step.
- `Base` and `BaseSpec` (`src/pkg/apis/apps/v1alpha1/types.go:31`, `src/pkg/apis/apps/v1alpha1/base.go:20`) are the per-cluster intermediate form: the set of Feeds a single child should receive.
- `Description` and `DescriptionSpec` (`src/pkg/apis/apps/v1alpha1/description.go:35`, `src/pkg/apis/apps/v1alpha1/description.go:44`) are the rendered deploy unit, holding raw manifests and a deployer kind (Generic or Helm). This is the terminal object the agent or hub applies.
- `FeedInventory` and `ReplicaRequirements` (`src/pkg/apis/apps/v1alpha1/feedinventory.go:31`, `src/pkg/apis/apps/v1alpha1/feedinventory.go:67`) feed Dividing scheduling by recording the CPU and memory each Feed requests, so the predict step can compute how many replicas a cluster can hold.

Supporting types include `Manifest` (`src/pkg/apis/apps/v1alpha1/manifest.go:30`), `HelmChart` and `HelmRelease` (`src/pkg/apis/apps/v1alpha1/helm.go:37`, `src/pkg/apis/apps/v1alpha1/helm.go:211`), and the per-cluster and fleet-wide overrides `Localization` and `Globalization` (`src/pkg/apis/apps/v1alpha1/localization.go:31`, `src/pkg/apis/apps/v1alpha1/globalization.go:32`).

## A path worth tracing

Follow the scheduler's decision through to a generated Description.

The scheduler's per-Subscription loop pops an item, schedules it, and binds asynchronously. `scheduleOne` is at `src/pkg/scheduler/scheduler.go:287`, the queue pop at `src/pkg/scheduler/scheduler.go:288`, and the algorithm call at `src/pkg/scheduler/scheduler.go:346`. The generic algorithm `Schedule` (`src/pkg/scheduler/algorithm/generic.go:70`) runs filter (`src/pkg/scheduler/algorithm/generic.go:79`), predict (`src/pkg/scheduler/algorithm/generic.go:94`), prioritize (`src/pkg/scheduler/algorithm/generic.go:100`), then subgroup and select (`src/pkg/scheduler/algorithm/generic.go:106`, `src/pkg/scheduler/algorithm/generic.go:111`).

Binding does not create a Base. `DefaultBinder.Bind` (`src/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:57`) copies the Subscription, sets the binding result on its status, and patches the `status` subresource. The status write begins at `src/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:65`:

```go
subCopy := sub.DeepCopy()
subCopy.Status.BindingClusters = targetClusters.BindingClusters
subCopy.Status.Replicas = targetClusters.Replicas
subCopy.Status.SpecHash = utils.HashSubscriptionSpec(&subCopy.Spec)
subCopy.Status.DesiredReleases = len(targetClusters.BindingClusters)
```

The merge patch is sent to the `status` subresource at `src/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:83`. The controller manager then takes over: `populateBasesAndLocalizations` (`src/pkg/controllermanager/deployer/deployer.go:322`) loops over `sub.Status.BindingClusters` at `src/pkg/controllermanager/deployer/deployer.go:335`, builds a Base template at `src/pkg/controllermanager/deployer/deployer.go:357`, and creates it at `src/pkg/controllermanager/deployer/deployer.go:450`. `handleBase` (`src/pkg/controllermanager/deployer/deployer.go:703`) then renders each Base into a Description in `populateDescriptions` (`src/pkg/controllermanager/deployer/deployer.go:755`), building the template at `src/pkg/controllermanager/deployer/deployer.go:834` and creating it at `src/pkg/controllermanager/deployer/deployer.go:968`. Finally the agent applies it at `src/pkg/agent/deployer/generic/generic.go:131`.

```text
scheduleOne -> Schedule -> DefaultBinder.Bind (patch status)
  -> populateBasesAndLocalizations -> Bases.Create
  -> handleBase -> populateDescriptions -> Descriptions.Create
  -> agent handleDescription -> ApplyDescription
```

## Things that surprised me

The shadow API rewrites a normal `kubectl apply` into a CRD. `clusternet-hub` registers shadow REST handlers for registered resource types. The interesting part is `REST.Create` (`src/pkg/hub/registry/shadow/template/rest.go:105`): the submitted object is never materialised. It is validated with a dry run at `src/pkg/hub/registry/shadow/template/rest.go:107`, then wrapped in a `Manifest` at `src/pkg/hub/registry/shadow/template/rest.go:113`:

```go
manifest := &appsapi.Manifest{
    ObjectMeta: metav1.ObjectMeta{
        Name:      r.getNormalizedManifestName(result.GetNamespace(), result.GetName()),
        Namespace: r.reservedNamespace,
        Labels:    result.GetLabels(), // reuse labels from original object, which is useful for label selector
    },
    Template: runtime.RawExtension{
        Object: result,
    },
}
```

That Manifest is created at `src/pkg/hub/registry/shadow/template/rest.go:132`. The effect: users keep their existing manifests and `kubectl`, and the parent stores them as distribution material.

The proxy path is the second non-obvious piece. A child behind NAT or a firewall is still reachable because the hub holds a reverse WebSocket tunnel using Rancher's `remotedialer`. The hub constructs the dialer server at `src/pkg/hub/exchanger/exchanger.go:76`, fetches a per-cluster dialer and wires it into a transport's dial path at `src/pkg/hub/exchanger/exchanger.go:94`, and serves proxy connects through `ProxyConnect` at `src/pkg/hub/exchanger/exchanger.go:119`. The child dials out and the parent re-dials requests back through that connection, so the parent never needs inbound reachability to the child. That is the literal source of the "Cluster Internet" name.
