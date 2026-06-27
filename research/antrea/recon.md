# recon: Antrea

調査メモ。Antrea は Open vSwitch (OVS) をデータプレーンに使う Kubernetes ネイティブな CNI (Container Network Interface) 実装。L3/L4 でネットワークとセキュリティ (NetworkPolicy) を提供する。

## 基本情報

- repo: `antrea-io/antrea`
- pinned commit: `65be43ddeb1e26c3d1450fb085c1db17ee87934e` (2026-06-24) / 近いタグ: `v2.6.2` (2026-06-13 リリース、HEAD はこれより後の main)
- 言語 / ビルド: Go (`go 1.26.0`、`module antrea.io/antrea/v2`) / `make` (`make build` でエージェント・コントローラを ubuntu イメージとしてビルド、`make bin` でバイナリ)
- ライセンス: Apache License 2.0 (リポジトリ `LICENSE` の冒頭で確認。各 `.go` ファイル冒頭にも Apache-2.0 ヘッダ)
- 主なエントリポイント: `cmd/antrea-agent/main.go` (cobra コマンド `newAgentCommand`)、`cmd/antrea-controller/main.go`、`cmd/antrea-cni/main.go` (CNI バイナリ)、`cmd/flow-aggregator`、`cmd/antctl`
- CNCF 成熟度: Sandbox (2021-04-28 受理)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Service Mesh & Networking

## 歴史の素材

- 2019-11-18: VMware が KubeCon NA (San Diego) で「Project Antrea」を発表。OVS をデータプレーンに使う OSS の CNI プラグインとして公開。当初は VMware の Tanzu GitHub org に置かれた。リポジトリの作成日は 2019-10-25 (`gh repo view` の `createdAt`)。出典: VMware Open Source Blog [announcing-project-antrea](https://blogs.vmware.com/opensource/2019/11/18/announcing-project-antrea/)。
- OVS 採用の動機: iptables よりルール数が増えても性能が出る、Linux/Windows 両対応 (portability)、IPFIX/NetFlow/sFlow など既存ネットワークツールとの統合、OVS の programmability による機能拡張の速さ。出典: 同上の発表ブログ。
- 2021-04-15: Project Antrea 1.0 リリース。出典: VMware Blog [its-here-project-antrea-1-0](https://blogs.vmware.com/opensource/2021/04/15/its-here-project-antrea-1-0/)。
- 2021-04-28: CNCF に Sandbox レベルで受理 (公式文言「Antrea was accepted to CNCF on April 28, 2021 at the Sandbox maturity level」)。発表は 2021-05-05。出典: [CNCF projects/antrea](https://www.cncf.io/projects/antrea/)、[Antrea joins CNCF Sandbox (antrea.io)](https://antrea.io/posts/2021-05-05-antrea-joins-cncf-sandbox/)。
- リポジトリは後に独立 org `antrea-io/antrea` へ移った (現在の canonical repo)。Go module も `antrea.io/antrea/v2` を名乗る。
- VMware の vSphere Kubernetes Service (VKS) のデフォルト CNI として採用されている。出典: The New Stack [VMware's Antrea Brings Programmable Networks to Kubernetes](https://thenewstack.io/vmwares-antrea-brings-programmable-networks-to-kubernetes/)。

## アーキテクチャの素材

3 つの主要バイナリで構成される。

- Antrea Controller (`cmd/antrea-controller`, `pkg/controller/...`): Kubernetes の NetworkPolicy と Antrea 独自 CRD (CRD = Custom Resource Definition) を監視し、内部表現に計算してアグリゲート API サーバ経由で各 Node のエージェントへ配信する。Deployment として 1 つ動く。
- Antrea Agent (`cmd/antrea-agent`, `pkg/agent/...`): 各 Node に DaemonSet で動く。OVS ブリッジ (`br-int`) を管理し、Pod インターフェースの接続、OpenFlow エントリのインストール、ルーティング/トンネル設定、NetworkPolicy のデータプレーンへの落とし込みを行う。
- Antrea CNI (`cmd/antrea-cni`): kubelet から呼ばれる薄い実行ファイル。gRPC でローカルの Agent (CNIServer) に ADD/DEL/CHECK を転送するだけ。`cmd/antrea-cni/main.go:29` で `skel.CNIFuncs{Add: cni.ActionAdd.Request, ...}` を登録する。

「ポリシーをコントローラ側で計算し API で配信する」点は内部実装節の非自明な設計判断を参照。

### 代表オペレーションのトレース: Pod 起動時の CNI ADD

kubelet が Pod を作るとき CNI ADD が走り、OVS にポートと OpenFlow ルールが入るまでを追う。pin した commit で確認した `file:line` を残す。

1. `cmd/antrea-cni/main.go:29` — CNI バイナリが `cni.ActionAdd.Request` を ADD ハンドラに登録。Agent へ gRPC リクエストを送る。
2. `pkg/agent/cniserver/server.go:433` — `CNIServer.CmdAdd`。リクエスト検証 (`validateRequestMessage`)、`podNetworkWait` の待機 (`server.go:449`)、失敗時ロールバックの defer (`server.go:462`)、同一 Pod の CNI 呼び出し直列化ロック (`server.go:477`)。
3. `pkg/agent/cniserver/server.go:498` — `ipam.ExecIPAMAdd(...)` で IPAM ドライバから Pod の IP を確保。
4. `pkg/agent/cniserver/server.go:515` — `s.podConfigurator.configureInterfaces(...)` を呼ぶ。
5. `pkg/agent/cniserver/pod_configuration.go:244` — `configureInterfacesCommon`。`pkg/agent/cniserver/pod_configuration.go:248` の `ifConfigurator.configureContainerLink` で veth ペアを作成し container netns 側を設定。
6. `pkg/agent/cniserver/pod_configuration_linux.go:34` — `connectInterfaceToOVS`。host 側 veth 名を OVS ポート名にし (`pod_configuration_linux.go:41`)、`createOVSPort` で OVS ポートを作成 (`pod_configuration_linux.go:48`)、`GetOFPort` で ofport を取得 (`pod_configuration_linux.go:63`)。
7. `pkg/agent/cniserver/pod_configuration_linux.go:68` — `pc.ofClient.InstallPodFlows(...)` で OpenFlow エントリを入れる。続けて `pod_configuration_linux.go:75` で `ifaceStore.AddInterface(containerConfig)` がローカルキャッシュへ登録。
8. `pkg/agent/openflow/client.go:643` — `client.InstallPodFlows`。`client.go:653` の `podClassifierFlow`、`client.go:654` の `l2ForwardCalcFlow`、`client.go:659` の `arpSpoofGuardFlow`、`client.go:662` の `podIPSpoofGuardFlow`、`client.go:664` の `l3FwdFlowToPod` を組み立て、`client.go:680` の `c.modifyFlows(...)` で OVS に一括反映。

戻りで `server.go:538` が CNI Result を返し kubelet に IP が渡る。エラー時は `server.go:462` の defer が `cmdDel` を呼んで OVS ポートと veth を巻き戻す。

## 内部実装の素材

ディレクトリの当たり所:

- `pkg/agent/cniserver/` — CNI ADD/DEL/CHECK の実体。Pod インターフェース構成。
- `pkg/agent/openflow/` — OVS パイプラインの抽象。`pipeline.go` にテーブル定義、`client.go` に高レベル API (`InstallPodFlows`, `InstallPolicyRuleFlows` 等)。
- `pkg/agent/interfacestore/` — Node ローカルのインターフェースキャッシュ。
- `pkg/controller/networkpolicy/` — Controller 側のポリシー計算 (k8s NetworkPolicy + Antrea(C)NP + AdminNetworkPolicy + ClusterGroup)。
- `pkg/apiserver/`, `pkg/apis/controlplane/` — エージェントが watch するアグリゲート API。

中核データ構造:

- `pkg/agent/interfacestore/types.go:103` — `InterfaceConfig`。Type / InterfaceName / IPs / MAC / VLANID に加え `*OVSPortConfig`, `*ContainerInterfaceConfig`, `*TunnelInterfaceConfig`, `*EntityInterfaceConfig` を埋め込む。1 つの型で Pod / gateway / tunnel / uplink を表す。`OVSPortConfig` は `types.go:59` (PortUUID, OFPort)。
- `pkg/agent/interfacestore/types.go:119` — `InterfaceStore` インターフェース。`GetInterfaceByOFPort`, `GetContainerInterface`, `GetNodeTunnelInterface` など ofport / containerID / Node 名など多軸のインデックス引きを提供。
- `pkg/apis/controlplane/types.go:32` — `AppliedToGroup` (ポリシーを適用する対象メンバ集合)。`types.go:154` — `AddressGroup` (ルールの from/to に出る IP 集合)。`types.go:221` — `NetworkPolicy` (計算済みの内部ポリシー)。`GroupMember` は `types.go:80`。
- `pkg/controller/networkpolicy/networkpolicy_controller.go:136` — `NetworkPolicyController` 構造体。複数の informer/lister (k8s NetworkPolicy, ACNP, ANNP, Tier, ClusterGroup, Namespace, Service, Node) を集約してグループを計算する。

非自明な設計判断: 「ポリシーをコントローラ側で計算しアグリゲート API で push 配信する」。各エージェントが全 Pod / 全 NetworkPolicy を watch して自前計算するのではなく、Controller が NetworkPolicy を `AppliedToGroup` / `AddressGroup` / `NetworkPolicy` という内部オブジェクトに事前計算し、Antrea 独自のアグリゲート API サーバ (`controlplane.antrea.io/v1beta2`) として公開する。登録は `pkg/apiserver/apiserver.go:206` (`addressgroup.NewREST`)、`apiserver.go:207` (`appliedtogroup.NewREST`)、`apiserver.go:208` (`networkpolicy.NewREST`) で、`apiserver.go:221` 以降が `cpv1beta2Storage["addressgroups"]` などに割り当てる。エージェント側は `pkg/agent/controller/networkpolicy/networkpolicy_controller.go:149` の `networkPolicyWatcher`、`:150` の `appliedToGroupWatcher`、`:151` の `addressGroupWatcher` でこの API を watch する。各エージェントは自 Node に関係するグループだけを受け取れるため、Pod 数・ポリシー数が増えてもエージェントの負荷とトラフィックがスケールする。これが Antrea のスケーラビリティの肝。

もう 1 つの読みどころ: OpenFlow パイプラインがステージ + パイプラインの二次元で整理されている (`pkg/agent/openflow/pipeline.go`)。テーブルは `newTable(name, stage, pipeline, ...)` で宣言される。例: `ClassifierTable` (`pipeline.go:128`, stageClassifier)、`ServiceLBTable` (`pipeline.go:145`, stagePreRouting)、`EgressRuleTable` (`pipeline.go:154`)、`L3ForwardingTable` (`pipeline.go:159`)、`AntreaPolicyIngressRuleTable` (`pipeline.go:174`)、`IngressRuleTable` (`pipeline.go:175`)。`PipelineRootClassifierTable` (`pipeline.go:115`) が起点で IP / ARP / Multicast などのサブパイプラインへ分岐する。

## 採用事例の素材

ADOPTERS.md (`ADOPTERS.md`) に success story 付きで載っている組織:

- Glasnostic ([glasnostic.com](https://glasnostic.com)) — OVS サポートを使い Kubernetes クラスタ内のサービス相互作用をチューニング。
- Transwarp ([transwarp.io](https://www.transwarp.io)) — AntreaClusterNetworkPolicy / AntreaNetworkPolicy でマルチテナントのビッグデータ基盤を保護、Egress で送信元 IP を保持、flannel との相互運用。
- TeraSky ([terasky.com](https://www.terasky.com)) — 社内クラスタおよび顧客環境で Antrea(C)NP と Egress を多用。

加えて VMware vSphere Kubernetes Service (VKS) のデフォルト CNI (出典: The New Stack 記事)。

GitHub シグナル (2026-06-26 時点、`gh api repos/antrea-io/antrea`): star 1,794、fork 477、open issues 201。contributors API で 142 のユニーク login。最新リリース v2.6.2 (2026-06-13)。CII/OpenSSF Best Practices バッジ (project 4173) を取得 (README バッジ)。

## 代替・エコシステム

- 主要な代替: Cilium (eBPF データプレーン、CNCF Graduated)、Calico (BGP / eBPF、Tigera)、flannel (シンプルな overlay)、kube-router、Weave。Antrea の固有性は「OVS をデータプレーンに使う」点。OVS の成熟した可観測性 (IPFIX/NetFlow/sFlow/SPAN) と Windows 対応、OpenFlow による機能拡張の速さが差別化。
- Antrea 固有機能: Antrea NetworkPolicy / ClusterNetworkPolicy (Tier・優先度・FQDN・ロギング付き、k8s 標準 NP の上位)、Egress (送信元 IP 固定)、NodePortLocal、Multicast、Traffic Control / ミラーリング、Antrea Multi-cluster、Flow Aggregator + IPFIX による可視化、BGP、PacketCapture。
- エコシステム: Flow Aggregator (`cmd/flow-aggregator`) が IPFIX フローを集約し外部コレクタ (Grafana 等) へ。`antctl` が運用 CLI。Theia (別リポジトリ) がネットワークフロー可視化。Open vSwitch は Linux Foundation プロジェクトで Antrea のデータプレーン基盤。
- Windows 対応 (`*_windows.go` が各パッケージに存在) は OVS 由来の強み。Cilium / Calico の eBPF パスは Linux 中心。

## 最小セットアップ

前提: Kubernetes 1.23+、`NodeIPAMController` 有効 (kubeadm なら `--pod-network-cidr <cidr>`)、各 Node に OVS カーネルモジュール (README の Prerequisites)。

最新リリースの manifest を適用する手順 (`docs/getting-started.md:79`):

1. リリースのタグを選んで manifest を適用する。

    ```bash
    kubectl apply -f https://github.com/antrea-io/antrea/releases/download/v2.6.2/antrea.yml
    ```

2. main の最新を試すなら checked-in の yaml を使う (`docs/getting-started.md:86`)。

    ```bash
    kubectl apply -f https://raw.githubusercontent.com/antrea-io/antrea/main/build/yamls/antrea.yml
    ```
