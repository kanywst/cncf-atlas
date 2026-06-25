# 内部実装

> コミット `55a003d` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/virt-controller/virt-controller.go` | virt-controller の `main`、`watch.Execute()` を呼ぶ (`:28`) |
| `pkg/virt-controller/watch/vmi/vmi.go` | VMI reconcile ループ、`execute()` (`:306`) |
| `pkg/virt-controller/watch/vmi/lifecycle.go` | `sync()` (`:66`)、Pod 作成 (`:1105`) |
| `pkg/virt-controller/services/template.go` | `RenderLaunchManifest()` が launcher Pod 仕様を組む (`:325`) |
| `pkg/virt-handler/vm.go` | ノード側 `syncVirtualMachine()` (`:2043`)、launcher への gRPC (`:2055`) |
| `pkg/virt-launcher/virtwrap/manager.go` | `LibvirtDomainManager.SyncVMI()` (`:1371`) |
| `pkg/virt-launcher/virtwrap/converter/converter.go` | VMI から libvirt ドメインへの変換 (`:967`) |
| `staging/src/kubevirt.io/api/core/v1/types.go` | 公開 API の型 |
| `pkg/virt-launcher/virtwrap/api/schema.go` | libvirt ドメインの Go 表現 |

## 中核データ構造

`VirtualMachineInstance` (`staging/src/kubevirt.io/api/core/v1/types.go:47`) は稼働中の VM 1 台を、`Spec` と `Status` を持つ素直な Kubernetes オブジェクトとして表す。その `VirtualMachineInstanceSpec` (`types.go:82`) は `Domain` 仕様に加え、Kubernetes のスケジューリング語彙 `NodeSelector`・`Affinity`・`Tolerations`・`TopologySpreadConstraints`・`EvictionStrategy` を持つ。スケジューリングと eviction が Pod と同じ語彙で書かれており、これが VM を標準スケジューラに載せられる理由だ。

`VirtualMachine` (`types.go:1938`) は VMI を所有する宣言的な親で、起動/停止/再起動の意図を表す。`VirtualMachineInstanceMigration` (`types.go:1750`) は live migration を独自の CR として駆動する。

境界の反対側には `api.Domain` (`pkg/virt-launcher/virtwrap/api/schema.go:112`) と `api.DomainSpec` (`schema.go:215`) があり、これは libvirt ドメイン XML の Go 表現である。VMI とは別系統の型で、converter が両者を橋渡しする。

## 追う価値のあるパス

VMI がコントローラから稼働ドメインに至るまでを追う。

VMI コントローラの reconcile 起点は `execute(key)` (`pkg/virt-controller/watch/vmi/vmi.go:306`)。expectation が満たされると sync を呼び、status を書く (`vmi.go:364`)。

```go
syncErr, pod := c.sync(vmi, pod, dataVolumes)
err = c.updateStatus(vmi, pod, dataVolumes, syncErr)
```

`sync()` (`pkg/virt-controller/watch/vmi/lifecycle.go:66`) は DataVolume・backend storage・ネットワークを準備し、Pod 仕様を描画する (`lifecycle.go:156`)。

```go
templatePod, err = c.templateService.RenderLaunchManifest(vmi)
```

`RenderLaunchManifest(vmi)` (`pkg/virt-controller/services/template.go:325`) は compute コンテナ (virt-launcher イメージ)・volume・リソース・securityContext を盛った `*k8sv1.Pod` を返す。コントローラはそれを作成する。`createPod()` (`pkg/virt-controller/watch/vmi/lifecycle.go:1105`) が実際の API 呼び出しを行う。

```go
pod, err := c.clientset.CoreV1().Pods(namespace).Create(context.Background(), pod, v1.CreateOptions{})
```

ここから標準スケジューラが Pod を割り当てる。選ばれたノードでは `syncVirtualMachine()` (`pkg/virt-handler/vm.go:2043`) が options を組み立て、gRPC で委譲する (`vm.go:2055`)。

```go
err = client.SyncVirtualMachine(vmi, options)
```

launcher 内では `LibvirtDomainManager.SyncVMI()` (`pkg/virt-launcher/virtwrap/manager.go:1371`) が VMI をドメインへ変換する (`manager.go:1399`)。

```go
if err := converter.Convert_v1_VirtualMachineInstance_To_api_Domain(vmi, domain, c); err != nil {
    logger.Error("Conversion failed.")
}
```

`Convert_v1_VirtualMachineInstance_To_api_Domain(...)` (`pkg/virt-launcher/virtwrap/converter/converter.go:967`) が CPU・memory・disk・network・firmware を libvirt XML 表現へマップし、manager がドメインを定義して QEMU を起動する。

## 読んで驚いた点

宣言型から命令型への変換すべてが、1 つの関数 (`converter.go:967`) に集約されている。VM の Kubernetes 的な側面は VMI 型に、libvirt 的な側面は `api.Domain` にあり、converter が唯一の継ぎ目だ。境界が監査しやすい反面、この 1 関数が機能全体を支える要となっている。

libvirt を動かしていそうなノードコンポーネントは、実は動かしていない。`virt-handler` は hypervisor を持たず、期待状態を計算して VM ごとの `virt-launcher` に gRPC で送るだけだ (`vm.go:2055`)。hypervisor はノードエージェントではなく Pod の中にある。これが各 VM をスケジューラが配置した Pod サンドボックスの内側に留める。
