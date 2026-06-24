# Adoption & Ecosystem

## Who uses it

The adopters below are the ones the CNCF Graduation announcement names explicitly (source 3). They split into commercial products and services that expose CloudEvents and CNCF projects that build on it.

| Organisation | Use case | Source |
| --- | --- | --- |
| Adobe | Adobe I/O Events uses the CloudEvents format | [CNCF graduation announcement](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| Alibaba Cloud | EventBridge speaks CloudEvents | [CNCF graduation announcement](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| Microsoft | Azure Event Grid supports the CloudEvents v1.0 JSON schema and HTTP binding | [Azure Event Grid schema](https://learn.microsoft.com/en-us/azure/event-grid/cloud-event-schema) |
| European Commission | Named as a CloudEvents adopter | [CNCF graduation announcement](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| Google Cloud | Eventarc delivers events in the CloudEvents format | [CNCF graduation announcement](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| IBM Cloud | Code Engine uses CloudEvents | [CNCF graduation announcement](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| Knative | Eventing sends and receives events as CloudEvents over HTTP POST | [Knative Eventing docs](https://knative.dev/docs/eventing/) |
| Argo, Falco, Harbor, Serverless Workflow | CNCF projects named as CloudEvents adopters | [CNCF graduation announcement](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |

## Adoption signals

The CloudEvents specification repository had 5,799 stars and 613 forks (GitHub, 2026-06-22) (sources 2, 13). The Graduation announcement reports the spec drew 340+ contributors from 122 organizations (source 3).

For the implementation read here, `cloudevents/sdk-go` had 956 stars, 246 forks, and 138 open issues (GitHub, 2026-06-22), with roughly 122 contributors (sources 1, 13). It is the most adopted of the official SDKs, ahead of sdk-java (about 360), sdk-javascript (about 399), and sdk-csharp (about 332) (sources 1, 13). The latest SDK release tag is `v2.16.2` (2025-09-22) (source 1).

## Ecosystem

- **Official SDKs**: Go, JavaScript/TypeScript, Java, C#, Python, Ruby, PHP, PowerShell, and Rust (sources 1, 5).
- **Protocol bindings in sdk-go**: HTTP, Kafka (sarama and confluent), MQTT, AMQP, NATS, NATS JetStream, GCP Pub/Sub, STAN, and an in-process gochan transport, found under `v2/protocol/` and `samples/` (source 1).
- **CloudEvents SQL (CESQL)**: a SQL-like language for filtering and querying events, implemented in the SDK under `sql/` (source 2).
- **Managed services**: Azure Event Grid, Google Cloud Eventarc, Alibaba Cloud EventBridge, and IBM Cloud Code Engine all expose CloudEvents as described above (sources 3, 8).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| AsyncAPI | Describes the contract and documentation of event-driven APIs and channels. CloudEvents standardizes the payload-agnostic envelope and protocol bindings instead, so the two compose: a CloudEvents envelope inside an AsyncAPI-described channel (source 12) |
| Cloud-native event schemas (for example AWS EventBridge's native format) | Provider-specific shapes. CloudEvents is the neutral format for portability, and providers commonly add a CloudEvents mode alongside their native one (source 8) |
| Plain JSON / Avro / Protobuf with no standard envelope | No agreed attribute names or transport bindings. CloudEvents unifies attribute naming and the mapping onto HTTP, Kafka, and others, which is the real difference (sources 6, 7) |
