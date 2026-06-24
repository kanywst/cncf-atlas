# CloudEvents

> A vendor-neutral specification for describing event data in a common way, with SDKs that carry those events across HTTP, Kafka, MQTT, and other transports.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Graduated
- **Language**: Go (this deep-dive reads the `sdk-go` implementation)
- **License**: Apache-2.0
- **Repository**: [cloudevents/sdk-go](https://github.com/cloudevents/sdk-go)
- **Documented at commit**: `1e99396` (2026-06-19)

## What it is

CloudEvents is a specification that defines a common envelope for event data. Instead of every platform inventing its own event shape, CloudEvents fixes a small set of context attributes (`id`, `source`, `type`, `specversion`, and a handful of optional ones) and defines how those attributes map onto concrete transports such as HTTP, Kafka, MQTT, and AMQP. The payload itself stays opaque, so an event can carry JSON, Avro, Protobuf, or raw bytes without the envelope caring.

The specification lives in `cloudevents/spec`, which is mostly prose and conformance material. The runnable part is the set of language SDKs. This deep-dive follows the Go SDK, `cloudevents/sdk-go`, because it is the most adopted implementation and because its code shows how the abstract spec turns into wire bytes. The SDK splits into a canonical `event.Event` model, a protocol-independent `binding` layer, and per-transport `protocol` packages.

It sits at the integration seam between event producers and consumers. A FaaS platform, an eventing broker, or an application that wants portable events uses CloudEvents so that a consumer written against the standard does not need to know which producer or transport emitted the event.

## When to use it

- You move events between systems owned by different teams or vendors and want one envelope format instead of many bespoke ones.
- You bridge events across transports (for example HTTP to Kafka) and want the metadata to survive the hop.
- You build on an eventing platform such as Knative Eventing or a cloud event bus that already speaks CloudEvents.
- You want to filter or route on event metadata without parsing the payload.

It is a weaker fit when events never leave a single closed system with one transport, where a bespoke struct is simpler. It is also the wrong layer when you need a full API contract with schema negotiation rather than an envelope (a tool like AsyncAPI targets that).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how an event flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cloudevents/sdk-go](https://github.com/cloudevents/sdk-go) (Go SDK, the implementation read here), accessed 2026-06-22.
2. [cloudevents/spec](https://github.com/cloudevents/spec) (specification repository), accessed 2026-06-22.
3. [CNCF Announces the Graduation of CloudEvents (2024-01-25)](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/), accessed 2026-06-22.
4. [Serverless specification CloudEvents reaches Version 1.0 (2019-10-28)](https://www.cncf.io/announcements/2019/10/28/serverless-specification-cloudevents-reaches-version-1-0/), accessed 2026-06-22.
5. [CloudEvents website](https://cloudevents.io/), accessed 2026-06-22.
6. [CloudEvents Primer](https://github.com/cloudevents/spec/blob/main/cloudevents/primer.md), accessed 2026-06-22.
7. [CloudEvents Core Specification](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md), accessed 2026-06-22.
8. [Azure Event Grid CloudEvents v1.0 schema](https://learn.microsoft.com/en-us/azure/event-grid/cloud-event-schema), accessed 2026-06-22.
9. [Microsoft Open Source: CloudEvents v1.0 support on Azure Event Grid (2019-11-21)](https://opensource.microsoft.com/blog/2019/11/21/boosting-cloud-interoperability-cloudevents-v1-0-support-azure-event-grid/), accessed 2026-06-22.
10. [Knative Eventing overview](https://knative.dev/docs/eventing/), accessed 2026-06-22.
11. [pkg.go.dev: sdk-go/v2](https://pkg.go.dev/github.com/cloudevents/sdk-go/v2), accessed 2026-06-22.
12. [AsyncAPI](https://www.asyncapi.com/), accessed 2026-06-22.
