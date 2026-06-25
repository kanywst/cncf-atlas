# History

## Origin

Longhorn started at Rancher Labs. The data plane came first: the `longhorn/longhorn-engine` repository was created on 2016-04-08, and the umbrella `longhorn/longhorn` repository followed on 2017-04-14. Rancher introduced it publicly in April 2017 as a new distributed block storage system built for containers, with co-founder Sheng Liang presenting the idea ([source 5](https://www.rancher.com/blog/2019/longhorn-accepted-into-cncf/), [source 4](https://www.cncf.io/projects/longhorn/)).

The lineage matters for reading the code. The storage controller existed before Kubernetes integration; the control plane (`longhorn-manager`) was layered on top later as a set of CRDs and controllers. That is why the manager `README.md` describes itself only as "Manager for Longhorn" and why the data plane lives in sibling repositories rather than in the manager itself.

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | `longhorn-engine` repository created (2016-04-08), the original storage controller. |
| 2017 | `longhorn/longhorn` umbrella repository created (2017-04-14); Rancher announces Longhorn publicly. |
| 2019 | Donated to CNCF and accepted as a Sandbox project (2019-10-11) at version 0.6.2. |
| 2020 | Rancher is acquired by SUSE; SUSE becomes the primary sponsor. |
| 2021 | CNCF TOC promotes Longhorn to Incubating (2021-11-04). |
| 2026 | `v1.12.0` released (2026-06-02), the latest release at the time of this deep-dive. |

## How it evolved

When Longhorn was donated to the CNCF Sandbox in October 2019, the v0.6.2 release already shipped snapshots, backup and restore, live upgrade, disaster recovery, one-click install, and a GUI ([source 6](https://devclass.com/2019/10/29/cncf-welcomes-longhorn-to-its-sandbox/), [source 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/)). The acquisition of Rancher by SUSE in 2020 shifted sponsorship; the commercial product is now "SUSE Storage (powered by Longhorn)" ([source 7](https://www.suse.com/c/persistent-block-storage-for-kubernetes-suse-storage-powered-by-longhorn/)).

The largest engineering shift visible in current source is the v2 Data Engine. The original v1 engine is built on iSCSI and `tgt`. Recent releases add a v2 data engine built on SPDK. The branching is pervasive in the code: `types.IsDataEngineV2(volume.Spec.DataEngine)` gates separate teardown paths (`controller/volume_controller.go:365`), and a `ublk` frontend appears in the volume CRD alongside the older `blockdev` and `iscsi` frontends (`k8s/pkg/apis/longhorn/v1beta2/volume.go:256`).

## Where it stands now

Longhorn promoted to CNCF Incubating on 2021-11-04. The CNCF cited growth since donation: from 200 contributors across 30 companies to 800+ across 120+ companies, from 14 committers across 3 companies to 70+ across 13+ companies, and from 2,700 to 34,000+ running nodes ([source 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/)). The latest release at the time of writing is `v1.12.0` (2026-06-02); the commit read here, `3b8885a`, is a later point on `master`. SUSE remains the primary corporate sponsor.
