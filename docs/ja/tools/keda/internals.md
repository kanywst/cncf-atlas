# 内部実装

> コミット `c5b577c` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `apis/keda/v1alpha1/` | CRD 型: ScaledObject, ScaledJob, ScaleTriggers, TriggerAuthentication |
| `controllers/keda/` | 各 CRD の reconciler と HPA 管理 |
| `pkg/scaling/` | scale handler, executor, scalers cache, resolver, modifiers |
| `pkg/scalers/` | 70+ の個別 scaler 実装 |
| `pkg/provider/` | adapter が使う External Metrics provider |
| `pkg/metricsservice/` | operator と adapter 間の gRPC |
| `cmd/` | operator, adapter, webhooks のエントリポイント |

## 中核データ構造

- `ScaledObject` / `ScaledObjectSpec` ([2], `apis/keda/v1alpha1/scaledobject_types.go:45` と `:102`)。spec は `IdleReplicaCount` (`:115`)、`MinReplicaCount` (`:118`)、`MaxReplicaCount` (`:121`)、`Triggers []ScaleTriggers` (`:126`) を持つ。
- `ScaleTriggers` ([2], `apis/keda/v1alpha1/scaletriggers_types.go:28`): `Type` (`:30`)、`UseCachedMetrics` (`:34`)、`Metadata map[string]string` (`:36`)、`AuthenticationRef` (`:38`)、`MetricType` (`:40`)。1 つの ScaledObject に複数トリガを持てる。
- `Scaler` インターフェース ([2], `pkg/scalers/scaler.go:44`): `GetMetricsAndActivity`、`GetMetricSpecForScaling`、`Close`。`PushScaler` ([2], `pkg/scalers/scaler.go:57`) はプッシュ型ソース向けに `Run(ctx, active chan<- bool)` を足す。全 scaler がこの契約を満たす。
- `ScalersCache` ([2], `pkg/scaling/cache/scalers_cache.go:43`): ScaledObject ごとの scaler 群、generation 追跡、scaling modifiers 用の `CompiledFormula`。`ScalerBuilder` ([2], `pkg/scaling/cache/scalers_cache.go:92`) は scaler とその config、再生成用 `Factory` を持つ。
- `TriggerAuthenticationSpec` ([2], `apis/keda/v1alpha1/triggerauthentication_types.go:75`): 認証情報の解決元 (Pod Identity, secret target ref, Vault, Azure Key Vault)。

## 追う価値のあるパス

0→1 / idle の判断は `scaleExecutor.RequestScale` にある ([2], `pkg/scaling/executor/scale_scaledobjects.go:40`)。トリガが active なら zero/idle から上げ、inactive なら fallback・idle・最小レプリカのケースに分岐する ([2], `pkg/scaling/executor/scale_scaledobjects.go:73-117`)。そのブロックのコメントが 1 つの落とし穴を明示している。`minReplicas=0` で fallback が定義されている場合、ターゲットを 0 にスケールすると HPA が fallback のレプリカ数を二度と適用できなくなる。そのため、その組み合わせはゼロスケールのケースに落とさず別扱いにしている。

```text
Reconcile (scaledobject_controller.go:155)
  -> reconcileScaledObject (:231)
     -> ensureHPAForScaledObjectExists (:301)
     -> requestScaleLoop (:318)
        -> RequestScale (scale_scaledobjects.go:40)
           active   -> scaleFromZeroOrIdle
           inactive -> scaleToZeroOrIdle / fallback / set minReplicas
```

## 読んで驚いた点

`ScalersCache.acquireReader` ([2], `pkg/scaling/cache/scalers_cache.go:59`) は `ReaderDrainBudget` を持つ。reader は通常 `activeReaders` スロットを確保し defer で解放する。しかし scaler は `ctx` を無視してハングしうるサードパーティ SDK を呼ぶ。固まった reader が `cache.Close()` を永久にブロックしないよう、この関数は `time.AfterFunc` タイマーを仕込み、budget を過ぎたらスロットを強制解放して `activeReaders.Wait()` を有界に保つ。budget が `<= 0` のときは本来の解放が走るまでスロットを保持する。この防御的タイマーは API の表面からは見えず、cache のコードを読んで初めて現れる。
