# History

## Origin

Knative began at Google in 2018 as a way to run serverless workloads on top of Kubernetes rather than a proprietary platform. IBM, Red Hat, VMware, and SAP joined early ([CNCF graduation announcement](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/); [The New Stack](https://thenewstack.io/knative-has-finally-graduated-from-the-cncf/)). The `knative/serving` repository was created on 2018-01-24 ([GitHub API](https://api.github.com/repos/knative/serving)).

The original project had three pillars: Build, Serving, and Eventing. Build later grew into Tekton and split off, leaving Serving and Eventing as the two cores ([The New Stack](https://thenewstack.io/knative-has-finally-graduated-from-the-cncf/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2018 | Started at Google; Serving repo created 2018-01-24 |
| 2021 | v1.0 released, declared production ready |
| 2022 | Accepted as a CNCF incubating project (2022-03-02) |
| 2025 | Graduated within the CNCF (graduated 2025-09-11, announced 2025-10-08) |

## How it evolved

The scope narrowed over time. Build moved out to become Tekton, and the project settled on Serving (request-driven autoscaling) and Eventing (event delivery) as its two stable surfaces ([The New Stack](https://thenewstack.io/knative-has-finally-graduated-from-the-cncf/)). The v1.0 release in 2021 signaled API stability and a production-ready posture ([CNCF announcement](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/)).

CNCF incubation was accepted on 2022-03-02 ([CNCF blog](https://www.cncf.io/blog/2022/03/02/knative-accepted-as-a-cncf-incubating-project/)). Graduation followed roughly seven years after the project's start, with the TOC review tracked in [cncf/toc #1868](https://github.com/cncf/toc/issues/1868) and the graduation announced on 2025-10-08 ([CNCF announcement](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/)).

## Where it stands now

Knative is a CNCF Graduated project ([CNCF project page](https://www.cncf.io/projects/knative/)). The stated direction at graduation centers on aligning the networking stack with the Kubernetes Gateway API, strengthening safe-by-default container settings, and moving metrics and tracing onto OpenTelemetry ([CNCF announcement](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/)). This deep-dive reads the code at commit `6fb71ff`, which sits 46 commits after tag `knative-v1.22.0` on the `knative/serving` repository.
