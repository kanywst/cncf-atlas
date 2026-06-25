# Internals

> Read from the source at commit `4d117aa`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/costmodel/` | Single-binary entry point; calls the cobra command tree (`main.go:11`) |
| `core/pkg/opencost/` | Domain types: Allocation, Asset, CloudCost, Window |
| `core/pkg/source/` | `MetricsQuerier` data-source abstraction (`datasource.go:11`) |
| `pkg/costmodel/` | Cost model and HTTP handlers (`aggregation.go`, `allocation.go`) |
| `pkg/cloud/<provider>/` | Per-provider pricing (AWS, Azure, GCP, and others) |
| `pkg/cloudcost/` | Cloud billing-API ingestion pipeline |
| `modules/prometheus-source/` | Prometheus implementation of `MetricsQuerier` |
| `modules/collector-source/` | Alternative metrics backend |

## Core data structures

- `Allocation` (`core/pkg/opencost/allocation.go:55`): one workload's cost for one window. It holds CPU, GPU, and RAM CoreHours, cost, and adjustment fields, network costs (cross-zone, cross-region, internet, NAT), load balancer, PV, and shared and external costs, all flat `float64` fields in one large struct. `Properties *AllocationProperties` carries the keys: cluster, node, namespace, pod, controller, and labels.
- `AllocationSet` (`core/pkg/opencost/allocation.go:1496`) and `AllocationSetRange` (`allocation.go:3225`): the set of Allocations within a window, and the time-series range of those sets. `Accumulate` folds multiple windows together.
- `Asset` interface (`core/pkg/opencost/asset.go:31`) with concrete types `Disk` (`asset.go:963`) and `Node` (`asset.go:1739`): infrastructure assets. These are the denominator for idle computation.
- `CloudCost` (`core/pkg/opencost/cloudcost.go:14`) and `CloudCostSet` (`cloudcost.go:170`): per-service costs from the cloud billing API, a separate pipeline from allocation.
- `Window` (`core/pkg/opencost/window.go:75`): two `*time.Time` pointers, `start` and `end`. A nil pointer means open-ended. This is the time axis for every query.

## A path worth tracing

`computeAllocation` (`pkg/costmodel/allocation.go:219`) is where one window's cost is built. It first builds a pod map, then fans out the remaining metric queries as futures:

```go
grp := source.NewQueryGroup()
ds := cm.DataSource.Metrics()

resChRAMBytesAllocated := source.WithGroup(grp, ds.QueryRAMBytesAllocated(start, end))
```

Each `ds.Query...` call returns a `*Future` that runs concurrently and is awaited later. The query itself crosses the `MetricsQuerier` boundary (`core/pkg/source/datasource.go:11`) into the Prometheus implementation at `modules/prometheus-source/pkg/prom/metricsquerier.go:525`, where the PromQL is defined as a constant (`metricsquerier.go:527`):

```text
avg(avg_over_time(container_memory_allocation_bytes{container!="", container!="POD", node!="", %s}[%s]))
  by (container, pod, namespace, node, uid, %s, provider_id)
```

The outer `ComputeAllocation` (`pkg/costmodel/allocation.go:32`) wraps this: it splits windows longer than `BatchDuration` into sub-windows, computes each, and folds them with `asr.Accumulate(opencost.AccumulateOptionAll)` (`allocation.go:125`).

## Things that surprised me

- bingen, a hand-rolled binary codec. The types in `core/pkg/opencost` are serialized neither as JSON nor protobuf but with a custom binary codec (`core/pkg/opencost/bingen.go`). The header comment is a strict rule: new fields must be appended to the END of a struct for backwards compatibility (`bingen.go:4-21`). Each set is versioned (`@bingen:set[name=Allocation,version=...]`) and each field is annotated, with generated output in `opencost_codecs.go`. The ETL and storage layers move large volumes of cost time series, and this codec keeps them compact and fast while staying backwards compatible.
- The many-to-one fix for pod UID ingestion (`pkg/costmodel/allocation.go:241`). When UID ingestion is on, pod names are rewritten to `<pod_name> <pod_uid>`, but other metrics that lack a UID then fail to match. A `podUIDKeyMap` (`map[podKey][]podKey`) maps each default pod key to its edited keys, so uncontrolled pods that share a name are not dropped.
- A pointer-equality bug fix in GPU comparison (`core/pkg/opencost/allocation.go:151`). `ptrValueEqual` exists because plain `==` on pointer fields compares addresses, which made equal-valued GPUAllocations compare unequal after a binary round-trip (#3846). The fix compares pointed-to values and normalizes NaN before comparison.
