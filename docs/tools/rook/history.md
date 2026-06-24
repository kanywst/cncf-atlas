# History

## Origin

Rook began as a GitHub project on 2016-07-08 ([rook/rook](https://github.com/rook/rook)). It was started by Bassam Tabbara, who went on to found and lead Upbound, with early backing from Quantum ([Upbound blog](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable)). The premise was deliberate: rather than write a new storage system for containers, Rook would take Ceph, a distributed storage system with a long production track record, and make it a first-class cloud-native service that Kubernetes could operate declaratively ([Upbound blog](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable), [rook.io](https://rook.io/)).

That choice shaped everything that followed. Rook owns the control plane (how Ceph daemons are deployed, configured, and upgraded) and leaves the data path to Ceph and its CSI driver.

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Repository created; project founded by Bassam Tabbara with Quantum as early sponsor |
| 2018 | Accepted by CNCF as its 15th hosted project, the first storage project in CNCF |
| 2019 | CNCF Security SIG audit produced 13 findings (High to Low), all addressed |
| 2020 | Graduated from CNCF, the first block/file/object storage project to do so |

## How it evolved

Early Rook reached beyond Ceph. Before v0.9 it also supported CockroachDB and Minio, and later releases added storage providers such as NFS, Cassandra, and EdgeFS ([Upbound blog](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable)). That breadth did not last. The project converged on Ceph as its single supported backend, and the Cassandra and NFS providers were split out into separate repositories ([Upbound blog](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable)). The operator code today reflects a Ceph-only focus.

Growth tracked the narrowing of scope. During CNCF incubation the core repository's contributor count rose from 90 to 279, a 260% increase ([CNCF graduation announcement](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/)). The 2019 security audit by the CNCF Security SIG, with findings ranging from High to Low severity, was completed and remediated ahead of graduation ([CNCF graduation announcement](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/)).

Rook joined the CNCF in January 2018 as its 15th hosted project and the first storage project under the foundation ([CNCF blog](https://www.cncf.io/blog/2018/01/29/cncf-host-rook-project-cloud-native-storage-capabilities/)). It reached Graduated status on 2020-10-07, the first block, file, and object storage project to do so ([CNCF graduation announcement](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/)).

## Where it stands now

Rook is a graduated CNCF project under a steering committee whose members include Travis Nielsen (Red Hat) and Jared Watts (Independent/Upbound), with active maintainers such as leseb, BlaineEXE, satoru-takeuchi, subhamkrai, and sp98 ([OWNERS.md](https://github.com/rook/rook/blob/master/OWNERS.md)). Red Hat carries significant weight here because Rook underpins Red Hat OpenShift Data Foundation. The project releases on a regular cadence; the commit documented here, `63eed4e` (2026-06-19), sits just after the `v1.20.1` tag (2026-06-16) ([rook/rook](https://github.com/rook/rook)).
