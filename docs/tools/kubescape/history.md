# History

## Origin

Kubescape was created by ARMO, a security company based in Tel Aviv, Israel, and open-sourced in August 2021. The GitHub repository was created on 2021-08-12 ([repository](https://github.com/kubescape/kubescape)). The trigger was the NSA and CISA Kubernetes Hardening Guidance: ARMO positioned Kubescape as the first open-source tool to test a cluster for compliance with that guidance ([Business Wire](https://www.businesswire.com/news/home/20211012005814/en/ARMO-Launches-Expanded-Version-of-Kubescape-Worlds-First-Open-Source-Kubernetes-Testing-Tool-Compliant-with-NSA-CISA-Hardening-Guidance), [ARMO on Medium](https://medium.com/@jonathan_37674/kubescape-one-year-anniversary-open-source-announcment-armo-a1c25a44c054)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021-08 | ARMO open-sources Kubescape; first tool to test against the NSA/CISA Kubernetes Hardening Guidance. |
| 2021-10 | Major update adding the MITRE ATT&CK framework and a free SaaS backend. |
| 2022 | ARMO raises a $30M Series A around a fully open-source Kubernetes security platform. |
| 2022-11/12 | Kubescape enters the CNCF Sandbox; the CNCF project page records the acceptance date as 2022-12-13. |
| 2025-01 | CNCF Technical Oversight Committee accepts Kubescape as an Incubating project on 2025-01-13. |
| 2026-03 | Kubescape 4.0 announced at KubeCon EU 2026: runtime threat detection and Kubescape Storage reach GA. |

## How it evolved

Kubescape began as a posture scanner aimed at one published standard, then widened its rule coverage to MITRE ATT&CK and CIS while adding image vulnerability scanning ([Business Wire](https://www.businesswire.com/news/home/20211012005814/en/ARMO-Launches-Expanded-Version-of-Kubescape-Worlds-First-Open-Source-Kubernetes-Testing-Tool-Compliant-with-NSA-CISA-Hardening-Guidance)). A persistent design choice is that the control rules live outside the scanner, in the `kubescape/regolibrary` repository, so the rule set can change without shipping a new CLI.

The 4.0 release is the largest scope change recorded. It moved runtime threat detection and the Kubescape Storage layer to GA, removed the in-cluster host-sensor (a pop-up DaemonSet) and folded that work into the node-agent, and added scanning aimed at AI agents along with a KAgent plugin ([CNCF blog](https://www.cncf.io/blog/2026/03/26/announcing-kubescape-4-0-enterprise-stability-meets-the-ai-era/), [InfoQ](https://www.infoq.com/news/2026/03/kubescape-40/)). The dates in the sources for the Sandbox entry differ: the [CNCF project page](https://www.cncf.io/projects/kubescape/) says 2022-12-13, while the [incubation blog](https://www.cncf.io/blog/2025/02/26/kubescape-becomes-a-cncf-incubating-project/) says the project joined the Sandbox in November 2022. Both are recorded here rather than reconciled.

A version detail worth noting: the Go module path is still `github.com/kubescape/kubescape/v3` (`go.mod:1`) while release tags have advanced to `v4.0.x`. The major release tag and the Go module major version do not match at this commit.

## Where it stands now

The project is a CNCF Incubating project ([CNCF projects](https://www.cncf.io/projects/kubescape/)). The latest release at the time of writing is `v4.0.9`, published 2026-05-29 ([repository](https://github.com/kubescape/kubescape)). The maintainers ship the CLI plus a separate set of in-cluster components (operator, vulnerability scanner, node-agent, storage) through Helm charts, and the 4.0 announcement names Ben Hirschberg as a core maintainer ([CNCF blog](https://www.cncf.io/blog/2026/03/26/announcing-kubescape-4-0-enterprise-stability-meets-the-ai-era/)). The stated direction in the 4.0 announcement is runtime security and scanning for AI-era workloads alongside the existing posture and vulnerability scanning ([CNCF blog](https://www.cncf.io/blog/2026/03/26/announcing-kubescape-4-0-enterprise-stability-meets-the-ai-era/), [InfoQ](https://www.infoq.com/news/2026/03/kubescape-40/)).
