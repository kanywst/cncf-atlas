# History

## Origin

Carina started as an internal project at BoCloud (BeyondCent). The copyright header on the source files reads `Copyright @ 2021 bocloud <fushaosong@beyondcent.com>` (`api/v1/logicvolume_types.go:2`), and the GitHub repository was created on 2021-08-18. BoCloud sells a container platform in China and built Carina to run cloud native databases and middleware on local disks.

The problem it set out to solve is stated in the README Background. As stateful applications move into Kubernetes, distributed storage systems handle replication and consistency at the storage layer, while the database does the same thing again at the application layer. That double work wastes capacity and adds latency. Carina keeps the storage layer thin and gives the database the raw performance of a local disk.

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Repository created (2021-08-18) as a BoCloud internal project. |
| 2022 | Accepted into the CNCF Sandbox on 2022-12-14. |
| 2025 | Latest release v0.14.0 (2025-04-16); last push to the repository in the same week. |

## How it evolved

Carina follows the CRD-mediated design pioneered by TopoLVM: the controller never touches a disk and instead writes a custom resource that the node agent acts on. The README uses the same vocabulary. Over time the driver grew beyond plain LVM. By the documented commit it supports three volume types selected at reconcile time (`controllers/logicvolume_controller.go:163`): LVM volumes, raw disk partitions, and host directories. It also added bcache-based tiering, where a fast cache disk and a slow backend disk are combined into one volume (`pkg/csidriver/driver/controller.go:472`).

CNCF onboarding is tracked in cncf/sandbox #204 and cncf/toc #974. The project also registered with the OpenSSF Best Practices badge program (project 6908, linked from the README) and displays a FOSSA license scan badge.

## Where it stands now

The most recent release is v0.14.0 (2025-04-16), and the documented commit `aec3a9f` (2025-04-15) is the commit just before it. The last push to the repository was in the same week, and commits stop after April 2025, so activity has slowed sharply. As of 2026-06-26 the GitHub repository shows roughly 724 stars, 86 forks, about 20 contributors, and 40 open issues. The project remains at the CNCF Sandbox maturity level.
