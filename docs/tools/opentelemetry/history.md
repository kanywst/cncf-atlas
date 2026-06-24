# History

## Origin

OpenTelemetry began in May 2019 as the merger of two competing observability projects: OpenCensus, started at Google for metrics and tracing, and OpenTracing, a vendor-neutral tracing API with broad language support. The two had split the instrumentation community in half, forcing libraries and vendors to pick a side. The merger, announced jointly by the backing companies, set out to give the ecosystem one standard. ([merger announcement](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/))

Google, Microsoft, Amazon, Splunk, and Datadog were named as backers at the time of the merger, which is part of why the project gained traction quickly. ([merger announcement](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/))

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | OpenCensus and OpenTracing merge into OpenTelemetry; CNCF accepts the project on 2019-05-07 |
| 2021 | Promoted to CNCF Incubating on 2021-08-26 |
| 2026 | Promoted to CNCF Graduated on 2026-05-11, announced 2026-05-21 at the Observability Summit in Minneapolis |

Acceptance, incubation, and graduation dates come from the [CNCF project page](https://www.cncf.io/projects/opentelemetry/) and the [graduation announcement](https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/).

## How it evolved

The project's scope grew one signal at a time. It started with tracing, added metrics, then logs, and most recently profiles, which is still an experimental signal. That experimental status is visible in the Collector code: the pipeline graph handles `xpipeline.SignalProfiles` alongside the stable trace, metric, and log signals (`service/internal/graph/graph.go:333`). ([graduation blog](https://opentelemetry.io/blog/2026/otel-graduates/))

As part of graduation, the project completed a third-party security audit covering the Collector and a governance review. CNCF noted that OpenTelemetry has the second-highest development velocity of any CNCF project, behind Kubernetes. ([graduation announcement](https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/))

## Where it stands now

The Collector ships frequent releases. At the documented commit the stable module set is `v1.60.0` and the beta module set is `v0.154.0` (`versions.yaml:6`, `versions.yaml:33`). The split lets the data model and config packages reach 1.x stability while the service and component machinery iterate under 0.x.

Governance is two-tiered: a Governance Committee owns strategy and operations, and a Technical Committee owns technical direction, with autonomous SIGs underneath. The Governance Committee delegates technical decisions to the Technical Committee and SIGs. ([governance charter](https://github.com/open-telemetry/community/blob/main/governance-charter.md), [technical committee charter](https://github.com/open-telemetry/community/blob/main/tech-committee-charter.md)) Creating a new SIG requires one sponsor from each committee, and all governance documents live in the [open-telemetry/community](https://github.com/open-telemetry/community) repository.
