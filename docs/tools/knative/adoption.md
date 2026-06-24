# Adoption & Ecosystem

## Who uses it

The organisations below are listed in the project's [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD); the cloud providers and a few others are also named in the [CNCF graduation announcement](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/).

| Organisation | Use case | Source |
| --- | --- | --- |
| Alibaba Cloud | Cloud platform | [CNCF announcement](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/) |
| Scaleway | Cloud services | [CNCF announcement](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/) |
| Gojek | CaraML MLOps platform | [CNCF announcement](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/) |
| Red Hat | OpenShift Serverless | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| IBM | Cloud Code Engine | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| Google Cloud | Cloud Run for Anthos | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| VMware | Tanzu Application Platform, Event Broker | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| Bloomberg L.P. | Data science platform | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| Box | Internal serverless PaaS | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| KA-NABELL | E-commerce platform | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| KubeSphere | OpenFunction serving layer | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |

ADOPTERS.MD also lists Cisco, Cloudera, Optum, WP Engine, Sinch, Tata Communications, Telekom Deutschland with SVA, and AI-inference users such as Cerebrium, Run:ai, Runhouse, and deepc.ai.

## Adoption signals

- `knative/serving`: 6,063 stars, 1,227 forks, created 2018-01-24 ([GitHub API](https://api.github.com/repos/knative/serving), observed 2026-06-23).
- Contributor scale is roughly 300 or more, based on the GitHub contributors API paginating to page 336 at one contributor per page including anonymous entries (observed 2026-06-23).
- For comparison, `knative/eventing` had 1,550 stars on the same date; Serving is the repository where stars concentrate.
- CNCF Graduated since 2025-09-11 ([CNCF project page](https://www.cncf.io/projects/knative/)).

## Ecosystem

- Networking layers: Istio, Contour, Kourier, and Gateway API implementations provide ingress.
- cert-manager integrates through the optional `certificate` reconciler (`cmd/controller/main.go:80`).
- OpenTelemetry is the stated direction for metrics and tracing ([CNCF announcement](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/)).
- `knative/eventing` with CloudEvents covers the event-driven axis alongside Serving.
- OpenFunction (KubeSphere) builds a FaaS layer on top of Knative Serving ([ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD)).

## Alternatives

Knative scales on live request concurrency or RPS measured by the queue-proxy, and uses the activator to buffer requests so a Revision can go to and from zero. The alternatives differ mainly in what signal they scale on.

| Alternative | Differs by |
| --- | --- |
| KEDA | Scales on external event sources and queue depth; pairs with the HPA to reach zero ([ThinhDA](https://thinhdanggroup.github.io/keda-knative-kubenetes/)) |
| Kubernetes HPA | Scales on CPU and memory; alone it goes 1 to N, not to zero ([ThinhDA](https://thinhdanggroup.github.io/keda-knative-kubenetes/)) |
| OpenFaaS | RPS-based, adding one instance at a time; lighter-weight FaaS ([CNCF blog](https://www.cncf.io/blog/2020/04/13/serverless-open-source-frameworks-openfaas-knative-more/)) |
| OpenWhisk, Fission, Fn | Adjacent FaaS platforms with their own runtimes ([CNCF blog](https://www.cncf.io/blog/2020/04/13/serverless-open-source-frameworks-openfaas-knative-more/)) |
