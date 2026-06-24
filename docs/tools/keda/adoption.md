# Adoption & Ecosystem

## Who uses it

The CNCF graduation announcement names these production adopters ([4]). The core repository has no `ADOPTERS.md`; the listed-user roster is maintained on the `keda.sh` site ([1], `README.md:66-68`).

| Organisation | Use case | Source |
| --- | --- | --- |
| FedEx | Production KEDA user named at graduation | [4] |
| Grafana Labs | Production KEDA user named at graduation | [4] |
| KPMG | Production KEDA user named at graduation | [4] |
| Reddit | Production KEDA user named at graduation | [4] |
| Xbox | Production KEDA user named at graduation | [4] |
| Zapier | Production KEDA user named at graduation | [4] |

The same announcement states that 45+ organisations run KEDA in production ([4]).

## Adoption signals

Observed on 2026-06-22 via `gh api repos/kedacore/keda` ([1]):

- GitHub stars: 10,310
- Forks: 1,441
- Contributors: roughly 455

At graduation the project reported 60+ scalers and 9 authentication providers ([4]); the pinned source has roughly 78 cases in the scaler build switch ([2], `pkg/scaling/scalers_builder.go:123`).

## Ecosystem

- **HPA**: native integration through the Kubernetes External Metrics API; KEDA creates and manages the HPA object.
- **Event sources**: 70+ built-in scalers including Prometheus, Kafka, RabbitMQ, NATS, AWS SQS/Kinesis/CloudWatch, Azure Service Bus/Event Hub/Queue, and GCP Pub/Sub ([2], `pkg/scaling/scalers_builder.go:123`).
- **Authentication**: `TriggerAuthentication` with Vault, Azure Key Vault, and Pod Identity ([2], `apis/keda/v1alpha1/triggerauthentication_types.go:75`).
- **HTTP add-on**: `kedacore/http-add-on` extends KEDA to scale HTTP workloads on request volume ([8]).
- **Downstream**: OpenShift ships KEDA as its Custom Metrics Autoscaler in `openshift/kedacore-keda` ([9]).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Native HPA + a metrics adapter (e.g. Prometheus Adapter) | KEDA bundles 70+ scalers and adds scale-to-zero; the bare HPA cannot go below one replica |
| Knative Serving | Strong at HTTP/request-driven scale-to-zero; KEDA covers a broader set of generic event sources |
| Cluster Autoscaler / Karpenter | These scale nodes; KEDA scales pods, so they operate at different layers and are commonly used together |
| Cloud-specific managed autoscalers | KEDA is vendor-neutral across clouds ([4]) |
