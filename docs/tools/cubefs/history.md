# History

## Origin

CubeFS started inside JD.com (京东) in 2017 as an internal file system, originally named ChubaoFS (from the Chinese "储宝", Chǔbǎo). Haifeng Liu was the founder and lead maintainer (S5, S6). The design was published at SIGMOD 2019 as "CFS: A Distributed File System for Large Scale Container Platforms" (Liu et al., DOI 10.1145/3299869.3314046, preprint arXiv 1911.03001) (S7, S8). The motivation was compute and storage separation for container platforms: stateless compute pods, with durable state in a shared file system. The paper claims roughly 3x the metadata operation throughput of Ceph for its target workloads (S7).

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Created inside JD.com as ChubaoFS |
| 2019 | SIGMOD paper published; JD.com donates ChubaoFS to CNCF; accepted as Sandbox on 2019-12-16 (S3, S4, S7) |
| 2020 | OPPO joins as promoter and contributor (S5) |
| 2022 | Renamed ChubaoFS to CubeFS at incubation time; promoted to Incubating on 2022-07-03 (S4, S5) |
| 2024 | CNCF TOC approves graduation on 2024-12-11 (S3, S4) |
| 2025 | Graduation announced publicly on 2025-01-21 (S3, S4) |

## How it evolved

The most visible shift is the rename. At incubation application time in 2022 the maintainers found ChubaoFS hard to pronounce in English and renamed it to CubeFS (S5). Traces of the old name still appear in repository badge URLs that reference `chubao-fs` and `clomonitor.io/projects/cncf/chubao-fs`.

Beyond naming, the project grew from a single replication engine to two storage engines. BlobStore (`blobstore/`) added an erasure-coding path aimed at very large, low-cost capacity, alongside the original strongly consistent multi-replica path. Auxiliary roles were added over time: AuthNode for authentication, Console for a web UI, lcnode for lifecycle, and a distributed cache built from flashnode plus flashgroupmanager. All of these are roles of the same `cfs-server` binary (`cmd/cmd.go:71-93`).

## Where it stands now

CubeFS is a CNCF Graduated project as of January 2025 (S3). CNCF reported that adoption grew from roughly 10 to over 200 organizations across the Sandbox-to-graduation period, with about 350 PB under management at announcement time (S3, S4). The contributor base reported by CNCF grew from 27 to 379 across 42 companies (S3, S4). The most recent release at the documented commit is v3.5.3, dated 2025-12-23 (S10). The master HEAD documented here sits ahead of that tag.
