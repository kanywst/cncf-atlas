# cert-manager

> A Kubernetes controller that issues and renews X.509 certificates from ACME, Vault, Venafi, and private CAs as native cluster resources.

- **Category**: Security & Compliance
- **CNCF maturity**: Graduated
- **Language**: Go (`go 1.26.0`)
- **License**: Apache-2.0
- **Repository**: [cert-manager/cert-manager](https://github.com/cert-manager/cert-manager)
- **Documented at commit**: `dbc027ee` (master, 2026-06-19, near tag `v1.21.0-alpha.1`)

## What it is

cert-manager automates TLS certificate management inside Kubernetes. It adds custom resources such as `Certificate`, `Issuer`, and `ClusterIssuer`, then runs controllers that obtain certificates from a configured source and store them in Kubernetes Secrets. When a certificate nears expiry, the controllers renew it without operator action.

It supports several issuance backends through one common model: the ACME protocol (Let's Encrypt and compatible CAs), HashiCorp Vault PKI, Venafi and CyberArk, and in-cluster CA or self-signed signing. Workloads consume the resulting Secret the same way regardless of which backend signed it.

In a typical stack it sits behind Ingress controllers and the Gateway API, supplying the certificates those edges terminate TLS with. It is the de facto standard for in-cluster certificate automation on Kubernetes.

## When to use it

- You run workloads on Kubernetes and want TLS certificates issued and renewed automatically.
- You use Let's Encrypt or another ACME CA and need HTTP-01 or DNS-01 challenges solved in-cluster.
- You have an internal PKI (Public Key Infrastructure) backed by Vault, a private CA, or Venafi, and want a single Kubernetes-native way to consume it.
- You terminate TLS at Ingress or the Gateway API and want certificates wired in by annotation or reference.

It is a weaker fit when certificates live outside Kubernetes, where a host-level ACME client is simpler. It does not distribute trust bundles to workloads on its own; that is the job of the companion project trust-manager.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cert-manager/cert-manager README](https://github.com/cert-manager/cert-manager)
2. [Migrating from Kube-LEGO](https://cert-manager.io/docs/tutorials/acme/migrating-from-kube-lego/)
3. [CNCF Announces cert-manager Graduation](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/)
4. [cert-manager is now a CNCF Graduated Project](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/)
5. [Best Certificate Management Tools 2026 (Infisical)](https://infisical.com/blog/best-certificate-management-tools)
6. [CyberArk Certificate Manager for Kubernetes](https://www.cyberark.com/products/certificate-manager-for-kubernetes/)
7. [go.dev: jetstack/cert-manager (old import path)](https://pkg.go.dev/github.com/jetstack/cert-manager)
8. [Switching from kube-lego to cert-manager](https://vadosware.io/post/switching-from-kube-lego-to-cert-manager/)
9. [CNCF project page: cert-manager](https://www.cncf.io/projects/cert-manager/)
