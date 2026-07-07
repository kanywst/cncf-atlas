# Adoption & Ecosystem

## Who uses it

The organizations below are listed with dates in the project's `ADOPTERS.md`, which records only companies that have publicly stated they run CloudNativePG in production. Each row cites that file.

| Organisation | Use case | Source |
| --- | --- | --- |
| EDB | Runs PostgreSQL under its BigAnimal DBaaS on CloudNativePG; the founding organization (2023-02-21). | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| IBM | Embedded SQL database for IBM Cloud Pak products on OpenShift (2024-02-20). | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Google Cloud | Offered via GKE and the Marketplace (2024-03-12). | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Microsoft Azure | Published PostgreSQL HA deployment guidance for AKS on Microsoft Learn (2024-08-22). | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Akamai Technologies | Platform-managed PostgreSQL inside the Akamai App Platform (2024-11-20). | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Mirakl | Operates 300+ clusters totaling 8 TB (2025-02-03). | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Vera Rubin Observatory | Telescope systems and astronomical data release (2025-06-17). | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Ericsson | PostgreSQL for 5G network products (2026-06-17). | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |

The same file lists further adopters including Tesla (2026-03-31), Belastingdienst (the Netherlands Tax Administration, 2026-04-02), Nutanix NKP (2025-11-19), and PostgreSQL platform vendors (Tembo, ParadeDB, Xata, pgEdge) that build their compute layer on it.

## Adoption signals

- GitHub stars: about 8,883 on the `cloudnative-pg/cloudnative-pg` repository (observed 2026-06-28).
- Contributors: roughly 226, measured from the last page of the GitHub contributors API (observed 2026-06-28).
- Release cadence: a maintained stable minor line (v1.29.1, 2026-05-08) with the next minor prepared through release candidates (`v1.30.0-rc1`) carried in `releases/` on `main`.
- CNCF status: accepted into the Sandbox in January 2025 (cncf/sandbox issue #128), with maintainers publicly targeting Incubation next.

## Ecosystem

- **Observability**: the operator generates a `PodMonitor` for Prometheus, and the quickstart wires up the kube-prometheus-stack with Grafana dashboards.
- **Backup**: WAL (Write-Ahead Log) archiving and base backups go to object storage (S3 and compatible) through barman-cloud, now packaged as a CNPG-i (CloudNativePG Plugin Interface) plugin (`cloudnative-pg/barman-cloud`).
- **Connection pooling**: the `Pooler` CRD provisions PgBouncer in front of a cluster.
- **Distribution**: published on OperatorHub.io, as a Helm chart, and through the Bitnami and Tanzu Application Catalogs.

## Alternatives

The PostgreSQL-on-Kubernetes operator space is crowded. The honest distinctions:

| Alternative | Differs by |
| --- | --- |
| Crunchy Data PGO | Established operator with a stronger commercial orientation; a founder-written comparison weighs the trade-offs ([source](https://www.gabrielebartolini.it/articles/2026/05/cloudnativepg-and-crunchy-pgo-an-honest-opinionated-comparison/)). |
| Zalando postgres-operator | Built on Patroni and Spilo, so it depends on an external HA tool, the opposite of CloudNativePG's Kubernetes-API-only design. |
| StackGres (OnGres) | Adds a heavier management UI and stack of sidecars around PostgreSQL. |
| KubeDB (AppsCode) | Multi-engine operator (covers many databases, not PostgreSQL alone), with commercial licensing for advanced features. |

Pick CloudNativePG when you want a vendor-neutral CNCF operator with no external DCS and immutable Pods. Pick a Patroni-based operator if you already standardize on Patroni operationally, or KubeDB if you need one operator across many database engines.
