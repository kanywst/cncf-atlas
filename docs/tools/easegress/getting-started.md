# Getting Started

> Verified against the source at commit `3bdb192` (near tag `v2.11.0`). Commands assume a Unix shell, with Go 1.26 available if you build from source.

## Prerequisites

- Go 1.26 to build from source, or Docker to run the published image.
- Ports 2379, 2380, and 2381 free on the host: Easegress opens these by default for its embedded etcd.
- The `egctl` CLI, which is built alongside the server.

## Install

Build from source. The build script places binaries in the `bin` directory (README):

```bash
git clone https://github.com/easegress-io/easegress.git
cd easegress
make
export PATH="$PATH:$(pwd)/bin"
```

Or pull the published image instead of building:

```bash
docker pull megaease/easegress:latest
docker run megaease/easegress
```

## A first working setup

The core job of Easegress is to proxy traffic to backends. Start a single node, then create an HTTP proxy.

1. Launch the server. It starts a one-node embedded etcd cluster and begins serving.

```bash
easegress-server
```

1. Check the cluster member from another shell.

```bash
egctl get member
```

1. Create an HTTP proxy on port 10080 that load-balances across two backends. This creates an HTTP server and a pipeline behind it.

```bash
egctl create httpproxy demo --port 10080 \
  --rule="/pipeline=http://127.0.0.1:9095,http://127.0.0.1:9096"
```

1. Send a request through the proxy.

```bash
curl -v 127.0.0.1:10080/pipeline
```

The request is forwarded to `127.0.0.1:9095/pipeline` or `127.0.0.1:9096/pipeline` using round-robin load balancing (README).

## Verify it works

`egctl get member` returns the running node, which confirms the embedded etcd cluster is up. After creating the proxy, `egctl describe member` and the object list show the new HTTP server and pipeline. A `curl` to port 10080 that reaches one of the backends confirms the data path: traffic gate to pipeline to proxy filter to backend.

## Where to go next

For a multi-node HA cluster, TLS and `AutoCertManager`, the full filter catalog, service mesh mode, MQTT, and the LLM gateway, follow the official documentation under `docs/` in the repository and the MegaEase Easegress site at <https://megaease.com/easegress/>. Pin the server version to a released tag such as `v2.11.0` rather than `latest` in real deployments.
