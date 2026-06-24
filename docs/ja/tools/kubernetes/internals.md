# 内部実装

> コミット `8c64324b` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/` | Cobra コマンドへ委譲する薄い実行バイナリ (apiserver, scheduler, controller-manager, kubelet, kubectl) |
| `pkg/scheduler` | スケジューラ: キュー、キャッシュ、framework、Pod ごとのスケジューリングサイクル |
| `pkg/kubelet` | 割当 Pod を CRI 経由で動かすノードエージェント |
| `pkg/controller` | 上位オブジェクトを収束させる組み込みコントローラ群 |
| `pkg/controlplane`, `pkg/kubeapiserver` | API サーバの組み立てとストレージ配線 |
| `staging/src/k8s.io/*` | 独立モジュールとして公開されるライブラリ (`k8s.io/api`, `k8s.io/client-go`, `k8s.io/apimachinery`) |

## 中核データ構造

`Scheduler` 構造体はスケジューリングの状態を保持する: ノード/Pod キャッシュ、スケジューリングキュー、Pod ごとの profile、差し替え可能な `SchedulePod` 関数 ([scheduler.go:68](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/scheduler.go#L68))。`SchedulePod` を構造体のフィールドにしている ([scheduler.go:87](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/scheduler.go#L87)) ことで、テストや別アルゴリズムが中核の判断を差し替えられる。

`QueuedPodInfo` は `PodInfo` に queueing パラメータと Pod signature を重ねたもので、スケジューリングキューに乗る単位だ ([types.go:719](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/framework/types.go#L719))。`Gated()` メソッドが gating プラグインにまだ止められているかを返す ([types.go:747](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/framework/types.go#L747))。

`CycleState` は 1 スケジューリングサイクル限定のスクラッチだ。`sync.Map` で裏打ちされ、プラグインが使う write-once-read-many パターン (PreFilter/PreScore で 1 度書き、Filter/Score で何度も読む) に最適化されている ([cycle_state.go:28](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/framework/cycle_state.go#L28))。

## 追う価値のあるパス

Pod 1 個のスケジューリング、すべて `pkg/scheduler/schedule_one.go` 内。`schedulePod` が判断の中核だ: ノードを feasible な集合へ絞り、0 件なら `FitError` で失敗し、1 件ならそのまま採用し、複数ならスコアリングして最良を pop する ([schedule_one.go:564](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L564))。フィルタ自体は `findNodesThatFitPod` の中でまず PreFilter プラグインを走らせる ([schedule_one.go:622](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L622), PreFilter 呼び出しは [:632](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L632))。

```text
ScheduleOne (:67)
  -> scheduleOnePod (:93)            profile 解決, 新しい CycleState
    -> schedulingCycle (:169)
      -> UpdateSnapshot (:177)
      -> schedulingAlgorithm -> schedulePod (:564)
           findNodesThatFitPod -> RunPreFilterPlugins (:632) -> Filter
           prioritizeNodes -> 最高スコアを pop
      -> prepareForBindingCycle (:196)  assume + Reserve + Permit
  -> go runBindingCycle (:141)          非同期 bind
       -> bind (:1142) -> RunBindPlugins -> DefaultBinder.Bind
```

実際のクラスタ変更は既定の binder で起きる。選択ノードを指す `v1.Binding` を構築し、API サーバへ POST する ([default_binder.go:52](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go#L52))。

## 読んで驚いた点

スケジューラは大規模クラスタで全ノードを評価しない。`numFeasibleNodesToFind` が候補集合を適応的に絞る ([schedule_one.go:858](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L858))。`percentageOfNodesToScore` が未指定のとき `percentage = 50 - numAllNodes/125` を計算し、下限でクランプする ([schedule_one.go:871](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L871))。そして `minFeasibleNodesToFind = 100` を下回らない ([schedule_one.go:57](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L57))。クラスタが大きいほど見るノードの割合は小さくなる。最適配置をスケジューリングのレイテンシと引き換えにしている。

2 つ目の驚きは楽観的な assume とそれに続く非同期 bind だ ([schedule_one.go:141](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L141))。API サーバが binding を確定する前に Pod はキャッシュ上で配置済みと記され、次の Pod はネットワーク往復を待たずにスケジューリングできる。
