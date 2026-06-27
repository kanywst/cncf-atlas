# 内部実装

> コミット `19f82f4f` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `pkg/apis/agones/v1` | CRD 型: `GameServer`, `Fleet`, `GameServerSet`。 |
| `pkg/apis/allocation/v1` | `GameServerAllocation` 型とバリデーション。 |
| `pkg/gameservers` | 単一 `GameServer` のライフサイクル Controller。 |
| `pkg/gameserversets` | `GameServerSet` Controller (レプリカ数を維持)。 |
| `pkg/fleets` | `Fleet` Controller (セットのローリング更新)。 |
| `pkg/fleetautoscalers` | `FleetAutoscaler` Controller。 |
| `pkg/gameserverallocations` | アロケーションリクエストの処理。 |
| `pkg/portallocator` | ノード単位の動的 HostPort 割当。 |
| `pkg/sdkserver` | `GameServer` を patch する gRPC SDK サイドカー。 |
| `cmd/` | バイナリ: `controller`, `allocator`, `extensions`, `ping`, `processor`, `sdk-server`。 |

## 中核データ構造

`GameServer` (`pkg/apis/agones/v1/gameserver.go:197`) はシステム全体が回転する中心リソースである。その `Spec` (`GameServerSpec`, `pkg/apis/agones/v1/gameserver.go:222`) は `Ports []GameServerPort` (`:227`)、`Health Health` (`:229`)、`SdkServer SdkServer` (`:233`)、そして Pod テンプレ全体 `Template corev1.PodTemplateSpec` (`:235`) を持つ。Pod テンプレを丸ごと内包することで、ゲームサーバは「Pod + Agones メタデータ」として記述される。`Status` (`GameServerStatus`, `pkg/apis/agones/v1/gameserver.go:318`) は `State GameServerState` (`:320`)、`Ports` (`:321`)、`Address` (`:322`) を持つ。

`GameServerState` (`pkg/apis/agones/v1/gameserver.go:39`) は調停を駆動する文字列 enum である。ライフサイクル定数は順に宣言される。`PortAllocation` (`:49`)、`Creating` (`:51`)、`Scheduled` (`:57`)、`RequestReady` (`:59`)、`Ready` (`:62`)、`Allocated` (`:74`)。

`Fleet` (`pkg/apis/agones/v1/fleet.go:41`) は Deployment 相当。`FleetSpec` (`pkg/apis/agones/v1/fleet.go:60`) は `Replicas int32` (`:62`)、`Strategy appsv1.DeploymentStrategy` (`:68`)、`Scheduling apis.SchedulingStrategy` (`:70`)、`Template GameServerTemplateSpec` (`:85`) を持つ。`GameServerSet` (`pkg/apis/agones/v1/gameserverset.go:40`) とその `GameServerSetSpec` (`pkg/apis/agones/v1/gameserverset.go:59`) は ReplicaSet 相当である。

`GameServerAllocation` (`pkg/apis/allocation/v1/gameserverallocation.go:52`) は一回限りの確保リソース。その `GameServerAllocationSpec` (`pkg/apis/allocation/v1/gameserverallocation.go:70`) は `MultiClusterSetting` (`:73`)、`Priorities` (`:100`)、`Selectors []GameServerSelector` (`:106`) を持ち、どの `Ready` サーバを確保できるかを絞る。

ポートアロケータの状態は `portRangeAllocator` (`pkg/portallocator/portallocator.go:115`)。その `portAllocations []portAllocation` フィールド (`pkg/portallocator/portallocator.go:119`) はノード単位の使用マップのスライスで、`portAllocation` は `map[int32]bool` (`pkg/portallocator/portallocator.go:112`) である。

```go
type portRangeAllocator struct {
    logger             *logrus.Entry
    name               string
    mutex              sync.RWMutex
    portAllocations    []portAllocation
```

## 追う価値のあるパス

新しい `GameServer` の最初の調停ステップはポート割当である。`syncGameServerPortAllocationState` (`pkg/gameservers/controller.go:565`) は `PortAllocation` 状態をガードし、コピーにポートを割り当て、状態を `Creating` に進める。

```go
func (c *Controller) syncGameServerPortAllocationState(ctx context.Context, gs *agonesv1.GameServer) (*agonesv1.GameServer, error) {
    if !(gs.Status.State == agonesv1.GameServerStatePortAllocation && gs.ObjectMeta.DeletionTimestamp.IsZero()) {
        return gs, nil
    }

    gsCopy := c.portAllocator.Allocate(gs.DeepCopy())

    gsCopy.Status.State = agonesv1.GameServerStateCreating
```

直後の Update が失敗すると、ポートは `c.portAllocator.DeAllocate(gsCopy)` (`pkg/gameservers/controller.go:580`) でそのままプールに戻されるため、書き込み失敗でポートがリークしない。

SDK 側の対応する書き込みは `updateState` (`pkg/sdkserver/sdkserver.go:360`) にある。read ロックを取り、リソースをコピーし、永続化する状態を刻んでから `patchGameServer` (`pkg/sdkserver/sdkserver.go:419`) を呼ぶ。

```go
    s.gsUpdateMutex.RLock()
    gsCopy := gs.DeepCopy()
    gsCopy.Status.State = s.gsState
```

ゲームバイナリの `Ready()` から、コントローラがリソースを `Ready` にするまでの呼び出しチェーン。

```text
SDKServer.Ready                         pkg/sdkserver/sdkserver.go:540
  enqueueState(RequestReady)            pkg/sdkserver/sdkserver.go:543
SDKServer.updateState                   pkg/sdkserver/sdkserver.go:360
  gsCopy.Status.State = s.gsState       pkg/sdkserver/sdkserver.go:396
  patchGameServer                       pkg/sdkserver/sdkserver.go:419
Controller.syncGameServerRequestReadyState  pkg/gameservers/controller.go:967
  gsCopy.Status.State = ...Ready        pkg/gameservers/controller.go:1014
  recorder.Event "SDK.Ready() complete" pkg/gameservers/controller.go:1023
```

## 読んで驚いた点

ポートアロケータは増分イベントが整合し続けることを信頼しない。起動時の `Run` (`pkg/portallocator/portallocator.go:163`) はキャッシュ同期を待ってから `syncAll` (`pkg/portallocator/portallocator.go:324`) を呼び、ノード単位のポートマップをゼロから完全再構築する (「最初から完璧な状態で始める」)。定常時の回収はイベント駆動で、informer は `DeleteFunc: pa.syncDeleteGameServer` (`pkg/portallocator/portallocator.go:154`) を登録し、ハンドラ本体は `syncDeleteGameServer` (`pkg/portallocator/portallocator.go:311`) である。

同名の `Allocate` メソッドが層違いで 2 つある。コーディネータの `portAllocator.Allocate` (`pkg/portallocator/portallocator.go:97`) が各レンジアロケータに展開し、各 `portRangeAllocator.Allocate` (`pkg/portallocator/portallocator.go:179`) がレンジ単位の実際の割当を行う。コントローラはコーディネータを呼び、そこから委譲される。

アドレスは 2 箇所から書かれうる。通常パスは `syncGameServerStartingState` (`pkg/gameservers/controller.go:916`) だが、速いゲームバイナリがコントローラのアドレス設定より先に `Ready()` を呼んだ場合、`syncGameServerRequestReadyState` が自分でアドレスを補完してから `Ready` にする。Node の引きは `pkg/gameservers/controller.go:996`、アドレスとポートの適用は `pkg/gameservers/controller.go:1000` にある。
