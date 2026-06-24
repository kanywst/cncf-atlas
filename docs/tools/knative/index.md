# Knative

> Knative runs containers as request-driven serverless workloads on Kubernetes, including scale to zero.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [knative/serving](https://github.com/knative/serving)
- **Documented at commit**: `6fb71ff` (46 commits after tag `knative-v1.22.0`, committer date 2026-06-19)

## What it is

Knative is a set of Kubernetes controllers that turn a plain container image into a request-driven service. You hand it an image and a concurrency target; it manages the Deployment, scales the replica count up and down with load, and scales all the way to zero when no traffic arrives. The core implementation lives in `knative/serving`, which is the focus of this deep-dive. A separate repository, `knative/eventing`, handles event delivery and is out of scope here.

Serving splits into a control plane of reconcilers (`cmd/controller/main.go:56`) and a data plane built from two components: the activator, which buffers requests while a scaled-to-zero Revision starts, and the queue-proxy sidecar, which measures live concurrency on each user Pod. The autoscaler (the Knative Pod Autoscaler, or KPA) consumes those measurements and decides the replica count.

The user-facing API is four custom resources. A `Service` is the top-level object that ties together a `Configuration` and a `Route` (`pkg/apis/serving/v1/service_types.go:42`). Each change to a Configuration produces an immutable `Revision`, and the Route splits traffic across Revisions by percentage.

## When to use it

- You want HTTP or gRPC workloads that scale to zero when idle and back up on demand, without writing your own autoscaling glue.
- You want percentage-based traffic splitting and per-Revision rollback as a built-in primitive rather than a CI script.
- Your scaling signal is request concurrency or requests per second, the kind of live load signal Knative measures directly.
- It is a weaker fit when your scaling signal is queue depth or an external event source; KEDA targets that case more directly.
- It is overkill for a long-lived service that always runs at a fixed replica count and never scales to zero.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [knative/serving](https://github.com/knative/serving) (source, README, LICENSE, go.mod), read at commit `6fb71ff`.
2. [knative/community ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD).
3. [Knative project page (CNCF)](https://www.cncf.io/projects/knative/).
4. [CNCF Announces Knative's Graduation (2025-10-08)](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/).
5. [Knative accepted as a CNCF incubating project (2022-03-02)](https://www.cncf.io/blog/2022/03/02/knative-accepted-as-a-cncf-incubating-project/).
6. [Knative Has Finally Graduated From the CNCF (The New Stack)](https://thenewstack.io/knative-has-finally-graduated-from-the-cncf/).
7. [cncf/toc #1868 Knative Incubating to Graduating checklist](https://github.com/cncf/toc/issues/1868).
8. [KEDA vs Knative vs Kubernetes HPA (ThinhDA)](https://thinhdanggroup.github.io/keda-knative-kubenetes/).
9. [Serverless Open-Source Frameworks (CNCF)](https://www.cncf.io/blog/2020/04/13/serverless-open-source-frameworks-openfaas-knative-more/).
10. [Knative documentation](https://knative.dev/docs/).
11. [GitHub REST API repos/knative/serving](https://api.github.com/repos/knative/serving).
