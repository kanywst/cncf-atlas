# History

## Origin

Istio started at Google in 2016. Google built it from its own production traffic patterns, combining IBM's open source traffic management work with Lyft's Envoy proxy. Envoy had already been open sourced and Google adopted it for the data plane, where the original plan had leaned toward Nginx ([Tetrate](https://tetrate.io/blog/how-the-istio-service-mesh-became-critical-infrastructure-for-cloud-native-applications)).

In May 2017, Google, IBM, and Lyft published Istio 0.1. It established the sidecar model for service mesh: traffic management, policy, and observability handled by a proxy beside each workload rather than in the application ([Tetrate](https://tetrate.io/blog/how-the-istio-service-mesh-became-critical-infrastructure-for-cloud-native-applications)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Development begins at Google, building on IBM traffic management and Lyft's Envoy |
| 2017 | Istio 0.1 released by Google, IBM, and Lyft |
| 2018 | Istio 1.0 |
| 2022 | Accepted into the CNCF as an Incubating project (Sep 28) |
| 2023 | Graduated from the CNCF (Jul 12) |
| 2025 | Ambient mesh reaches GA |

## How it evolved

Istio was accepted into the CNCF as an Incubating project on 2022-09-28. Google's decision to donate the project came late relative to other foundational projects such as Kubernetes, which drew attention at the time ([CNCF blog](https://www.cncf.io/blog/2022/09/28/istio-sails-into-the-cloud-native-computing-foundation/)).

On 2023-07-12 Istio graduated, joining the top maturity tier alongside Kubernetes, Prometheus, and Linkerd ([CNCF announcement](https://www.cncf.io/announcements/2023/07/12/cloud-native-computing-foundation-reaffirms-istio-maturity-with-project-graduation/); [TechCrunch](https://techcrunch.com/2023/07/12/istio-graduates/)).

The largest architectural shift came after graduation. Starting in 2022, Istio introduced ambient mesh, a sidecarless data plane, and brought it to GA in 2025. Ambient splits the data plane into two layers: a per-node Rust proxy, ztunnel, for L4 mTLS and routing, and an optional per-namespace or per-service waypoint Envoy for L7 ([Istio blog](https://istio.io/latest/blog/2025/ambient-performance/)). The name Istio is Greek for "sail", in keeping with the Kubernetes maritime theme.

## Where it stands now

The project ships on a regular minor cadence. At the documented commit the most recent release tag is 1.30.1, and the `VERSION` file on master reads 1.31, an unreleased development line. The control plane lives in `istio/istio`; the ambient L4 proxy ztunnel is a separate Rust repository, `istio/ztunnel`. The stated direction is ambient as the default-recommended data plane while keeping the sidecar mode supported.
