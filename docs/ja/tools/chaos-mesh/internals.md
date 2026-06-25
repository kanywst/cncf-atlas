# 内部実装

> コミット `8c13a9f` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/` | 7 つのバイナリ。中核 3 つは `chaos-controller-manager` / `chaos-daemon` / `chaos-dashboard`。 |
| `api/v1alpha1/` | CRD の Go 型と、全カオスオブジェクトが満たす共通インターフェース。 |
| `controllers/common/` | 共通 reconcile パイプライン: steps / records / conditions / finalizers。 |
| `controllers/chaosimpl/` | `ChaosImpl` インターフェースの背後にある障害種別ごとの `Apply` / `Recover` 実装。 |
| `pkg/chaosdaemon/` | コンテナ namespace の中で注入を行うノード側 gRPC サーバ。 |
| `config/crd/bases/` | 生成された 23 個の CRD YAML 定義。 |

## 中核データ構造

- `ChaosImpl` インターフェース: 全障害種別が実装する 2 メソッド `Apply` と `Recover(ctx, index, records, obj) (Phase, error)` (`controllers/chaosimpl/types/types.go:25-29`)。障害種別の差を吸収する継ぎ目。
- `Record`: ターゲット 1 個の注入状態。`Id` / `SelectorKey` / `Phase` / `InjectedCount` / `RecoveredCount` / `Events` を持つ (`api/v1alpha1/common_types.go:78-88`)。
- `Phase` と `DesiredPhase`: `Phase` は `Not Injected` か `Injected` (`api/v1alpha1/common_types.go:89-97`)、`DesiredPhase` は `Run` か `Stop` (`api/v1alpha1/common_types.go:61-67`)。この 2 軸が reconciler の状態機械を駆動する。
- `InnerObject` とその派生: 全カオス CRD が満たす共通インターフェース。duration / paused / oneshot 判定と webhook validation を含む (`api/v1alpha1/common_types.go:146-182`)。
- `ExecStressRequest` (proto): daemon へのストレス注入リクエスト。`Scope` / `Target` (container id) / `CpuStressors` / `MemoryStressors` / `EnterNS` / `OomScoreAdj` を運ぶ (`pkg/chaosdaemon/pb/chaosdaemon.proto`)。

## 追う価値のあるパス

StressChaos を reconcile から `stress-ng` の起動まで追う。

`records` 段がターゲットごとに何をするか決める。`desiredPhase` が `Run` で現 phase がまだ `Injected` でないとき、phase が `Not Injected` で始まる場合を除いて操作は `Apply` になる (`controllers/common/records/controller.go:128-149`)。`Apply` なら impl を呼び、phase が変わったら status を dirty にする。失敗時はリトライフラグを立て、失敗イベントを追記する (`controllers/common/records/controller.go:151` 以降)。

StressChaos impl がコンテナを解決して daemon を呼ぶ。

```go
req := pb.ExecStressRequest{
    Scope:           pb.ExecStressRequest_CONTAINER,
    Target:          containerId,
    CpuStressors:    cpuStressors,
    MemoryStressors: memoryStressors,
    EnterNS:         true,
}
res, err := pbClient.ExecStressors(ctx, &req)
```

これは `controllers/chaosimpl/stresschaos/impl.go:77-87`。ストレス引数文字列は `impl.go:67-75` の `Stressors.Normalize()` で組まれ、戻りの PID と起動時刻は `impl.go:93-102` で `Status.Instances` に書かれる。

ノード側では `ExecStressors` (`pkg/chaosdaemon/stress_server_linux.go:33`) が `ExecCPUStressors` (`:112`) に振り分ける。これは `crClient.GetPidFromContainerID` でコンテナ PID を引き (`:118`)、`cgroups.GetAttacherForPID` で cgroup attacher を得て (`:123`)、`bpm.DefaultProcessBuilder("stress-ng", ...).EnablePause()` でプロセスを組み、`EnterNS` が立っていれば `SetNS(pid, bpm.PidNS)` を付ける (`:128-132`)。

## 読んで驚いた点

daemon は `stress-ng` を最初から走らせない。`EnablePause()` で pause 状態として起動し、その pause したプロセスを対象コンテナの cgroup に attach し、それから `SIGCONT` を送って resume する (`pkg/chaosdaemon/stress_server_linux.go:128-167`)。順序が重要で、resume の前に cgroup へ attach することで、負荷が対象コンテナの resource limit の内側で動くことを保証する。逆にすると、負荷プロセスが一瞬ホスト資源を無制限に消費しうる。resume 自体は、プロセス名 (`comm`) が `pause` でなくなるまで `SIGCONT` を再送し `comm` を読み直す泥臭いループで、より良い仕組みが欲しいと認める TODO 付き (`:148-167`)。

もう 1 つの非自明な点は親 reconcile の発火方法。predicate `PickChildCRDPredicate` は `PodHttpChaos` / `PodIOChaos` / `PodNetworkChaos` のいずれかが変化したときだけ親の reconcile を発火する (`controllers/common/fx.go:154-169`)。これがノード側の状態をユーザー向けカオスオブジェクトへ戻す経路になる。

## 出典

1. chaos-mesh/chaos-mesh ソース (コミット `8c13a9f`): <https://github.com/chaos-mesh/chaos-mesh>
