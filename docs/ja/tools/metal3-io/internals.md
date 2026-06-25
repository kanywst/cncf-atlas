# 内部実装

> コミット `56169b71` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `apis/metal3.io/v1alpha1/` | CRD 型 (`BareMetalHost` ほか)。独立した Go モジュール |
| `internal/controller/metal3.io/` | reconcile ロジックと有限状態機械 |
| `internal/webhooks/metal3.io/` | validating / defaulting webhook |
| `pkg/provisioner/` | `Provisioner` インタフェース、ironic/fixture/demo backend、プラグインローダ |
| `pkg/hardwareutils/` | BMC プロトコル処理。独立した Go モジュール |
| `config/`, `ironic-deployment/` | Kustomize マニフェスト。`make manifests` で生成 |

## 中核データ構造

`BareMetalHost` (`apis/metal3.io/v1alpha1/baremetalhost_types.go:865`) は `Spec` と `Status` を組にする。kubebuilder マーカで short name `bmh` / `bmhost`、status subresource、Status・State・Consumer・BMC・Online・Error・Age の printcolumn を定義する (`:855`-`:863`)。

`ProvisioningState` (`baremetalhost_types.go:294`) は string で、状態機械のキー。定数には `StateNone` (空文字列)、`registering`、`inspecting`、`preparing`、`available`/`ready`、`provisioning`、`provisioned`、`deprovisioning`、`powering off before delete`、`deleting`、`externally provisioned`、`unmanaged` などがある (`:297` 以降)。

`ProvisionStatus` (`baremetalhost_types.go:822`) は直近の provisioning 結果を記録する。`State`、Ironic node UUID の `ID` (`:829`)、適用済みの `Image`・`RootDeviceHints`・`BootMode`・`RAID`・`Firmware`・`CustomDeploy` を持つ。

`OperationalStatus` (`baremetalhost_types.go:225`) は provisioning ライフサイクルと直交する。`OK`・`discovered`・`error`・`delayed`・`detached`。`delayed` は容量待ちを意味する。

`Provisioner` インタフェース (`pkg/provisioner/provisioner.go:143`) は 30 近いメソッドを持つ (Register・InspectHardware・Prepare・Provision・Deprovision・Delete・PowerOn・PowerOff・HasCapacity など)。各々が `Dirty`・`RequeueAfter`・`ErrorMessage` を持つ `Result` (`:257`) を返し、API 全体を非同期な「後で再ポーリング」型にしている。

## 追う価値のあるパス

最も非自明な設計判断は、provisioner backend が実行時にロードされる Go の `.so` プラグインだという点だ。`main` バイナリは Kubernetes I/O が始まる前にプラグインパスを解決して open する。

`main.go` では既定値が定数で設定される。`defaultProvisionerName = "ironic"`、`defaultProvisionerPluginDir = "/plugins"`、suffix `-provisioner.so` (`main.go:78`-`:81`)。`fixture` backend はコンパイル時組込なので、選択するとプラグインロードを丸ごとスキップする。パスの組み立てと open は次の通り。

```go
pluginDir := cmp.Or(os.Getenv("PROVISIONER_PLUGIN_DIR"), defaultProvisionerPluginDir)
pluginPath := filepath.Join(pluginDir, provisionerName+provisionerPluginSuffix)
p, err := provisioner.Open(pluginPath, provisionerName)
```

`provisioner.Open` (`pkg/provisioner/plugin.go:99`) は `plugin.Open` の後、必須シンボル 2 つを lookup してシグネチャを検証する。`PluginName` (`func() string`) と `NewProvisionerFactory` (`func(PluginConfig) (Factory, error)`) だ。`PluginName()` が期待名と一致しなければロードを拒否する。

```go
name := nameFunc()
if expectedName != "" && name != expectedName {
    return nil, fmt.Errorf("plugin %s: PluginName() returned %q, expected %q", path, name, expectedName)
}
```

`HostConfigure` は任意で、シグネチャ不一致のときだけエラーになる (`plugin.go:135`)。効果として、ironic backend はコアから疎結合になり、サードパーティが (`docker-build-sdk` make ターゲットで) provisioner プラグインをビルドして差し込める。代償は Go plugin の制約で、同じ Go と依存バージョンでビルドする必要があり、実質 Linux 限定となる。

## 読んで驚いた点

deprovisioning が失敗し続けても削除は前進する。deprovision に失敗し、削除が要求されている場合、状態機械は retryCount を超えると諦めて powering off before delete へ進み、「ホストはまだ稼働しているかもしれない」とログに残す (`host_state_machine.go:578`-`:585`)。さらに、ホストが Ironic に未登録で、かつ deprovision 用の creds が無ければ、power off を飛ばして deleting へ直行する (`:587`-`:595`)。運用上の割り切りは「ホストが残っても、削除要求は詰まらせない」だ。

容量ゲートは action のパスではなく状態遷移のパスにある。`ensureCapacity` (`host_state_machine.go:87`) は `updateHostStateFrom` から、次状態が inspecting・provisioning・deprovisioning のときだけ参照される。チェックは provisioner に過度な圧力をかけないよう意図的に限定されている (`host_state_machine.go:107`-`:114`)。
