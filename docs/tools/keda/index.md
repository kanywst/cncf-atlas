# KEDA

> KEDA feeds any external event source into the Kubernetes Horizontal Pod Autoscaler and lets workloads scale all the way down to zero.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [kedacore/keda](https://github.com/kedacore/keda)
- **Documented at commit**: `c5b577c` (2026-06-19, on `main` ahead of `v2.20.1`)

## What it is

KEDA (Kubernetes-based Event Driven Autoscaling) is a single-purpose autoscaler. The native Horizontal Pod Autoscaler (HPA) scales on CPU and memory, and it cannot reduce a workload below one replica. KEDA fills both gaps. It reads metrics from external systems such as queues, streams, and databases, exposes them to the HPA through the Kubernetes External Metrics API, and handles the 0-to-1 transition the HPA cannot do itself.

You declare a `ScaledObject` (or `ScaledJob`) that points at a workload and lists triggers. Each trigger names a scaler type such as `apache-kafka` or `aws-sqs-queue` plus its metadata. KEDA builds those scalers, polls them, and creates an HPA on your behalf. The HPA still owns the 1-to-N scaling decision; KEDA owns the event plumbing and the scale-to-zero behaviour.

KEDA installs as two workloads plus an admission webhook in a cluster. It does not replace the HPA, the Cluster Autoscaler, or a service mesh. It sits between your event sources and the HPA.

## When to use it

- A workload's load is driven by queue depth, stream lag, or another external signal rather than CPU.
- You want idle workloads to scale to zero and wake on the first event.
- You consume from one of the 70+ built-in sources (Kafka, RabbitMQ, NATS, Prometheus, AWS SQS/Kinesis/CloudWatch, Azure Service Bus/Event Hub, GCP Pub/Sub, and more) and prefer not to run a per-source metrics adapter.
- You run event-driven batch work and want the job count tied to a backlog (`ScaledJob`).

When it is not the right tool: pure CPU/memory scaling needs only the native HPA, and node-level scaling is the job of the Cluster Autoscaler or Karpenter. KEDA scales pods, not nodes.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [kedacore/keda repository and README](https://github.com/kedacore/keda)
2. [kedacore/keda at commit c5b577c](https://github.com/kedacore/keda/commit/c5b577cd882d7a4572787e48868ed6a82da91369)
3. [KEDA v2.20.1 release](https://github.com/kedacore/keda/releases/tag/v2.20.1)
4. [CNCF: KEDA graduation announcement](https://www.cncf.io/announcements/2023/08/22/cloud-native-computing-foundation-announces-graduation-of-kubernetes-autoscaler-keda/)
5. [CNCF Projects: KEDA](https://www.cncf.io/projects/keda/)
6. [KEDA blog: graduating to CNCF Graduated project](https://keda.sh/blog/2023-08-22-keda-cncf-graduation/)
7. [keda.sh deploy docs](https://keda.sh/docs/latest/deploy/)
8. [kedacore/http-add-on](https://github.com/kedacore/http-add-on)
9. [openshift/kedacore-keda](https://github.com/openshift/kedacore-keda)
