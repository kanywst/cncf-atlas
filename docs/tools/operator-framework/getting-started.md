# Getting Started

> Aligned with release v1.42.2. The SDK builds with Go 1.25 (`go.mod:3`). Commands assume a working Go toolchain, a container engine, and access to a Kubernetes cluster.

## Prerequisites

- A Kubernetes cluster and a configured `kubectl` context (a local kind or minikube cluster is fine).
- Go 1.25 or compatible, matching the toolchain in `go.mod:3`.
- A container engine such as Docker or Podman to build and push images.
- `make`, used by the generated project (`Makefile:92-95`).

## Install

Install a released `operator-sdk` binary from the project, or build from source. To build the CLI from a checkout of the repository:

```bash
make build
```

That runs `go build ... -o $(BUILD_DIR) ./cmd/{operator-sdk,helm-operator}` (`Makefile:92-95`), producing the `operator-sdk` binary. Official binary downloads are listed at the documentation site at `sdk.operatorframework.io`.

## A first working setup

This scaffolds a minimal Go Operator and runs its controller against your current cluster. The `init` and `create api` steps are kubebuilder commands underneath (`internal/cmd/operator-sdk/cli/cli.go:72-128`).

1. Create a project directory and initialize the project.

```bash
mkdir memcached-operator && cd memcached-operator
operator-sdk init --domain example.com --repo github.com/example/memcached-operator
```

1. Create an API group, version, kind, and a controller for it.

```bash
operator-sdk create api --group cache --version v1alpha1 --kind Memcached --resource --controller
```

1. Generate manifests, install the CRD, and run the controller locally against your cluster.

```bash
make manifests
make install
make run
```

`make run` starts the controller in the foreground using your kubeconfig. It logs that the manager has started and is reconciling.

## Verify it works

Confirm the CLI and the installed CRD:

```bash
operator-sdk version
kubectl get crd memcacheds.cache.example.com
```

A populated version string and a listed CRD confirm the scaffolding and install worked. To exercise the OLM path instead, package the Operator as a bundle and deploy it with `operator-sdk run bundle <bundle-image>`, which creates a CatalogSource, Subscription, and InstallPlan and waits for the CSV to install (`internal/olm/operator/registry/operator_installer.go:55-102`).

## Where to go next

For production concerns such as bundle publishing, OLM catalog management, scorecard validation, and the Ansible and Helm Operator paths, see the official documentation at `sdk.operatorframework.io`. For the lifecycle runtime, see `operator-lifecycle-manager` (v0) and `operator-controller` (v1).

## Sources

1. Operator SDK documentation site: <https://sdk.operatorframework.io/>
2. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
3. operator-framework/operator-lifecycle-manager: <https://github.com/operator-framework/operator-lifecycle-manager>
4. operator-framework/operator-controller: <https://github.com/operator-framework/operator-controller>
