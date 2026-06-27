# 内部実装

> コミット `65be43d` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `pkg/agent/cniserver/` | CNI ADD/DEL/CHECK の処理と Pod インターフェース構成 |
| `pkg/agent/openflow/` | OVS パイプラインの抽象。`pipeline.go` がテーブル定義、`client.go` が高レベル API |
| `pkg/agent/interfacestore/` | Node ローカルのインターフェースキャッシュ (Pod / gateway / tunnel / uplink) |
| `pkg/agent/controller/networkpolicy/` | 計算済みポリシーを消費する Agent 側の watcher |
| `pkg/controller/networkpolicy/` | Controller 側のポリシー計算 |
| `pkg/apiserver/`, `pkg/apis/controlplane/` | Agent が watch するアグリゲート API |

## 中核データ構造

Agent は管理するすべてのインターフェースを 1 つの型で持つ。`InterfaceConfig` (`pkg/agent/interfacestore/types.go:103`) は共通フィールドを持ち、4 つの任意 struct を埋め込むため、1 つの値で Pod / gateway / tunnel / uplink を表せる:

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

`OVSPortConfig` (`pkg/agent/interfacestore/types.go:59`) は `PortUUID` と `OFPort` を持ち、キャッシュエントリを OVS ポートに結びつける。キャッシュは `InterfaceStore` インターフェース (`pkg/agent/interfacestore/types.go:119`) 経由で引く。これは名前・containerID・OFPort・IP・entity による検索を提供し、コードパスが持つどのキーからでも「これはどのインターフェースか」を答えられる。

Controller 側では計算済みポリシーが `pkg/apis/controlplane` の 3 つのメッセージ型になる。`AppliedToGroup` (`pkg/apis/controlplane/types.go:32`) はポリシーを適用するメンバ集合、`AddressGroup` (`pkg/apis/controlplane/types.go:154`) はルールの from/to が参照する IP 集合、`NetworkPolicy` (`pkg/apis/controlplane/types.go:221`) は計算済みポリシーである。メンバの単位は `GroupMember` (`pkg/apis/controlplane/types.go:80`) である。

## 追う価値のあるパス

中核設計は、ポリシーを Controller で一度計算して push することである。`NetworkPolicyController` (`pkg/controller/networkpolicy/networkpolicy_controller.go:136`) は Kubernetes NetworkPolicy、Antrea ClusterNetworkPolicy、Antrea NetworkPolicy、Tier、ClusterGroup、Namespace、Service、Node の informer を集約し、上記 3 つのグループ型に変換する。これらはアグリゲート API サーバから配信される。REST ストレージは `installAPIGroup` で構築される:

```go
    addressGroupStorage := addressgroup.NewREST(c.extraConfig.addressGroupStore)
    appliedToGroupStorage := appliedtogroup.NewREST(c.extraConfig.appliedToGroupStore)
    networkPolicyStorage := networkpolicy.NewREST(c.extraConfig.networkPolicyStore)
```

これは `pkg/apiserver/apiserver.go:206` から `pkg/apiserver/apiserver.go:208` で、ハンドラは `pkg/apiserver/apiserver.go:221` (`cpv1beta2Storage["addressgroups"]`) 以降で API パスへ束ねられる。各 Node では Agent がこの API を 3 つの watcher で監視する。これらは並んで宣言される: `networkPolicyWatcher` (`pkg/agent/controller/networkpolicy/networkpolicy_controller.go:149`)、`appliedToGroupWatcher` (`pkg/agent/controller/networkpolicy/networkpolicy_controller.go:150`)、`addressGroupWatcher` (`pkg/agent/controller/networkpolicy/networkpolicy_controller.go:151`)。各 Agent は自 Node に関係するグループだけを受け取るため、クラスタが大きくなってもトラフィックと CPU は平坦である。これがスケーラビリティの肝である。

## 読んで驚いた点

OpenFlow パイプラインは stage × pipeline のグリッドで構成され、フラットなテーブル一覧ではない。各テーブルは `pkg/agent/openflow/pipeline.go` で `newTable(name, stage, pipeline, ...)` により宣言される。起点は `PipelineRootClassifierTable` (`pkg/agent/openflow/pipeline.go:115`) で、IP / ARP / Multicast のサブパイプラインへ分岐する:

```go
    PipelineRootClassifierTable = newTable("PipelineRootClassifier", stageStart, pipelineRoot, defaultDrop)
```

そこから IP パイプラインは stage を辿る: `ClassifierTable` (`pkg/agent/openflow/pipeline.go:128`)、`ServiceLBTable` (`pkg/agent/openflow/pipeline.go:145`)、`EgressRuleTable` (`pkg/agent/openflow/pipeline.go:154`)、`L3ForwardingTable` (`pkg/agent/openflow/pipeline.go:159`)、`AntreaPolicyIngressRuleTable` (`pkg/agent/openflow/pipeline.go:174`)、`IngressRuleTable` (`pkg/agent/openflow/pipeline.go:175`)。テーブルを固定番号ではなく stage と pipeline で命名することで、フロー全体を振り直さずに機能がテーブルを差し込める。

per-pod のフローは 1 箇所で組み立てられ、バッチで書き込まれる。`InstallPodFlows` (`pkg/agent/openflow/client.go:643`) は classifier と L2 calc フローでリストを始める:

```go
    flows := []binding.Flow{
        c.featurePodConnectivity.podClassifierFlow(ofPort, isAntreaFlexibleIPAM, labelID),
        c.featurePodConnectivity.l2ForwardCalcFlow(podInterfaceMAC, ofPort),
    }
```

続けて ARP spoof-guard (`pkg/agent/openflow/client.go:659`)、IP spoof-guard (`pkg/agent/openflow/client.go:662`)、Pod への L3 転送 (`pkg/agent/openflow/client.go:664`) を append し、`c.modifyFlows` (`pkg/agent/openflow/client.go:680`) で全体を一括書き込みする。先にリストを組んでから一度で書くことで、Pod のデータプレーン変更を原子的に保つ。
