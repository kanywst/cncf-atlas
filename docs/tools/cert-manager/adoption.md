# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS` file, so named adopters are limited to those with a citable public source. The one named in the CNCF graduation announcement is Giant Swarm.

| Organisation | Use case | Source |
| --- | --- | --- |
| Giant Swarm | Calls cert-manager an essential component of its Cluster API-based Kubernetes platform | [source 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/) |

## Adoption signals

Beyond named adopters, the public signals are large. At graduation on 2024-11-12 the project and CNCF reported roughly 500 million downloads per month, that 86% of new production clusters install it by default, 450+ contributors, and 200+ releases ([source 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/), [source 4](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/)).

On GitHub the `cert-manager/cert-manager` repository had 13,873 stars and 2,383 forks as observed on 2026-06-22 ([source 1](https://github.com/cert-manager/cert-manager)). It is a CNCF Graduated project ([source 9](https://www.cncf.io/projects/cert-manager/)).

## Ecosystem

cert-manager is usually run alongside complementary tools rather than alone. trust-manager (same cert-manager org) distributes CA bundles, and external-secrets syncs secrets from external stores; both are commonly paired with it ([source 5](https://infisical.com/blog/best-certificate-management-tools)).

On the issuer side it integrates with Let's Encrypt and other ACME CAs, HashiCorp Vault PKI, Venafi and CyberArk, CyberArk Certificate Manager, EJBCA, and in-cluster or self-signed CAs, and it feeds certificates to Ingress controllers and the Gateway API ([source 1](https://github.com/cert-manager/cert-manager), [source 5](https://infisical.com/blog/best-certificate-management-tools)). Commercially, CyberArk Certificate Manager for Kubernetes (formerly Venafi TLS Protect) builds discovery, policy, FIPS, and support on top of cert-manager, and Keyfactor reaches Kubernetes through a cert-manager issuer ([source 5](https://infisical.com/blog/best-certificate-management-tools), [source 6](https://www.cyberark.com/products/certificate-manager-for-kubernetes/)).

## Alternatives

cert-manager is the de facto standard for in-cluster Kubernetes certificate automation ([source 5](https://infisical.com/blog/best-certificate-management-tools)). The real alternatives differ in philosophy rather than being drop-in replacements.

| Alternative | Differs by |
| --- | --- |
| HashiCorp Vault PKI | Issues short-lived certificates on demand via API; on Kubernetes it is commonly used as a cert-manager backend rather than instead of it ([source 5](https://infisical.com/blog/best-certificate-management-tools)) |
| Venafi / Keyfactor (enterprise CLM) | Full certificate lifecycle management with per-identity pricing that scales poorly against ephemeral Kubernetes workloads, where cert-manager's open-source model is the OSS advantage ([source 5](https://infisical.com/blog/best-certificate-management-tools)) |
| CyberArk Certificate Manager for Kubernetes | A commercial layer on top of cert-manager adding discovery, policy, FIPS, and support, not a separate engine ([source 6](https://www.cyberark.com/products/certificate-manager-for-kubernetes/)) |
