# 内部実装

> コミット `6fb71ff` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/controller` | `ctors` に登録された reconciler 一式をホストする (`cmd/controller/main.go:56`) |
| `cmd/autoscaler` | desired レプリカ数を計算する KPA プロセス |
| `cmd/activator` | ゼロスケールを成立させるデータプレーンのバッファ |
| `cmd/queue` | queue-proxy サイドカー。並行数を計測し上限を強制する |
| `pkg/apis/serving/v1` | Service / Configuration / Revision / Route の型 |
| `pkg/reconciler/service` | Service を Configuration と Route に reconcile する |
| `pkg/reconciler/configuration` | generation ごとに immutable な Revision を生成する |
| `pkg/autoscaler/scaling` | autoscaler のスケール計算 |
| `pkg/autoscaler/config` | autoscaler のデフォルトと config パース |

## 中核データ構造

`v1.Service` がトップレベルの型である (`pkg/apis/serving/v1/service_types.go:42`)。その `ServiceSpec` は制限のない `ConfigurationSpec` と webhook で制限された `RouteSpec` を inline し (`pkg/apis/serving/v1/service_types.go:71`)、`ServiceStatus` は `ConfigurationStatusFields` と `RouteStatusFields` の両方を inline する (`pkg/apis/serving/v1/service_types.go:122`)。これは duck-typed な Knative リソース (`duckv1.KRShaped`) である。

`autoscaler` 構造体は Revision 単位のスケール状態を保持する (`pkg/autoscaler/scaling/autoscaler.go:45`)。`panicTime` と `maxPanicPods` が panic モードを追跡し、`delayWindow` がスケールダウンを遅延させ、`deciderSpec` がスケーリング入力を `specMux` 読み書きロックの後ろで保持する。`Scale` 呼び出しは `DesiredPodCount` / `ExcessBurstCapacity` / `ScaleValid` を持つ `ScaleResult` を返す (`pkg/autoscaler/scaling/autoscaler.go:308`)。

## 追う価値のあるパス

興味深いコードは autoscaler の二重ウィンドウ判定 `Scale` である (`pkg/autoscaler/scaling/autoscaler.go:149`)。autoscaler は 2 つの観測窓を同時に回す。長い stable 窓と短い panic 窓である。Revision の stable 値と panic 値の両方を並行数 (または RPS) として読む (`pkg/autoscaler/scaling/autoscaler.go:166`)。

panic モードは、pod あたり desired 数が panic 閾値を超えると入る (`pkg/autoscaler/scaling/autoscaler.go:220`):

```go
isOverPanicThreshold := dppc/readyPodsCount >= spec.PanicThreshold

if a.panicTime.IsZero() && isOverPanicThreshold {
    // Begin panicking when we cross the threshold in the panic window.
    a.panicTime = now
    ...
}
```

panic モード中は増加だけを反映する。`maxPanicPods` を上方向にラチェットし、減少は一切適用しない (`pkg/autoscaler/scaling/autoscaler.go:247`):

```go
if desiredPodCount > a.maxPanicPods {
    a.maxPanicPods = desiredPodCount
} else if desiredPodCount < a.maxPanicPods {
    // Skipping pod count decrease.
}
desiredPodCount = a.maxPanicPods
```

panic は、値が閾値を下回ったまま stable 窓を丸ごと経過してはじめて解除される (`pkg/autoscaler/scaling/autoscaler.go:230`)。短い窓が急増を素早く検知して一気に増やし、長い窓が縮退をゆっくり安定させる。

デフォルトが窓を決める (`pkg/autoscaler/config/config.go`): `StableWindow` は 60s (`config.go:57`)、`PanicWindowPercentage` は 10 で panic 窓は 6s になる (`config.go:54`)。`PanicThresholdPercentage` は 200 (`config.go:56`)、`ContainerConcurrencyTargetDefault` は 100 (`config.go:46`)、`ScaleToZeroGracePeriod` は 30s (`config.go:58`)、`EnableScaleToZero` は true (`config.go:44`)。

## 読んで驚いた点

Excess Burst Capacity (EBC) は stable 値ではなく panic 値から計算される (`pkg/autoscaler/scaling/autoscaler.go:285`):

```go
// the excess burst capacity is based on panic value, since we don't want to
// be making knee-jerk decisions about Activator in the request path.
// EBC = TotCapacity - Cur#ReqInFlight - TargetBurstCapacity
excessBCF := -1.
switch {
case spec.TargetBurstCapacity == 0:
    excessBCF = 0
case spec.TargetBurstCapacity > 0:
    totCap := float64(originalReadyPodsCount) * spec.TotalValue
    excessBCF = math.Floor(totCap - spec.TargetBurstCapacity - observedPanicValue)
}
```

EBC が負になると、Deployment にバースト用の余力が無いと判断され、activator がリクエストパスに残される (SKS が Proxy モードのままになる)。デフォルトの `TargetBurstCapacity` が 211 (`pkg/autoscaler/config/config.go:53`) なので、意味のある余力ができるまで activator はパスに残る。ここで滑らかな stable 値ではなく panic 値を使うのが、activator がデータパスに出たり入ったりフラップするのを避ける意図的な選択である。

もう一つの非自明な点: スケールダウンは panic モード外でも遅延しうる。Revision が reachable で `delayWindow` が設定されている場合、autoscaler は desired 数を max-over-time の窓に記録し、最新値ではなく窓内の最大値を採用する (`pkg/autoscaler/scaling/autoscaler.go:265`)。だから一瞬の負荷の落ち込みでは Pod が即座に消されない。
