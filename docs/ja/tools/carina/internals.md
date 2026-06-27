# 内部実装

> コミット `aec3a9f` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/carina-controller` | CSI (Container Storage Interface) コントローラを動かすコントロールプレーンのエントリポイント。 |
| `cmd/carina-node` | reconciler と device manager を動かすノードエージェントのエントリポイント。 |
| `pkg/csidriver/driver` | CSI gRPC サービス。`controller.go` がコントローラのロジック。 |
| `pkg/csidriver/driver/k8s` | `LogicVolume` リソースを作り、その status をポーリングする。 |
| `controllers` | device manager を呼ぶノード側の `LogicVolume` reconciler。 |
| `pkg/devicemanager` | LVM (Logical Volume Manager)・パーティション・ホストパスの各実装とシェル実行器。 |
| `scheduler/schedulerplugin/localstorage` | kube-scheduler の `Filter`・`Score` プラグイン。 |
| `api/v1`、`api/v1beta1`、`api/api.go` | custom resource 型と LVM/ディスクの Go モデル。 |

## 中核データ構造

`LogicVolume` CRD (custom resource definition) がコントローラとノードの契約である。spec は `api/v1/logicvolume_types.go:29`、トップレベル型は `api/v1/logicvolume_types.go:63` に定義される。spec は `NodeName`・`Size`・`DeviceGroup`・`Pvc`・`NameSpace` を、status は `VolumeID`・`Code` (gRPC code)・`CurrentSize`・`DeviceMajor`・`DeviceMinor` を持つ (`api/v1/logicvolume_types.go:43`)。リソースは Cluster スコープで short name は `lv` (`api/v1/logicvolume_types.go:60`)。1 PVC が 1 `LogicVolume` に対応する。冪等性は `IsCompatibleWith` から来て、同名・同サイズのオブジェクトを互換とみなす (`api/v1/logicvolume_types.go:72`):

```go
// IsCompatibleWith returns true if the LogicalVolume is compatible.
func (lv *LogicVolume) IsCompatibleWith(lv2 *LogicVolume) bool {
    if lv.Name != lv2.Name {
        return false
    }
    if lv.Spec.Size.Cmp(lv2.Spec.Size) != 0 {
        return false
    }
    return true
}
```

`NodeStorageResource` CRD が容量の真実源である。status は `api/v1beta1/nodestorageresource_types.go:36` に定義され、`Capacity` と `Allocatable` は `map[string]resource.Quantity` (`api/v1beta1/nodestorageresource_types.go:45`)、加えて `VgGroups`・`Disks`・`RAIDs` を持つ (`api/v1beta1/nodestorageresource_types.go:51`)。トップレベル型は `api/v1beta1/nodestorageresource_types.go:65`。LVM グループは `api.VgGroup` (`api/api.go:4`) でモデル化され、その `VGFree` フィールド (`api/api.go:10`) が容量判定で効く。`api.PVInfo` (`api/api.go:15`) と `api.Disk` (`api/api.go:25`) が物理ボリュームとディスクをモデル化する。

ノードエージェントの中枢は `DeviceManager` (`pkg/devicemanager/manager.go:54`) で、3 つのボリュームバックエンド `VolumeManager`・`Partition`・`Host` を保持する (`pkg/devicemanager/manager.go:58`)。`NewDeviceManager` は共有の `exec.CommandExecutor` を各バックエンドに注入する (`pkg/devicemanager/manager.go:67`)。例えば `lvmd.Lvm2Implement` へ注入する (`pkg/devicemanager/manager.go:73`)。内部イベントバスである `Trigger` を運ぶ `VolumeEvent` (`pkg/devicemanager/manager.go:48`) が容量再計算を通知する。

## 追う価値のあるパス

3 つのボリュームタイプが `createLV` で分岐する (`controllers/logicvolume_controller.go:163`): LVM・raw パーティション・ホストディレクトリである。LVM 型をシェルまで追うのが最も示唆に富む。reconciler が `CreateVolume` をリトライした後 (`controllers/logicvolume_controller.go:165`)、`LocalVolumeImplement.CreateVolume` が容量チェックを行う。予約領域のガードは厳密である:

```go
if vgInfo.VGFree-size < carina.DefaultReservedSpace-carina.DefaultEdgeSpace { ////avoid edge conditions
    log.Warnf("%s don't have enough space, reserved 10g", vgName)
    return errors.New(carina.ResourceExhausted)
}
```

このチェックは `pkg/devicemanager/volume/volume.go:65` にある。`DefaultReservedSpace` は `10 << 30`、`DefaultEdgeSpace` は `1 << 30` であり (`constants.go:27`)、空き容量が 9 GiB を割り込むとボリュームは拒否される。チェックを通ると `LVCreateFromVG` がコマンドを組む (`pkg/devicemanager/lvmd/lvm.go:258`):

```go
func (lv2 *Lvm2Implement) LVCreateFromVG(lv, vg string, size uint64, tags []string, stripe uint, stripeSize string) error {
    args := []string{"-n", lv, "-L", fmt.Sprintf("%vg", size>>30), "-W", "y", "-y"}
```

サイズは `size>>30` なので、ボリュームは整数 GiB 粒度で作られる。最後のホップはリテラルなシェル呼び出し `lv2.Executor.ExecuteCommand("lvcreate", args...)` である (`pkg/devicemanager/lvmd/lvm.go:274`)。

## 読んで驚いた点

コントローラはディスク操作を行わず、結果をポーリングで知る。`LogicVolume` を作った後、100ms の `time.After` でループし (`pkg/csidriver/driver/k8s/logicvolume_service.go:210`)、ノードエージェントが `.status.volumeID` を書いたときだけ返る (`pkg/csidriver/driver/k8s/logicvolume_service.go:224`)。watch もコールバックもなく、API server がチャネルである。

bcache 階層化は通常パスのフラグではなく別のコードパスである。`cache-disk-ratio` パラメータが設定されると、`CreateVolume` は単一ボリュームのロジックが走る前に `CreateBcacheVolume` へ渡す (`pkg/csidriver/driver/controller.go:472`)。この関数は低速バックエンドと高速キャッシュの 2 つの LVM ボリュームを作り、バックエンドをキャッシュの owner にして両者が一緒に削除されるようにする (`pkg/csidriver/driver/controller.go:557`)。キャッシュポリシーは `writeback` か `writearound` を要求しない限り `writethrough` がデフォルトである (`pkg/csidriver/driver/controller.go:496`)。

成功パスは raw な名前ではなくプレフィックス付きの volume id を書く。成功時に reconciler は `lv.Status.VolumeID = carina.VolumePrefix + lv.Name` を設定し (`controllers/logicvolume_controller.go:178`)、`VolumePrefix` は `volume-` である (`constants.go:98`)。そのためデバイスパスと CRD 名はそのプレフィックスの分だけ異なる。
