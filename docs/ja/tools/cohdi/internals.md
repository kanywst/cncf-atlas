# 内部実装

> コミット `761a00b` (タグ v0.2.0) のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/main.go` | Manager、3 reconciler、webhook を配線する。 |
| `api/v1alpha1` | 2 つの CRD 型と `cro.hpsys.ibm.ie.com` group。 |
| `internal/controller` | reconciler 群とプロバイダ adapter。 |
| `internal/cdi` | `CdiProvider` interface とベンダー実装。 |
| `internal/cdi/fti` | Fujitsu FTI_CDI: トークンキャッシュ、Composition Manager (`cm`)、Fabric Manager (`fm`)。 |
| `internal/webhook/v1alpha1` | `ComposabilityRequest` の validating webhook。 |
| `internal/utils` | GPU ドライバ確認、可視性確認、ドレイン、名前生成。 |

## 中核データ構造

`ScalarResourceDetails` (`api/v1alpha1/composabilityrequest_types.go:40`) は `ComposabilityRequestSpec` (`api/v1alpha1/composabilityrequest_types.go:36`) の本体である。type の enum、model、size、割り当てポリシー、任意の target node を保持する。

```go
type ScalarResourceDetails struct {
    // +kubebuilder:validation:Enum="gpu";"cxlmemory"
    Type string `json:"type"`
    // +kubebuilder:validation:MinLength=1
    Model string `json:"model"`
    // +kubebuilder:validation:Minimum=0
    Size        int64 `json:"size"`
    ForceDetach bool  `json:"force_detach,omitempty"`
    // +kubebuilder:validation:Enum="samenode";"differentnode"
    // +kubebuilder:default=samenode
    AllocationPolicy string    `json:"allocation_policy,omitempty"`
    TargetNode       string    `json:"target_node,omitempty"`
    OtherSpec        *NodeSpec `json:"other_spec,omitempty"`
}
```

status 側は `ComposabilityRequestStatus` (`api/v1alpha1/composabilityrequest_types.go:67`) でデバイス単位の状態を集約し、その `Resources` map の値は `ScalarResourceStatus` (`api/v1alpha1/composabilityrequest_types.go:74`) である。

デバイス 1 台は 1 つの `ComposableResource` であり、その status (`api/v1alpha1/composableresource_types.go:36`) に CDI 呼び出しの結果が記録される。

```go
type ComposableResourceStatus struct {
    State       string `json:"state"`
    Error       string `json:"error,omitempty"`
    DeviceID    string `json:"device_id,omitempty"`
    CDIDeviceID string `json:"cdi_device_id,omitempty"`
}
```

`DeviceID` はデバイスのシリアル番号、`CDIDeviceID` はファブリック側の UUID (Universally Unique Identifier、汎用一意識別子) である。ベンダーの継ぎ目は `CdiProvider` interface (`internal/cdi/client.go:34`) だ。

```go
type CdiProvider interface {
    AddResource(instance *v1alpha1.ComposableResource) (deviceID string, CDIDeviceID string, err error)
    RemoveResource(instance *v1alpha1.ComposableResource) error
    CheckResource(instance *v1alpha1.ComposableResource) error
    GetResources() (deviceInfoList []DeviceInfo, err error)
}
```

`GetResources` は `DeviceInfo` (`internal/cdi/client.go:25`) のスライスを返す。これは upstream syncer がファブリック状態とクラスタを照合するために使う正規化形 (NodeName / MachineUUID / DeviceID / CDIDeviceID) である。

## 追う価値のあるパス

GPU を 1 台 attach する処理は、`ComposableResource` から Fabric Manager への HTTP PATCH まで流れる。`handleAttachingState` (`internal/controller/composableresource_controller.go:209`) はまず `utils.EnsureGPUDriverExists` (`internal/utils/gpus.go:64`) で NVIDIA ドライバの存在を確認し、`DeviceID` が未設定ならプロバイダを呼ぶ (`internal/controller/composableresource_controller.go:231`)。

```text
handleAttachingState
  -> adapter.CDIProvider.AddResource(resource)        controller :231
       -> FTIClient.AddResource                        fm/client.go :100
            -> getNodeMachineID(TargetNode)            fm/client.go :103
            -> token.GetToken()                        fm/client.go :109
            -> ScaleUpBody を組む                        fm/client.go :115
            -> PATCH .../machines/<id>/update           fm/client.go :147
            -> OptionStatus[:1] を判定                   fm/client.go :195
  -> DeviceID / CDIDeviceID を status へ書く             controller :245-247
  -> CheckGPUVisible                                    controller :288 / gpus.go :185
  -> 状態 Online                                         controller :293
```

`FTIClient.AddResource` (`internal/cdi/fti/fm/client.go:100`) はノードを machine UUID へ解決し、OAuth2 トークンを取得し、`ScaleUpBody` を組み (`internal/cdi/fti/fm/client.go:115`)、PATCH を送る (`internal/cdi/fti/fm/client.go:147`)。成否は返ってきた `OptionStatus` の先頭 1 文字で判定する (`internal/cdi/fti/fm/client.go:195`)。

```go
                if resource.OptionStatus[:1] == "0" {
                    return resource.SerialNum, resource.ResourceUUID, nil
                } else if resource.OptionStatus[:1] == "1" {
                    clientLog.Info("the FM attached device called is in Warning state in FM", "ComposableResource", instance.Name)
                    return resource.SerialNum, resource.ResourceUUID, nil
                } else if resource.OptionStatus[:1] == "2" {
```

先頭が `0` なら正常、`1` は Warning だが成功扱いとし、`SerialNum` を device ID、`ResourceUUID` を CDI device ID として返す (`internal/cdi/fti/fm/client.go:196`)。reconciler に戻ると、`utils.CheckGPUVisible` (`internal/utils/gpus.go:185`) がクラスタの新デバイス認識を確認し (`internal/controller/composableresource_controller.go:288`)、その後に状態が `Online` になる (`internal/controller/composableresource_controller.go:293`)。detach は逆順だ。`handleDetachingState` (`internal/controller/composableresource_controller.go:333`) が `utils.DrainGPU` (`internal/utils/gpus.go:330`) で GPU をドレインしてから `RemoveResource` を呼ぶ (`internal/controller/composableresource_controller.go:367`)。

## 読んで驚いた点

ノードから machine UUID への解決は、ベアメタルスタックに密結合している。`getNodeMachineID` (`internal/cdi/fti/fm/client.go:416`) は 2 経路を持つ。OpenShift では `machine.openshift.io/machine` (`internal/cdi/fti/fm/client.go:423`) から始まる annotation の連鎖を Metal3 オブジェクトを通って辿り、そうでなければ Node の `spec.providerID` から `fsas-cdi://` プレフィックスを剥がす (`internal/cdi/fti/fm/client.go:457`)。

トークンキャッシュは先回り更新する。`CachedToken` (`internal/cdi/fti/token.go:58`) は OAuth2 トークンを `sync.RWMutex` の背後に 30 秒の `leeway` 付きで保持し、`GetToken` (`internal/cdi/fti/token.go:74`) はトークンを `leeway` ぶん早く期限切れ扱いするため、呼び出しが実際の expiry と競合しない。`Token` (`internal/cdi/fti/token.go:103`) の password grant に使う資格情報は Kubernetes Secret から来る。

実際に鋭い角が 1 つある。`resource.OptionStatus[:1]` (`internal/cdi/fti/fm/client.go:195`) は文字列の先頭 1 バイトを直接スライスしている。Fabric Manager から `OptionStatus` が空で返ると、エラーを返す代わりに reconciler が panic し得る。getting-started には影響しないが、ファブリックに面したクライアントとして知っておく価値のある入力信頼のギャップである。
