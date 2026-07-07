# CloudNativePG

> A Kubernetes operator that runs PostgreSQL with high availability, using the Kubernetes API itself as the consensus store instead of an external tool like etcd or Patroni.

- **Category**: Storage & Database
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache License 2.0
- **Repository**: [cloudnative-pg/cloudnative-pg](https://github.com/cloudnative-pg/cloudnative-pg)
- **Documented at commit**: `7ef33bb` (2026-06-26, `main`)

## What it is

CloudNativePG is a Kubernetes operator for PostgreSQL. You describe the database you want with a `Cluster` custom resource (number of instances, storage size, PostgreSQL configuration, backup policy), and the operator creates and maintains the Pods, Services, Secrets, and volumes that run it. It covers the full lifecycle: bootstrap, failover, switchover, rolling updates, backup, and recovery.

Its defining design choice is that it relies on no external Distributed Configuration Store (DCS). Most PostgreSQL high-availability stacks use Patroni or repmgr backed by etcd, Consul, or ZooKeeper to elect a primary. CloudNativePG instead treats the Kubernetes API server as the single source of truth. The operator watches the `Cluster` resource, and an in-Pod agent called the instance manager watches the same resource, so the cluster state and the database topology live in one place.

The project began as a proprietary EDB product, was open-sourced and donated to a vendor-neutral community in 2022, and joined the CNCF Sandbox in January 2025. It is written in Go on top of controller-runtime.

## When to use it

- You run PostgreSQL on Kubernetes and want declarative high availability without operating a separate etcd or Consul cluster for leader election.
- You want immutable, disposable database Pods with images pinned by digest and automated rolling updates.
- You need integrated backup and point-in-time recovery to object storage (S3 and compatible), plus Prometheus metrics out of the box.
- You want a CNCF, vendor-neutral operator rather than one tied to a single vendor's commercial product.

When it is not the right fit:

- You need a database engine other than PostgreSQL, or you run PostgreSQL outside Kubernetes.
- You require multi-primary write scaling. CloudNativePG is single-primary with read replicas, not an active-active cluster.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cloudnative-pg/cloudnative-pg repository (README and source)](https://github.com/cloudnative-pg/cloudnative-pg)
2. [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md)
3. [Introducing CloudNativePG (EDB)](https://www.enterprisedb.com/blog/introducing-cloudnativepg-new-open-source-kubernetes-operator-postgres)
4. [CloudNativePG Officially Joins the CNCF Sandbox (EDB)](https://www.enterprisedb.com/blog/cloudnativepg-officially-joins-cncf-sandbox-milestone-cloud-native-postgresql)
5. [cncf/sandbox issue #128 (Sandbox application)](https://github.com/cncf/sandbox/issues/128)
6. [CloudNativePG official documentation](https://cloudnative-pg.io/documentation/)
