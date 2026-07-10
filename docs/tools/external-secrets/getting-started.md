# Getting Started

> Verified against the source at commit `e100613` (near chart tag `helm-chart-2.7.0`). Commands assume a running Kubernetes cluster and `kubectl` plus `helm`.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl` (a local kind or minikube cluster is fine).
- Helm 3, used to install the operator chart.
- No cloud account is needed for the first setup below: it uses the built-in `fake` provider so you can see a sync without wiring a real backend.

## Install

Install the operator and its CRDs with Helm:

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets --create-namespace
```

## A first working setup

This creates a `SecretStore` backed by the `fake` provider, syncs one value through an `ExternalSecret`, and reads the resulting Kubernetes Secret. The `fake` provider returns values you inline in the store, so it exercises the full reconcile path with no external service.

1. Create a `SecretStore` using the `fake` provider with one canned value.

```bash
kubectl apply -f - <<'EOF'
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: fake-store
spec:
  provider:
    fake:
      data:
        - key: "/db/password"
          value: "s3cr3t"
EOF
```

1. Create an `ExternalSecret` that pulls that key into a Kubernetes Secret named `db-secret`.

```bash
kubectl apply -f - <<'EOF'
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: db-secret
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: fake-store
    kind: SecretStore
  target:
    name: db-secret
  data:
    - secretKey: password
      remoteRef:
        key: "/db/password"
EOF
```

1. Read back the synced Secret and confirm the value.

```bash
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 -d
```

The command prints `s3cr3t`, the value the `fake` provider returned.

## Verify it works

Check that the `ExternalSecret` reports a healthy sync:

```bash
kubectl get externalsecret db-secret
```

The `STATUS` column shows `SecretSynced` and `READY` is `True` once the operator has written the target Secret. If a store is misconfigured, the `SecretStore` status and the `ExternalSecret` events carry the reason. When a referenced remote key is absent, the operator applies the target `deletionPolicy` (Delete, Retain, or Merge) instead of failing outright.

## Where to go next

For real backends (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager, Azure Key Vault, and the rest of the 41 providers), authentication options, `ClusterSecretStore` for cluster-wide stores, `ClusterExternalSecret` for multi-namespace fan-out, `PushSecret` for writing back to a provider, and templating of the target Secret, see the official docs at <https://external-secrets.io>.
