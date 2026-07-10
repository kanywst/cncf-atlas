# Getting Started

> Commands assume a running Kubernetes cluster and a working `kubectl` and `helm`. The fastest external-dependency-free check uses a self-signed Issuer.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl`.
- Helm 3 installed (or use the static manifests instead).
- Cluster-admin permissions, since cert-manager installs CRDs.

## Install

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true
```

If you prefer not to use Helm, apply the static manifest with `kubectl apply -f` from the release assets instead ([source 1](https://github.com/cert-manager/cert-manager)).

## A first working setup

The shortest path that runs without any external CA or DNS is a self-signed Issuer plus one Certificate. ACME issuance needs a reachable domain and DNS, so it is not the quickest first check.

1. Create a self-signed Issuer in a namespace.

   ```bash
   kubectl create namespace demo
   cat <<'EOF' | kubectl apply -f -
   apiVersion: cert-manager.io/v1
   kind: Issuer
   metadata:
     name: selfsigned
     namespace: demo
   spec:
     selfSigned: {}
   EOF
   ```

1. Request a Certificate from it.

   ```bash
   cat <<'EOF' | kubectl apply -f -
   apiVersion: cert-manager.io/v1
   kind: Certificate
   metadata:
     name: demo-cert
     namespace: demo
   spec:
     secretName: demo-cert-tls
     commonName: demo.example.com
     dnsNames:
       - demo.example.com
     issuerRef:
       name: selfsigned
       kind: Issuer
   EOF
   ```

## Verify it works

Check that the Certificate reports Ready and that the backing Secret exists.

```bash
kubectl get certificate demo-cert -n demo
kubectl get secret demo-cert-tls -n demo
```

The Certificate's `READY` column should read `True`, and the Secret should contain `tls.crt` and `tls.key`. If it stays `False`, inspect the chain of resources with `kubectl describe certificate demo-cert -n demo` and look at the linked CertificateRequest.

## Where to go next

For ACME (Let's Encrypt) issuers, DNS-01 and HTTP-01 solvers, Gateway API integration, high availability, and hardening, see the official documentation at `cert-manager.io`. This page only covers the minimal local check; production concerns are documented upstream.
