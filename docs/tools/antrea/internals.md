# Internals

> Read from the source at commit `65be43d`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `pkg/agent/cniserver/` | CNI ADD/DEL/CHECK handling and pod interface setup |
| `pkg/agent/openflow/` | OVS pipeline abstraction; `pipeline.go` defines tables, `client.go` the high-level API |
| `pkg/agent/interfacestore/` | Node-local cache of interfaces (pod, gateway, tunnel, uplink) |
| `pkg/agent/controller/networkpolicy/` | Agent-side watchers that consume computed policy |
| `pkg/controller/networkpolicy/` | Controller-side policy computation |
| `pkg/apiserver/`, `pkg/apis/controlplane/` | The aggregated API agents watch |

## Core data structures

The agent keeps one type for every interface it manages. `InterfaceConfig`
(`pkg/agent/interfacestore/types.go:103`) carries the common fields and embeds
four optional structs, so a single value can represent a pod, a gateway, a
tunnel, or an uplink:

```go
type InterfaceConfig struct {
    Type InterfaceType
    // Unique name of the interface, also used for the OVS port name.
    InterfaceName string
    IPs           []net.IP
    MAC           net.HardwareAddr
    // VLAN ID of the interface
    VLANID uint16
    *OVSPortConfig
    *ContainerInterfaceConfig
    *TunnelInterfaceConfig
    *EntityInterfaceConfig
}
```

`OVSPortConfig` (`pkg/agent/interfacestore/types.go:59`) holds the `PortUUID`
and `OFPort` that tie the cache entry to the OVS port. The cache is reached
through the `InterfaceStore` interface
(`pkg/agent/interfacestore/types.go:119`), which exposes lookups by name,
container ID, OFPort, IP, and entity, so the agent can answer "which interface
is this?" from whatever key a code path holds.

On the controller side the computed policy is three message types in
`pkg/apis/controlplane`: `AppliedToGroup` (`pkg/apis/controlplane/types.go:32`)
is the set of members a policy applies to, `AddressGroup`
(`pkg/apis/controlplane/types.go:154`) is the IP set a rule's from/to
references, and `NetworkPolicy` (`pkg/apis/controlplane/types.go:221`) is the
computed policy. The membership unit is `GroupMember`
(`pkg/apis/controlplane/types.go:80`).

## A path worth tracing

The central design is computing policy once in the controller and pushing it
out. `NetworkPolicyController` (`pkg/controller/networkpolicy/networkpolicy_controller.go:136`)
aggregates informers for Kubernetes NetworkPolicy, Antrea ClusterNetworkPolicy,
Antrea NetworkPolicy, Tier, ClusterGroup, Namespace, Service, and Node, and
turns them into the three group types above. Those types are served from an
aggregated API server. The REST storage is built in `installAPIGroup`:

```go
    addressGroupStorage := addressgroup.NewREST(c.extraConfig.addressGroupStore)
    appliedToGroupStorage := appliedtogroup.NewREST(c.extraConfig.appliedToGroupStore)
    networkPolicyStorage := networkpolicy.NewREST(c.extraConfig.networkPolicyStore)
```

That is `pkg/apiserver/apiserver.go:206` through `pkg/apiserver/apiserver.go:208`,
and the handlers are bound to their API paths starting at
`pkg/apiserver/apiserver.go:221` (`cpv1beta2Storage["addressgroups"]`). On each
node the agent watches this API with three watchers declared together:
`networkPolicyWatcher` (`pkg/agent/controller/networkpolicy/networkpolicy_controller.go:149`),
`appliedToGroupWatcher` (`pkg/agent/controller/networkpolicy/networkpolicy_controller.go:150`),
and `addressGroupWatcher` (`pkg/agent/controller/networkpolicy/networkpolicy_controller.go:151`).
Each agent receives only the groups relevant to its own node, so traffic and CPU
stay flat as the cluster grows. This is the scalability lever.

## Things that surprised me

The OpenFlow pipeline is organized as a grid of stage by pipeline, not a flat
list of tables. Each table is declared with `newTable(name, stage, pipeline,
...)` in `pkg/agent/openflow/pipeline.go`. The root is
`PipelineRootClassifierTable` (`pkg/agent/openflow/pipeline.go:115`), which
branches to the IP, ARP, and multicast sub-pipelines:

```go
    PipelineRootClassifierTable = newTable("PipelineRootClassifier", stageStart, pipelineRoot, defaultDrop)
```

From there the IP pipeline walks stages: `ClassifierTable`
(`pkg/agent/openflow/pipeline.go:128`), `ServiceLBTable`
(`pkg/agent/openflow/pipeline.go:145`), `EgressRuleTable`
(`pkg/agent/openflow/pipeline.go:154`), `L3ForwardingTable`
(`pkg/agent/openflow/pipeline.go:159`), `AntreaPolicyIngressRuleTable`
(`pkg/agent/openflow/pipeline.go:174`), and `IngressRuleTable`
(`pkg/agent/openflow/pipeline.go:175`). Naming a table by stage and pipeline,
rather than a fixed number, lets features insert tables without renumbering the
whole flow.

The per-pod flows are assembled in one place and written as a batch.
`InstallPodFlows` (`pkg/agent/openflow/client.go:643`) starts the flow list with
the classifier and L2 calc flows:

```go
    flows := []binding.Flow{
        c.featurePodConnectivity.podClassifierFlow(ofPort, isAntreaFlexibleIPAM, labelID),
        c.featurePodConnectivity.l2ForwardCalcFlow(podInterfaceMAC, ofPort),
    }
```

It then appends ARP spoof-guard (`pkg/agent/openflow/client.go:659`), IP
spoof-guard (`pkg/agent/openflow/client.go:662`), and L3 forwarding to the pod
(`pkg/agent/openflow/client.go:664`), and commits the whole set with
`c.modifyFlows` (`pkg/agent/openflow/client.go:680`). Building the list first
and writing once keeps the data plane change atomic for a pod.
