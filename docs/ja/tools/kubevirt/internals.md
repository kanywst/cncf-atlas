# 内部実装

> コミット `3a1a19f` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/virt-controller/virt-controller.go` | virt-controller の `main`、`watch.Execute()` を呼ぶ (`:27`) |
| `pkg/virt-controller/watch/vmi/vmi.go` | VMI reconcile ループ、`execute()` (`:309`) |
| `pkg/virt-controller/watch/vmi/lifecycle.go` | `sync()` (`:66`)、Pod 作成 (`:1090`) |
| `pkg/virt-controller/services/template.go` | `RenderLaunchManifest()` が launcher Pod 仕様を組む (`:395`) |
| `pkg/virt-handler/vm.go` | ノード側 `syncVirtualMachine()` (`:2101`)、launcher への gRPC (`:2113`) |
| `pkg/virt-launcher/virtwrap/manager.go` | `LibvirtDomainManager.SyncVMI()` (`:1804`) |
| `pkg/virt-launcher/virtwrap/converter/converter.go` | VMI から libvirt ドメインへの変換の入口 (`:43`) |
| `staging/src/kubevirt.io/api/core/v1/types.go` | 公開 API の型 |
| `pkg/virt-launcher/virtwrap/api/schema.go` | libvirt ドメインの Go 表現 |

## 中核データ構造

`VirtualMachineInstance` (`staging/src/kubevirt.io/api/core/v1/types.go:46`) は稼働中の VM 1 台を、`Spec` と `Status` を持つ素直な Kubernetes オブジェクトとして表す。その `VirtualMachineInstanceSpec` (`types.go:92`) は `Domain` 仕様に加え、Kubernetes のスケジューリング語彙 `NodeSelector`・`Affinity`・`Tolerations`・`TopologySpreadConstraints`・`EvictionStrategy` を持つ。スケジューリングと eviction が Pod と同じ語彙で書かれており、これが VM を標準スケジューラに載せられる理由だ。

`VirtualMachine` (`types.go:2075`) は VMI を所有する宣言的な親で、起動/停止/再起動の意図を表す。`VirtualMachineInstanceMigration` (`types.go:1887`) は live migration を独自の CR として駆動する。

境界の反対側には `api.Domain` (`pkg/virt-launcher/virtwrap/api/schema.go:117`) と `api.DomainSpec` (`schema.go:227`) があり、これは libvirt ドメイン XML の Go 表現である。VMI とは別系統の型で、converter が両者を橋渡しする。

## 追う価値のあるパス

VMI がコントローラから稼働ドメインに至るまでを追う。

VMI コントローラの reconcile 起点は `execute(key)` (`pkg/virt-controller/watch/vmi/vmi.go:309`)。expectation が満たされると sync を呼び、status を書く (`vmi.go:370`)。

```go
syncErr, pod := c.sync(vmi, pod, dataVolumes)
err = c.updateStatus(vmi, pod, dataVolumes, syncErr)
```

`sync()` (`pkg/virt-controller/watch/vmi/lifecycle.go:66`) は DataVolume・backend storage・ネットワークを準備し、Pod 仕様を描画する (`lifecycle.go:156`)。

```go
templatePod, err = c.templateService.RenderLaunchManifest(vmi)
```

`RenderLaunchManifest(vmi)` (`pkg/virt-controller/services/template.go:395`) は compute コンテナ (virt-launcher イメージ)・volume・リソース・securityContext を盛った `*k8sv1.Pod` を返す。コントローラはそれを作成する。`createPod()` (`pkg/virt-controller/watch/vmi/lifecycle.go:1090`) が実際の API 呼び出しを行う。

```go
pod, err := c.clientset.CoreV1().Pods(namespace).Create(context.Background(), pod, v1.CreateOptions{})
```

ここから標準スケジューラが Pod を割り当てる。選ばれたノードでは `syncVirtualMachine()` (`pkg/virt-handler/vm.go:2101`) が options を組み立て、gRPC で委譲する (`vm.go:2113`)。

```go
err = client.SyncVirtualMachine(vmi, options)
```

launcher 内では `LibvirtDomainManager.SyncVMI()` (`pkg/virt-launcher/virtwrap/manager.go:1804`) が VMI をドメインへ変換する (`manager.go:1839`)。

```go
if err := converter.Convert_v1_VirtualMachineInstance_To_api_Domain(vmi, domain, c); err != nil {
    logger.Error("Conversion failed.")
    return nil, err
}
```

`Convert_v1_VirtualMachineInstance_To_api_Domain(...)` (`pkg/virt-launcher/virtwrap/converter/converter.go:43`) 自身はフィールドを写さない。network・storage・CPU・memory・firmware (OS configurator)、TPM・graphics・watchdog などのデバイスを受け持つ 30 個の configurator のリストを組み (`converter.go:78`)、hypervisor 用の configurator を 1 つ足す (`converter.go:160`)。既定は KVM で、hypervisor 名が `hyperv-direct` (direct virtualization 付きの Hyper-V) なら `mshv` のものを使う (`staging/src/kubevirt.io/api/core/v1/types.go:3425`)。それらを `DomainBuilder` で順に実行する (`converter.go:171`):

```go
builder := convertertypes.NewDomainBuilder(configurators...)
if err := builder.Build(vmi, domain); err != nil {
    return err
}
```

`Build` は各 configurator の `Configure(vmi, domain)` を呼び、最初のエラーで止まる (`pkg/virt-launcher/virtwrap/converter/types/builder.go:42`)。`SyncVMI()` に戻ると、manager が `lookupOrCreateVirDomain()` (`manager.go:1847`) でドメインを定義し QEMU を起動する。

## 読んで驚いた点

宣言型から命令型への変換すべてが、1 つの関数 (`converter.go:43`) に集約されている。VM の Kubernetes 的な側面は VMI 型に、libvirt 的な側面は `api.Domain` にあり、converter が唯一の継ぎ目だ。その継ぎ目の内側では処理が分かれていて、機能ごとに `Configure(vmi, domain)` メソッド 1 つだけを持つ configurator になっている (`types/builder.go:29`)。ファイルは `3a1a19f` で 248 行あり、前回の pin `55a003d` の 1,312 行から縮んだ。VMI が何に変わりうるかを一覧したいなら、`converter.go:78` の configurator リストを読む。

libvirt を動かしていそうなノードコンポーネントは、実は動かしていない。`virt-handler` は hypervisor を持たず、期待状態を計算して VM ごとの `virt-launcher` に gRPC で送るだけだ (`vm.go:2113`)。hypervisor は Pod の中にあり、この配置が各 VM をスケジューラが選んだ Pod サンドボックスの内側に留める。
