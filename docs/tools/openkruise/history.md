# History

## Origin

OpenKruise was open-sourced by Alibaba Cloud in June 2019. It packaged workload-automation patterns that Alibaba had built for its own internal platform and large-scale operations, including the Double 11 shopping event, and gave them back to the community as upstream-compatible Kubernetes extensions. The GitHub repository is the canonical upstream; Alibaba's internal downstream adds only integration code on top of the public interfaces, with project material stating that internal-only code is under 5 percent ([Alibaba Cloud blog](https://www.alibabacloud.com/blog/openkruise-the-cloud-native-platform-for-the-comprehensive-process-of-alibabas-double-11_596966)).

The name "Kruise" is a play on "cruise": the "K" stands for Kubernetes, and the whole evokes auto-cruise on top of Kubernetes ([CNCF projects page](https://www.cncf.io/projects/openkruise/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Alibaba Cloud open-sources OpenKruise (June). |
| 2020 | Accepted as a CNCF Sandbox project (2020-11-10). |
| 2021 | OpenKruise v1.0 ships (December), described as reaching new peaks of application automation. |
| 2023 | Promoted to CNCF Incubating by TOC vote (2023-03-02). |
| 2026 | v1.9.0 released (2026-06-21). |

## How it evolved

The project started as a small set of enhanced workload controllers and grew into a broad collection of CRDs and controllers covering workloads, sidecar management, jobs, and node-level operations. The CNCF Sandbox-to-Incubating promotion in March 2023 made it the 36th incubating project, alongside the likes of Backstage, Cilium, Istio, Knative, and OpenTelemetry ([CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/)).

Scope widened over the 1.x line. SidecarSet gained support for native Kubernetes sidecar containers (`initContainers` with `restartPolicy: Always`) in v1.7 ([Alibaba Cloud blog](https://www.alibabacloud.com/blog/openkruise-v1-7-sidecarset-supports-native-kubernetes-sidecar-containers_601775)). In-place update, originally limited to the container image, was extended to cover resource requests via the kubelet resize subresource in the v1.8 line.

## Where it stands now

OpenKruise remains a CNCF Incubating project under active development, with the latest release v1.9.0 on 2026-06-21 ([Releases](https://github.com/openkruise/kruise/releases)). The codebase is Go, built around controller-runtime, with a single repository for the core (`openkruise/kruise`) and separate repositories for adjacent efforts such as kruise-rollouts and OpenKruiseGame. The community lists named adopters and reports continued use at the scale that prompted the project.
