# Getting Started

> Verified against tag `1.4.1`. Commands assume a Kubernetes cluster with a compatible Istio already installed.

## Prerequisites

- A Kubernetes cluster with `kubectl` configured.
- A compatible Istio install (Aeraki 1.4.x targets Istio 1.18.x), per the [install docs](https://www.aeraki.net/docs/v1.x/install/).
- Istio's ConfigMap adjusted to add the DNS capture and metrics settings Aeraki protocols need, per the [install docs](https://www.aeraki.net/docs/v1.x/install/).
- For building from source: Go >= 1.16 and Docker with Docker Compose (`README.md:131-132`).

## Install

```bash
git clone https://github.com/aeraki-mesh/aeraki.git
cd aeraki
export AERAKI_TAG=1.4.1
make install
```

`make install` runs `bash demo/install-aeraki.sh` (`Makefile:39-40`).

## A first working setup

1. Clone the repository and pin a release tag.

   ```bash
   git clone https://github.com/aeraki-mesh/aeraki.git
   cd aeraki
   export AERAKI_TAG=1.4.1
   ```

2. Install Aeraki into the cluster.

   ```bash
   make install
   ```

3. Deploy the demo application to exercise a non-HTTP protocol.

   ```bash
   make demo
   ```

   This runs `bash demo/install-demo.sh default` (`Makefile:43-44`). The Kafka demo is `make demo-kafka` and the bRPC demo is `make demo-brpc` (`Makefile:49-54`).

## Verify it works

Check that the Aeraki control plane pod is running:

```bash
kubectl get pod -n istio-system -l app=aeraki
```

Aeraki's default root namespace is `istio-system` (`cmd/aeraki/main.go:40`). Confirm that Aeraki generated `EnvoyFilter` resources, which carry the `manager=aeraki` label it reconciles against (`internal/envoyfilter/controller.go:135-137`):

```bash
kubectl get envoyfilter -A -l manager=aeraki
```

## Where to go next

For production concerns such as high availability, the leader-election and replica model is described in the [Architecture](./architecture) page. For build-from-source options on Linux and macOS, see `make build` and `make build IMAGE_OS=darwin` (`README.md:137-141`). The official [quickstart](https://www.aeraki.net/docs/v1.x/quickstart/) and [install guide](https://www.aeraki.net/docs/v1.x/install/) cover version matching and tutorials for adding a custom protocol.
