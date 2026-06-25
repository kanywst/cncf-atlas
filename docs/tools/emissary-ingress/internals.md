# Internals

> Read from the source at commit `65b0dd9ae`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/busyambassador/main.go` | BusyBox-style dispatch by `os.Args[0]` into `entrypoint`, `kubestatus`, `version` |
| `cmd/entrypoint/` | Go process manager, cluster watcher, and notify logic |
| `cmd/apiext/` | The `emissary-apiext` CRD conversion webhook |
| `pkg/ambex/` | The ADS server that feeds Envoy over xDS |
| `pkg/snapshot/v1/` | The `Snapshot` and `KubernetesSnapshot` types the watcher builds |
| `pkg/api/getambassador.io/` | CRD Go types for `v1`, `v2`, `v3alpha1` |
| `python/ambassador/src/ambassador/ir/` | The intermediate representation and its factories |
| `python/ambassador/src/ambassador/envoy/v3/` | Envoy v3 config generators |
| `python/ambassador-diag/src/ambassador_diag/diagd.py` | The diagd Flask service and the compile pipeline |

## Core data structures

- `snapshot.Snapshot` and `KubernetesSnapshot` (Go) are the full world state the watcher assembles. `KubernetesSnapshot` holds Mappings, Hosts, Listeners, Services, Endpoints, Secrets, and Gateway API objects (`pkg/snapshot/v1/types.go:23`, `pkg/snapshot/v1/types.go:57`, `pkg/snapshot/v1/types.go:84-87`).
- `IR` (Python) is the intermediate representation. It carries dictionaries such as `clusters: Dict[str, IRCluster]`, `groups: Dict[str, IRBaseMappingGroup]`, and `listeners: Dict[str, IRListener]` (`python/ambassador/src/ambassador/ir/ir.py:90-118`).
- `EnvoyConfig` (Python) is generated from the `IR` and split by `split_config()` into bootstrap config, ADS config, and clustermap (`python/ambassador-diag/src/ambassador_diag/diagd.py:1628`, `python/ambassador-diag/src/ambassador_diag/diagd.py:1635`).
- `FastpathSnapshot` (Go) carries an `ecp_v3_cache.Snapshot` plus `*Endpoints` for the path that skips Python (`pkg/ambex/fastpath.go:7-11`).
- `MappingSpec` (Go, `v3alpha1`) is the user-facing routing resource (`pkg/api/getambassador.io/v3alpha1/crd_mapping.go:27`).

## A path worth tracing

Take a `Mapping` resource and follow it to a live Envoy route.

1. The watcher builds a snapshot. `WatchAllTheThings` (`cmd/entrypoint/watcher.go:26`) watches the cluster and assembles a `snapshot.Snapshot` (`cmd/entrypoint/watcher.go:201`).
2. On `SnapshotReady` (`cmd/entrypoint/watcher.go:106-118`) the `notify` closure fires `notifyReconfigWebhooks` (`cmd/entrypoint/watcher.go:62-67`).
3. That POSTs to diagd. `notifyWebhookUrl` posts to the URL from `GetEventUrl` (`cmd/entrypoint/notify.go:42`, `cmd/entrypoint/env.go:244`), which resolves to `_internal/v0/watt?url=<snapshot>` on port 8004 (`cmd/entrypoint/env.go:153`).
4. diagd receives it. `handle_watt_update` reads `?url=` and enqueues `("watt", url)` (`python/ambassador-diag/src/ambassador_diag/diagd.py:916`).
5. diagd parses it. `load_config_watt` fetches the snapshot, saves it to disk, and feeds it into the `Config` (`python/ambassador-diag/src/ambassador_diag/diagd.py:1539`).
6. diagd compiles it. `_load_ir` runs `IR.check_deltas` to decide complete vs incremental, builds the `IR`, and calls `EnvoyConfig.generate` then `split_config()` (`python/ambassador-diag/src/ambassador_diag/diagd.py:1585-1635`). Mappings become `IRHTTPMapping` objects via `MappingFactory.load_all` (`python/ambassador/src/ambassador/ir/irmappingfactory.py:28`).
7. diagd validates it. `validate_envoy_config` runs `envoy --mode validate`; an invalid config returns an error and the current config is kept (`python/ambassador-diag/src/ambassador_diag/diagd.py:1652`).
8. ambex serves it. The validated config is written to disk, ambex loads it into a go-control-plane `SnapshotCache`, and pushes it to Envoy over ADS on `127.0.0.1:8003` (`pkg/ambex/main.go:6-40`, `cmd/entrypoint/entrypoint.go:164-167`).

```text
WatchAllTheThings -> SnapshotReady -> notifyReconfigWebhooks
  -> POST _internal/v0/watt?url= -> handle_watt_update
  -> load_config_watt -> _load_ir (IR -> EnvoyConfig -> split_config)
  -> validate_envoy_config (envoy --mode validate)
  -> ambex SnapshotCache -> ADS push -> envoy
```

## Things that surprised me

- **The endpoint fast path skips Python entirely.** Pod churn changes EDS endpoints but not routing structure, so the entrypoint passes endpoint-only updates straight to ambex through `fastpathCh chan *ambex.FastpathSnapshot` (`cmd/entrypoint/entrypoint.go:163-167`), and ambex swaps only the EDS data (`pkg/ambex/fastpath.go:7`). This avoids a reconfigure storm under heavy pod churn.
- **Emissary validates config with the real Envoy before swapping it.** The generated ADS config is run through `envoy --mode validate`, and on failure the live config is left untouched (`python/ambassador-diag/src/ambassador_diag/diagd.py:1652`). A bug in Emissary's own generation cannot take down user traffic.
- **CRD versions are normalized out of the engine's view.** Multiple versions (`v1`, `v2`, `v3alpha1`) coexist, and the in-cluster `emissary-apiext` conversion webhook (`cmd/apiext/main.go`, `pkg/apiext`) means the Python engine only ever sees `v3alpha1`, so it never has to reason about version differences.
