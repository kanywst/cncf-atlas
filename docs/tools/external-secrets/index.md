# External Secrets Operator

> External Secrets Operator (ESO) reads secrets from an external store such as AWS Secrets Manager, HashiCorp Vault, or GCP Secret Manager and syncs them into native Kubernetes Secrets, so applications consume secrets the normal way while the source of truth stays outside the cluster.

- **Category**: Security & Compliance
- **CNCF maturity**: Sandbox (accepted 2022-07-26)
- **Language**: Go (`go 1.26.4`)
- **License**: Apache-2.0
- **Repository**: [external-secrets/external-secrets](https://github.com/external-secrets/external-secrets)
- **Documented at commit**: `e100613` (near chart tag `helm-chart-2.7.0`, 2026-06-26)

## What it is

External Secrets Operator is a Kubernetes controller that keeps native `Secret` objects in sync with values held in an external secret manager. You declare an `ExternalSecret` that names a store and the keys to pull, and the operator fetches those values and writes a Kubernetes `Secret` that your pods mount or reference as usual. The external store stays the source of truth; the cluster holds a synced copy that refreshes on an interval.

The design splits two concerns that a naive approach mixes together. A `SecretStore` (or `ClusterSecretStore`) holds the connection and authentication to one backend. An `ExternalSecret` says what to sync and where to put it. That separation means one store definition serves many `ExternalSecret` objects, and the credentials to reach a backend live in one place instead of being repeated per secret (`README.md`, `apis/externalsecrets/v1/secretstore_types.go`).

The operator supports many backends through a provider interface: 41 providers ship in the tree under `providers/v1/`, covering AWS Secrets Manager and Parameter Store, HashiCorp Vault and OpenBao, GCP Secret Manager, Azure Key Vault, IBM Cloud, Akeyless, CyberArk Conjur, 1Password, Doppler, Bitwarden, and more. It also runs in reverse: a `PushSecret` writes a Kubernetes Secret back out to a provider.

## When to use it

- You keep secrets in an external manager (AWS, Vault, GCP, Azure, and others) and want them available as Kubernetes Secrets without wiring each app to the backend SDK.
- You run GitOps with Argo CD or Flux and want to commit the `ExternalSecret` reference to Git while the actual value stays in the external store.
- You need to fan a secret out to many namespaces (`ClusterExternalSecret`) or push a cluster-generated secret back to a provider (`PushSecret`).
- You want one store definition and one set of backend credentials to serve many secrets across a cluster.
- Not the right fit if you specifically want to avoid putting secret material in etcd at all: ESO always materializes a Kubernetes `Secret`. The Secrets Store CSI Driver mounts values into pods without creating a Secret, which suits that constraint better.
- Not a secret manager itself. ESO reads from and writes to an external backend; it does not store the master copy.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a sync flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working sync.

## Sources

1. [external-secrets/external-secrets (GitHub)](https://github.com/external-secrets/external-secrets) (accessed 2026-07-09)
2. [External Secrets Operator source at pinned commit e100613](https://github.com/external-secrets/external-secrets/tree/e1006131b195afa4138e6cc815e1168f533ce95c) (accessed 2026-07-09)
3. [CNCF project page: External Secrets](https://www.cncf.io/projects/external-secrets/) (accessed 2026-07-09)
4. [External Secrets Operator Accepted into the CNCF Sandbox (Container Solutions)](https://blog.container-solutions.com/external-secrets-operator-accepted-into-the-cncf-sandbox) (accessed 2026-07-09)
5. [The Birth of the External Secrets Community (Container Solutions)](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community) (accessed 2026-07-09)
6. [Kubernetes External Secrets (GoDaddy engineering)](https://www.godaddy.com/resources/news/kubernetes-external-secrets) (accessed 2026-07-09)
7. [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) (accessed 2026-07-09)
8. [[HEALTH]: External Secrets Operator (CNCF TOC #1819)](https://github.com/cncf/toc/issues/1819) (accessed 2026-07-09)
9. [External Secrets Operator documentation (external-secrets.io)](https://external-secrets.io) (accessed 2026-07-09)
