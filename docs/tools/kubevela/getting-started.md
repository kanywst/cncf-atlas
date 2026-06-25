# Getting Started

> Install steps follow the official documentation. Commands assume a running Kubernetes cluster and Helm 3.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl`.
- Helm 3 installed locally.

## Install

KubeVela's core controller installs as a Helm chart from the project's chart repository ([KubeVela docs](https://kubevela.io/docs/)):

```bash
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install --create-namespace -n vela-system kubevela kubevela/vela-core
```

## A first working setup

After the controller is running, deliver an application by applying an `Application` custom resource with `kubectl`.

Write a minimal `Application` to `app.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
            expose: true
```

Apply it:

```bash
kubectl apply -f app.yaml
```

The `Application` resource holds `components`, `policies`, and a `workflow` (`src/apis/core.oam.dev/v1beta1/application_types.go:51-65`). The `webservice` type and its `properties` are resolved by the matching ComponentDefinition at reconcile time.

## Verify it works

`Application` resources are registered with print columns for phase and health, so a plain `get` shows status (`src/apis/core.oam.dev/v1beta1/application_types.go:74-78`):

```bash
kubectl get application first-vela-app
```

Wait for the `PHASE` column to read `running`. The controller-manager logs each reconcile as `Start reconcile application` ... `End reconcile application` (`src/pkg/controller/core.oam.dev/v1beta1/application/application_controller.go:112-114`), which is useful when a delivery is stuck.

## Where to go next

For multi-cluster delivery, custom ComponentDefinitions and TraitDefinitions in CUE, addons, and production hardening, see the official documentation at [`kubevela.io/docs`](https://kubevela.io/docs/).
