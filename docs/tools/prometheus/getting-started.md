# Getting Started

> Verified against the README at commit `fc561264` (3.13.0-rc.0). Commands assume a Unix shell with Docker, or Go and Node if you build from source.

## Prerequisites

- Docker, for the quickest trial run, or
- Go (version in `go.mod` or greater), Node (version in `web/ui/.nvmrc` or greater), and npm 10+ to build from source (README:70-72).

## Install

The fastest path is the official container image (README:60-61):

```bash
docker run --name prometheus -d -p 127.0.0.1:9090:9090 prom/prometheus
```

To build from source instead (README:76-78, 101):

```bash
git clone https://github.com/prometheus/prometheus.git
cd prometheus
make build
```

`make build` compiles the `prometheus` and `promtool` binaries with the web assets embedded, so the binary runs from anywhere (README:97-101).

## A first working setup

The container above starts with a default config. To run your own, point Prometheus at a config file that scrapes itself.

1. Write a minimal `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
```

1. Start the server with that config (README:85-86):

```bash
./prometheus --config.file=prometheus.yml
```

When built with `go install` rather than `make build`, run the binary from the root of the cloned repository so it can find web assets under `web/ui/static` (README:88-92).

## Verify it works

Open the web UI at `http://localhost:9090/` (README:64). Then confirm Prometheus is scraping itself: run the query `up` in the expression browser, or hit the API directly.

```bash
curl 'http://localhost:9090/api/v1/query?query=up'
```

A healthy server returns JSON with `"status":"success"` and an `up` series whose value is `1` for the `prometheus` job.

## Where to go next

- The [official first steps guide](https://prometheus.io/docs/prometheus/latest/getting_started/) covers adding more targets and writing queries.
- For high availability, long-term retention, and scaling beyond a single node, see the [Adoption & Ecosystem](./adoption) page and the project documentation at [prometheus.io](https://prometheus.io/) rather than re-documenting it here.
