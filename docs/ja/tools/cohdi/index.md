# CoHDI

> CoHDI (Composable Hardware in Disaggregated Infrastructure、分離型インフラにおけるコンポーザブルハードウェア) は、Composable Device Infrastructure (CDI、コンポーザブルデバイス基盤) のファブリック API を駆動して、実行時に GPU をノードへ着脱する Kubernetes オペレーターである。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Sandbox (2025-12-19 受理)
- **言語**: Go (`go 1.24.0`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [CoHDI/composable-resource-operator](https://github.com/CoHDI/composable-resource-operator)
- **ドキュメント基準コミット**: `761a00b` (タグ v0.2.0、2026-06-23)

## 何をするものか

CoHDI (発音は "Cody") は、Kubernetes 上のコンポーザブルハードウェアを扱う CNCF Sandbox プロジェクトである。中核ソフトウェアは `composable-resource-operator`、すなわち PCIe / CXL デバイス (現時点では NVIDIA GPU) をノードを再起動せずにクラスタノードへ物理的に着脱するコントローラだ。Kubernetes はコンポーザブルハードウェアの概念を持たず、リソースは起動時にノードへ固定される。本オペレーターは、PCI スイッチを制御するベンダー CDI ファブリックマネージャと通信することでこのギャップを埋める。

オペレーターは 2 つの Custom Resource Definition (CRD、カスタムリソース定義) を公開する。`ComposabilityRequest` は、指定した type / model のデバイスを何台欲しいかを表すユーザー向け要求である。`ComposableResource` は、オペレーターが管理する内部のデバイス 1 台ぶんのライフサイクルオブジェクトだ。1 件の要求はデバイス台数ぶんの `ComposableResource` に分解され、各々が独立した着脱の状態機械を回す。

CoHDI は広いプロジェクトの 3 コンポーネントのうちの 1 つである。残りの 2 つは `composable-dra-driver` (空きプールのデバイスを Kubernetes Dynamic Resource Allocation (DRA、動的リソース割り当て) の ResourceSlice に載せる) と `dynamic-device-scaler` (待機中の Pod を検知してオペレーターに合成を依頼する) だ。本ディープダイブは、実際に着脱呼び出しを発行するコンポーネントである `composable-resource-operator` を扱う。

## いつ使うか

- コンポーザブルファブリック (PCIe / CXL スイッチ) を備えたベアメタル Kubernetes で GPU ワークロードを動かし、起動時に固定するのではなくオンデマンドで GPU をノードへ割り当てたい場合。
- ハードウェアが対応 CDI プロバイダで管理されている場合: Fujitsu FTI_CDI (Composition Manager または Fabric Manager)、SNIA Sunfish、NEC CDIM (Composable Disaggregated Infrastructure Manager)。
- 各ノードを過剰にプロビジョニングするのではなく、アクセラレータのプールをノード間で共有することで稼働率と省電力を改善したい場合。
- ノードにローカル固定の GPU があり、コンポーザブルファブリックを持たない場合は向かない。着脱する対象が無く、素の DRA や NVIDIA GPU Operator で足りる。
- まだ初期段階である。基準リリースは `v0.2.0`、プロジェクトは CNCF Sandbox、README 自身が proof of concept (概念実証) と記している。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [CoHDI/composable-resource-operator](https://github.com/CoHDI/composable-resource-operator) (commit 761a00b、tag v0.2.0)。
2. [CoHDI GitHub organization](https://github.com/CoHDI)。
3. [CoHDI/.github profile README](https://github.com/CoHDI/.github/blob/main/profile/README.md)。
4. [CoHDI ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md)。
5. [cncf/sandbox Issue #361 (CoHDI Sandbox 提案)](https://github.com/cncf/sandbox/issues/361)。
6. [CNCF プロジェクトページ: CoHDI](https://www.cncf.io/projects/cohdi/)。
7. [KEP-5007 device-attach-before-pod-scheduled](https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/5007-device-attach-before-pod-scheduled)。
