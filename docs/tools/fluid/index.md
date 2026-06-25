# Fluid

> A Kubernetes operator that makes datasets a first-class resource and orchestrates distributed caches (Alluxio, JuiceFS, JindoCache and others) to speed up data access for AI and big-data workloads.

- **Category**: Storage & Database
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [fluid-cloudnative/fluid](https://github.com/fluid-cloudnative/fluid)
- **Documented at commit**: `25531595` (master, 2026-06-23; latest release before it is `v1.0.8`, 2025-10-31)

## What it is

Fluid is a Kubernetes operator for elastic data access. Instead of treating remote storage (object stores, HDFS, NFS) as a passive mount, Fluid introduces a `Dataset` custom resource that describes where data lives, and a family of `Runtime` resources that each wrap a distributed cache engine. When you create a `Dataset` and a matching `Runtime`, Fluid deploys the cache system, binds the two together, and exposes the result as a normal PersistentVolumeClaim that application Pods mount.

The point is locality. Caching engines pull data close to the compute nodes, and Fluid injects scheduling affinity so that Pods land where their cache already lives. This matters most for AI training and analytics, where the same large dataset is read repeatedly and bandwidth to remote storage is the bottleneck.

Fluid is an orchestration layer, not a storage system. It does not implement a filesystem itself. It manages engines such as Alluxio, JuiceFS, JindoCache, Vineyard and EFC behind a single abstraction (`pkg/ddc/base/engine.go:32`), and drives them through Kubernetes controllers, a CSI driver, and an admission webhook.

## When to use it

- You run repeated reads over large remote datasets (model training, batch analytics) and want node-local caching without hand-rolling each cache engine.
- You want data-aware scheduling so compute Pods are placed near cached data.
- You want to switch or mix cache engines (Alluxio, JuiceFS, JindoCache) behind one declarative API.
- It is a weaker fit when you need a primary persistent store: Fluid accelerates access to data that lives elsewhere, it is not the system of record.
- It is unnecessary if your data already sits on fast node-local disk and is read once.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [fluid-cloudnative/fluid](https://github.com/fluid-cloudnative/fluid) source, pinned at commit `25531595e9233cb9340a3c544eb284b400b82d50`.
2. [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md).
3. [LICENSE](https://github.com/fluid-cloudnative/fluid/blob/master/LICENSE) (Apache-2.0).
4. [Fluid CNCF project page](https://www.cncf.io/projects/fluid/).
5. [Fluid Becomes a CNCF Incubating Project](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/).
6. [Fluid documentation](https://fluid-cloudnative.github.io/docs).
7. [GitHub REST API: fluid-cloudnative/fluid](https://api.github.com/repos/fluid-cloudnative/fluid).
