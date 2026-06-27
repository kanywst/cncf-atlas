# Adoption & Ecosystem

## Who uses it

The project's `ADOPTERS.md` lists one organisation publicly: G-Research, the company that started Armada. No other organisations are listed there, so only this one is cited below.

| Organisation | Use case | Source |
| --- | --- | --- |
| G-Research | Runs Armada in production to process millions of jobs daily across tens of thousands of nodes | [ADOPTERS.md](https://github.com/armadaproject/armada/blob/master/ADOPTERS.md) |

If you adopt Armada and want to be listed, the ADOPTERS file invites a pull request (ADOPTERS.md:5). Beyond G-Research, there is no public, citable adopter list, so the GitHub signals below are the available evidence of usage.

## Adoption signals

Measured from the GitHub REST API on 2026-06-26:

- Stars: 602
- Forks: 166
- Open issues: 109
- Contributors: roughly 102 (contributors API last page)
- Repository created: 2019-06-19; last push: 2026-06-26
- Latest release: v0.21.6 (2026-06-26)

Armada is a CNCF Sandbox project, accepted on 2022-07-25 (CNCF project page). Releases are frequent, which is itself a signal of active maintenance.

## Ecosystem

- Apache Pulsar is a required dependency; it is the event log that routes all messages between subsystems (`docs/system_overview.md:62`).
- PostgreSQL backs the scheduler and Lookout; Redis is part of the local development stack (README:81).
- Prometheus integration exposes analytics on system behaviour and resource allocation (README:30).
- An Airflow operator integrates Armada into Airflow workflows (`docs/armada_airflow_operator.md`).
- Client libraries exist for Python, Java, and .NET (`docs/client_libraries.md`).
- The Armada Operator is the recommended install path for Kubernetes (README:47-50).

## Alternatives

Armada is a multi-cluster, out-of-cluster meta-scheduler. Most alternatives schedule within a single cluster, which is the main distinction.

| Alternative | Differs by |
| --- | --- |
| Volcano (CNCF Incubating) | In-cluster batch scheduler for one Kubernetes cluster; Armada queues and schedules across many clusters from outside them. |
| Kueue (Kubernetes SIG) | In-cluster job queueing; single-cluster focus rather than Armada's cross-cluster queues. |
| Apache YuniKorn | Batch and data scheduler for Kubernetes, still oriented to in-cluster scheduling. |
| Karmada / Open Cluster Management | Multi-cluster, but for general workload federation rather than high-throughput batch queueing. |

Pick Armada when batch scale exceeds a single cluster and you need queues of millions of jobs without overloading etcd (README:21). Pick an in-cluster scheduler when one cluster covers your scale and you want a simpler deployment.
