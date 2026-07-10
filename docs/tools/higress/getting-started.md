# Getting Started

> Verified against the README at commit `bd9c4c5` (near tag `v2.2.3`). The quickstart runs Higress standalone with Docker; the Kubernetes path uses Helm.

## Prerequisites

- Docker, for the standalone all-in-one quickstart.
- For the Kubernetes path instead: a cluster and Helm 3.
- Network access to Higress's own image registry (`higress-registry.*.cr.aliyuncs.com`). The README notes these images live in Higress's registry rather than Docker Hub, so Docker Hub rate limits do not apply. Pick the mirror closest to your region (`cn-hangzhou`, `us-west-1`, or `ap-southeast-7`).

## Install

The fastest way to run Higress is the all-in-one Docker image, which bundles the control plane, the Envoy data plane, and the console. It writes its config to the mounted working directory, so no cluster is needed (README).

```bash
mkdir higress; cd higress
docker run -d --rm --name higress-ai -v ${PWD}:/data \
  -p 8001:8001 -p 8080:8080 -p 8443:8443 \
  higress-registry.cn-hangzhou.cr.aliyuncs.com/higress/all-in-one:latest
```

The three ports are the console (8001), the gateway HTTP entry (8080), and the gateway HTTPS entry (8443) (README).

For a Kubernetes deployment, install with Helm and point `global.hub` at the mirror nearest you (README):

```bash
helm install higress -n higress-system higress.io/higress \
  --set global.hub=higress-registry.us-west-1.cr.aliyuncs.com \
  --create-namespace
```

## A first working setup

Using the standalone Docker install above:

1. Start the all-in-one container with the `docker run` command from the Install section. It writes configuration files into the current directory.

1. Open the console to confirm the control plane is up.

   ```bash
   open http://localhost:8001
   ```

1. Send a request through the gateway HTTP entry. Before any route is configured the gateway answers on port 8080, which confirms the Envoy data plane is serving.

   ```bash
   curl -i http://localhost:8080/
   ```

From the console you can then add a route (a domain plus an upstream service) and see it take effect without restarting the gateway, which is the behavior the [architecture](./architecture) page traces through xDS.

## Verify it works

- The container is running: `docker ps` shows `higress-ai`.
- The console responds on `http://localhost:8001`.
- The gateway data plane responds on port 8080 (an HTTP status back from `curl`, even a 404 before routes exist, means Envoy is up).

## Where to go next

For Helm values, high availability, and production hardening on Kubernetes, follow the official [Quick Start documentation](https://higress.ai/en/docs/latest/user/quickstart/). For the AI gateway, the `ai-proxy` plugin and its provider list live under `plugins/wasm-go/extensions/ai-proxy/`, and MCP server hosting is covered in the [MCP quickstart](https://higress.cn/en/ai/mcp-quick-start/). The [Internals](./internals) page maps the translation path if you want to read how Ingress becomes Envoy config.
