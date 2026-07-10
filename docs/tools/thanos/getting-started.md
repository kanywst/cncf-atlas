# Getting Started

> Verified against commit `cc24370` (near `v0.42.0-rc.0`). Commands assume a running Prometheus v2.2.1+ with a persistent data directory.

## Prerequisites

- A running Prometheus server (v2.2.1 or later) with persistent local storage.
- Optionally an object storage bucket (S3, GCS, Azure, and others) for long-term retention.
- A Go toolchain only if building from source.

## Install

Build the single `thanos` binary from source:

```bash
git clone https://github.com/thanos-io/thanos.git
cd thanos
make build
```

`make build` invokes `promu` to produce one `thanos` binary (`Makefile:149`). Released binaries and the `quay.io/thanos/thanos` image are also published on GitHub Releases.

## A first working setup

The shortest path to a global query view is a sidecar next to Prometheus plus a Querier in front of it.

1. Start the sidecar next to Prometheus to expose its data over the StoreAPI (`docs/quick-tutorial.md:91`). The `--objstore.config-file` flag is optional and only needed for long-term retention.

   ```bash
   thanos sidecar \
       --tsdb.path            /var/prometheus \
       --objstore.config-file bucket_config.yaml \
       --prometheus.url       http://localhost:9090 \
       --http-address         0.0.0.0:19191 \
       --grpc-address         0.0.0.0:19090
   ```

1. Start a Querier that connects to the sidecar's gRPC endpoint and serves the Prometheus-compatible API and UI (`docs/quick-tutorial.md:133`). The `dnssrv+` prefix discovers endpoints through DNS SRV records.

   ```bash
   thanos query \
       --http-address 0.0.0.0:19192 \
       --endpoint     1.2.3.4:19090 \
       --endpoint     dnssrv+_grpc._tcp.thanos-store.monitoring.svc
   ```

## Verify it works

Open the Querier UI at `http://localhost:19192` and check the Stores page; the sidecar should appear as a connected StoreAPI endpoint. Running a PromQL query there should return the same series Prometheus serves, now through Thanos.

## Where to go next

See the [official getting started guide](https://thanos.io/tip/thanos/getting-started.md/) for the store gateway, compaction and downsampling, Receive, query-frontend caching, HA pairs and deduplication, and object storage configuration.
