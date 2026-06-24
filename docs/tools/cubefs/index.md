# CubeFS

> A distributed file and object store that separates metadata from data and lets each volume pick replication or erasure coding.

- **Category**: Storage & Database
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [cubefs/cubefs](https://github.com/cubefs/cubefs)
- **Documented at commit**: `6b2e792` (master, 2026-06-22)

## What it is

CubeFS is a distributed storage system that exposes the same data through POSIX (FUSE), S3, and HDFS-compatible interfaces. It splits responsibility across small roles. Metadata such as inodes and directory entries lives in memory on MetaNodes, file content lives as extents on DataNodes, and a separate resource manager (Master) tracks the cluster layout. A single `cfs-server` binary becomes one of these roles depending on the `role` key in its config (`cmd/cmd.go:184`, `cmd/cmd.go:206-239`).

The design target is compute and storage separation for container platforms. The original SIGMOD 2019 paper describes CubeFS (then ChubaoFS) as backing storage for large container deployments at JD.com, where compute pods stay stateless and durable state sits in the file system (S7).

A volume chooses one of two storage engines. Multi-replica volumes use strongly consistent chain replication across DataNodes. Erasure-coded volumes route data through BlobStore (`blobstore/`) for lower cost at very large scale. Both engines share the same metadata plane.

## When to use it

- You need one system that serves the same data over POSIX, S3, and HDFS interfaces.
- You run stateful workloads on Kubernetes and want storage decoupled from compute pods.
- You have metadata-heavy workloads (many small files, frequent stat or list) and can keep metadata in RAM.
- You want replication for hot data and erasure coding for cold, capacity-heavy data within the same cluster.

It is a weaker fit when you need a single small node, when total metadata would exceed available MetaNode RAM, or when your application depends on strict POSIX consistency that CubeFS relaxes for performance (S2).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cubefs/cubefs repository (README, ADOPTERS, source)](https://github.com/cubefs/cubefs)
2. [CubeFS docs: introduction.md](https://github.com/cubefs/cubefs/blob/master/docs/source/overview/introduction.md)
3. [CNCF announces CubeFS graduation](https://www.cncf.io/announcements/2025/01/21/cloud-native-computing-foundation-announces-cubefs-graduation/)
4. [CubeFS CNCF project page](https://www.cncf.io/projects/cubefs/)
5. [The New Stack: Cloud Native Computing Now Has Its Own File System](https://thenewstack.io/cloud-native-computing-now-has-its-own-file-system-cubefs/)
6. [SiliconANGLE: CubeFS graduates from CNCF incubation](https://siliconangle.com/2025/01/21/cubefs-storage-platform-graduates-cncf-incubation/)
7. [CFS: A Distributed File System for Large Scale Container Platforms (SIGMOD 2019)](https://dl.acm.org/doi/10.1145/3299869.3314046)
8. [arXiv 1911.03001 (paper preprint)](https://arxiv.org/abs/1911.03001)
9. [CubeFS self-assessment (CNCF TAG Security)](https://tag-security.cncf.io/community/assessments/projects/cubefs/self-assessment/)
10. [cubefs/cubefs release v3.5.3](https://github.com/cubefs/cubefs/releases/tag/v3.5.3)
11. [InfoQ: CubeFS graduates from CNCF](https://www.infoq.com/news/2025/03/cubefs-cncf-graduation/)
