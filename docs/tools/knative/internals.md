# Internals

> Read from the source at commit `6fb71ff`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/controller` | Hosts the reconciler set registered in `ctors` (`cmd/controller/main.go:56`) |
| `cmd/autoscaler` | KPA process that computes desired replica counts |
| `cmd/activator` | Data-plane buffer that enables scale to zero |
| `cmd/queue` | queue-proxy sidecar; measures concurrency, enforces limits |
| `pkg/apis/serving/v1` | Service, Configuration, Revision, Route types |
| `pkg/reconciler/service` | Reconciles Service into Configuration and Route |
| `pkg/reconciler/configuration` | Creates immutable Revisions per generation |
| `pkg/autoscaler/scaling` | The autoscaler's scale computation |
| `pkg/autoscaler/config` | Autoscaler defaults and config parsing |

## Core data structures

`v1.Service` is the top-level type (`pkg/apis/serving/v1/service_types.go:42`). Its `ServiceSpec` inlines an unrestricted `ConfigurationSpec` and a webhook-restricted `RouteSpec` (`pkg/apis/serving/v1/service_types.go:71`), and its `ServiceStatus` inlines both `ConfigurationStatusFields` and `RouteStatusFields` (`pkg/apis/serving/v1/service_types.go:122`). It is a duck-typed Knative resource (`duckv1.KRShaped`).

The `autoscaler` struct holds the per-Revision scale state (`pkg/autoscaler/scaling/autoscaler.go:45`): `panicTime` and `maxPanicPods` track panic mode, `delayWindow` defers scale-down, and `deciderSpec` carries the scaling inputs behind a `specMux` read-write lock. A `Scale` call returns a `ScaleResult` with `DesiredPodCount`, `ExcessBurstCapacity`, and `ScaleValid` (`pkg/autoscaler/scaling/autoscaler.go:308`).

## A path worth tracing

The interesting code is the autoscaler's dual-window decision in `Scale` (`pkg/autoscaler/scaling/autoscaler.go:149`). The autoscaler runs two observation windows at once: a long stable window and a short panic window. It reads both the stable and the panic concurrency (or RPS) values for the Revision (`pkg/autoscaler/scaling/autoscaler.go:166`).

Panic mode is entered when the desired-per-pod count crosses the panic threshold (`pkg/autoscaler/scaling/autoscaler.go:220`):

```go
isOverPanicThreshold := dppc/readyPodsCount >= spec.PanicThreshold

if a.panicTime.IsZero() && isOverPanicThreshold {
    // Begin panicking when we cross the threshold in the panic window.
    a.panicTime = now
    ...
}
```

While in panic mode the autoscaler only scales up. It ratchets `maxPanicPods` upward and refuses to apply any decrease (`pkg/autoscaler/scaling/autoscaler.go:247`):

```go
if desiredPodCount > a.maxPanicPods {
    a.maxPanicPods = desiredPodCount
} else if desiredPodCount < a.maxPanicPods {
    // Skipping pod count decrease.
}
desiredPodCount = a.maxPanicPods
```

Panic only clears once the value stays below the threshold for a full stable window (`pkg/autoscaler/scaling/autoscaler.go:230`). The short window detects a surge fast and scales up hard; the long window makes scale-down slow and stable.

The defaults set the windows (`pkg/autoscaler/config/config.go`): `StableWindow` is 60s (`config.go:57`) and `PanicWindowPercentage` is 10, making the panic window 6s (`config.go:54`). `PanicThresholdPercentage` is 200 (`config.go:56`), `ContainerConcurrencyTargetDefault` is 100 (`config.go:46`), `ScaleToZeroGracePeriod` is 30s (`config.go:58`), and `EnableScaleToZero` is true (`config.go:44`).

## Things that surprised me

Excess Burst Capacity (EBC) is computed from the panic value rather than the stable value (`pkg/autoscaler/scaling/autoscaler.go:285`):

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

When EBC goes negative, the deployment lacks the spare capacity for a burst, so the activator is kept in the request path (the SKS stays in Proxy mode). The default `TargetBurstCapacity` of 211 (`pkg/autoscaler/config/config.go:53`) means the activator stays in the path until there is meaningful headroom. Using the panic value here, rather than the smoother stable value, is the deliberate choice that avoids flapping the activator in and out of the data path.

A second non-obvious detail: scale-down can be delayed even outside panic mode. When the Revision is reachable and a `delayWindow` is configured, the autoscaler records the desired count into a max-over-time window and serves the windowed maximum instead of the latest value (`pkg/autoscaler/scaling/autoscaler.go:265`), so a brief dip in load does not immediately remove Pods.
