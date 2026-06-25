# 内部実装

> コミット `affd5be` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/kthena-router` | データプレーンのバイナリ。gin ベースの L7 ルータ (`cmd/kthena-router/main.go:40`) |
| `cmd/kthena-controller-manager` | コントロールプレーンのバイナリ。CRD reconcile + webhook サーバ (`cmd/kthena-controller-manager/main.go:54`) |
| `pkg/kthena-router/router` | リクエスト処理・マッチング・プロキシ (`router.go:210`) |
| `pkg/kthena-router/scheduler` | pod の採点と選抜 (`scheduler_impl.go:119`) |
| `pkg/kthena-router/scheduler/plugins` | score / filter plugin。prefix cache を含む (`prefix_cache.go:162`) |
| `pkg/kthena-router/datastore` | バックエンド pod の実行時ビュー (`store.go:282`) |
| `pkg/kthena-router/connectors` | PD 分離用の KV 転送 connector (NIXL / MoonCake / SGLang) |
| `pkg/model-serving-controller/controller` | ModelServing の reconcile と PodGroup 管理 (`model_serving_controller.go:72`) |
| `pkg/apis/workload/v1alpha1` | workload CRD (`ModelServing` / `ServingGroup` / `ModelBooster`) |
| `pkg/apis/networking/v1alpha1` | networking CRD (`ModelRoute` / `ModelServer`) |

## 中核データ構造

- **`datastore.PodInfo`** (`pkg/kthena-router/datastore/store.go:282`): ルータが持つ各バックエンド pod の実行時ビュー。`GPUCacheUsage` / `RequestWaitingNum` / `RequestRunningNum` / `TTFT` / `TPOT` のヒストグラム、Redis でルータ横断同期される `onFlightRequestNum atomic.Int64` (`store.go:300`)、base + LoRA の `models sets.Set[string]` を持つ。`sync.RWMutex` で保護。scheduler の全 plugin はこの struct を採点する。
- **`framework.Context`** (`pkg/kthena-router/scheduler/framework`, `:29`): 1 リクエスト分のスケジューリング文脈。`Model` / `Prompt` / `Hashes []uint64` (prefix block ハッシュ) / `ModelServerName` / `PDGroup` / `DecodePods` / `PrefillPods` / `BestPods` を持つ。PD 分離か集約かで使うフィールドが分岐する。
- **`ServingGroup` / `Role` / `GangPolicy`** (`pkg/apis/workload/v1alpha1/servinggroup_types.go:110`, `:55`, `:25`): gang の最小単位。`Role` は `EntryTemplate` (必ず 1 つの entry pod) + `WorkerTemplate` + `WorkerReplicas` (`servinggroup_types.go:69-79`)。`GangPolicy.MinRoleReplicas map[string]int32` (`servinggroup_types.go:42`) で role ごとの gang 最小本数を指定する (例 prefill:1, decode:1)。`NetworkTopology` (`servinggroup_types.go:46`) は Volcano の `NetworkTopologySpec` を埋め込む。
- **`ModelServingSpec`** (`pkg/apis/workload/v1alpha1/model_serving_types.go:36`): `Replicas` (ServingGroup の本数) / `SchedulerName` (default `volcano`, `model_serving_types.go:47`) / `Template` / `RolloutStrategy` / `RecoveryPolicy` / `Plugins []PluginSpec` chain。
- **`ModelBooster` / `ModelBackend`** (`pkg/apis/workload/v1alpha1/model_booster_types.go:200`, `:51`): 「1 CR で 1 モデルを立てる」最上位の抽象。`Backend.Type` は vLLM か vLLMDisaggregated、`ModelURI` は `hf://` / `s3://` / `pvc://` / `ms://` のみ許可 (`model_booster_types.go:59`)、`CacheURI` は `hostpath://` / `pvc://`。

## 追う価値のあるパス

スケジューラの採点ループがルータの心臓だ。`SchedulerImpl.Schedule` (`pkg/kthena-router/scheduler/scheduler_impl.go:119`) は pod をフィルタしてから PD 分離で分岐する。

```go
// scheduler_impl.go:119
func (s *SchedulerImpl) Schedule(ctx *framework.Context, pods []*datastore.PodInfo) error {
    if s.syncOnFlight {
        s.store.SyncOnFlightCounts() // ルータ横断の in-flight 数を Redis から同期
    }
    pods, err := s.RunFilterPlugins(pods, ctx) // 不適格 pod を除外
    // ...
    if ctx.PDGroup != nil { // PD 分離: decode を採点→上位 N、各 decode に対応する prefill を引く
        decodePods, _ := s.store.GetDecodePods(ctx.ModelServerName)
        scores := s.RunScorePlugins(decodePods, ctx)
        topNDecodePods := TopNPodInfos(scores, topN)
        // ... s.store.GetPrefillPodsForDecodeGroup(ctx.ModelServerName, decodePodName) ...
    }
    scores := s.RunScorePlugins(pods, ctx) // PD 集約: 普通に採点
    ctx.BestPods = TopNPodInfos(scores, topN)
}
```

デフォルトは weight 1 の score plugin 3 つ、`least-request` / `least-latency` / `prefix-cache` (`scheduler_impl.go:68-72`) と、filter plugin 1 つ `least-request` (`scheduler_impl.go:73-75`)。デフォルト引数は同ファイルにハードコードされ (`scheduler_impl.go:76-80`)、例えば prefix-cache は `blockSizeToHash: 64, maxBlocksToMatch: 128, maxHashCacheSize: 50000, topKMatches: 5`。各 plugin の score は `[0,100]`、`RunScorePlugins` (`scheduler_impl.go:211`) が pod ごとに `score * weight` を合算し、`TopNPodInfos` (`scheduler_impl.go:255`) が降順ソートして上位 `topN` を返す。

`prefix-cache` plugin (`pkg/kthena-router/scheduler/plugins/prefix_cache.go:162`) は `hashPrompt` (`prefix_cache.go:208`) でプロンプトを `blockSizeToHash` 単位のブロックハッシュにし、`ModelPrefixStore.FindTopMatches` (`pkg/kthena-router/scheduler/plugins/cache/prefix_store.go:141`) でどの pod が最長一致プレフィックスを持つかを引く。この store は sharded (`prefix_store.go:63`) で LRU バックされ、pod 削除 (`prefix_store.go:97`) と hash eviction (`prefix_store.go:235`) で掃除される。

コントロールプレーンでは、gang scheduling は `PodGroupManager` インタフェース (`pkg/model-serving-controller/controller/model_serving_controller.go:72`) 経由で委譲され、実体は Volcano client で構築される (`model_serving_controller.go:194`)。NetworkTopology が外れると controller は PodGroup を掃除する (`model_serving_controller.go:282`)。

## 読んで驚いた点

- KV キャッシュ局所性をエンジン外で推定する。ルータの L7 採点層が sharded LRU prefix store を持ち、エンジンの報告に頼らず「どの pod がそのプロンプトのプレフィックスを既に持つか」を推定する (`prefix_cache.go`, `prefix_store.go`)。
- in-flight 数を Redis でルータ複製間に共有する。`PodInfo.onFlightRequestNum` は atomic int で、`least-request` 有効時に採点前 `SyncOnFlightCounts` が Redis から更新する (`scheduler_impl.go:121-123`, `store.go:300`)。
- PD 分離リクエストでは decode / prefill pod を datastore に事前カテゴライズしておき、選んだ decode pod から対応する prefill 群を `GetDecodePods` / `GetPrefillPodsForDecodeGroup` で O(1) に引く。両側を再採点しない。
