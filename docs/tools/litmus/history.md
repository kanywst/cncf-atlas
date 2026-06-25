# History

## Origin

Litmus began in late 2017 inside MayaData, growing out of the OpenEBS community as a way to run simple chaos jobs against Kubernetes storage and workloads. The GitHub repository was created on 2017-03-15. The CNCF Q4 2025 update traces this lineage from OpenEBS roots to a standalone chaos engineering project.

MayaData donated the project to the CNCF, and Litmus was accepted into the Sandbox on 2020-06-25. The Sandbox entry was filed as cncf/toc issue #390.

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Project started inside MayaData, from the OpenEBS community; repository created 2017-03-15 |
| 2020 | Accepted into the CNCF Sandbox (2020-06-25) |
| 2021 | ChaosNative spun out of MayaData as a company dedicated to Litmus (2021-02-10) |
| 2022 | Promoted to CNCF Incubating (2022-01-11), with 25+ organizations in production |
| 2023 | Litmus 3.0 GA at KubeCon Chicago: full ChaosCenter rearchitecture |
| 2026 | Release 3.30.0 (2026-06-17), the commit this deep-dive pins |

## How it evolved

The biggest commercial shift came on 2021-02-10, when ChaosNative spun out of MayaData as a company focused entirely on Litmus adoption, led by CEO Uma Mukkara. ChaosNative was later acquired by Harness, and the UI today builds on the Harness UICore library.

The biggest technical shift was Litmus 3.0, shipped GA at KubeCon Chicago in November 2023. It was a full rearchitecture of ChaosCenter: a new UI, Environments, the Monaco-based Chaos Studio editor for YAML and visual editing, reusable resilience probes, standardization on MongoDB, and a refactored backend API. The 3.0 release also renamed core concepts: Chaos Agents became Chaos Infrastructures, Workflows became Chaos Experiments, and the older Experiments became Chaos Faults. The 3.x line is not compatible with 2.x.

## Where it stands now

The project ships a minor release (3.x.0) on the 15th of each month, with patch releases as demand requires. The commit documented here is tag 3.30.0, released 2026-06-17. Litmus remains a CNCF Incubating project. The fault injection code and experiment bundles are maintained in separate repositories (`litmuschaos/litmus-go` and `litmuschaos/chaos-charts`), while this repository carries the ChaosCenter control plane.
