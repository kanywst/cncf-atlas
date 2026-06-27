# History

## Origin

Armada was started at G-Research, a quantitative research firm that needed to run very large batch workloads (machine learning, AI, and data analysis) on Kubernetes across tens of thousands of nodes. Plain Kubernetes hit two walls: a single cluster does not scale past a certain size, and the in-cluster etcd store does not sustain the throughput a batch queue of millions of jobs needs (README:20-21). The repository was created on 2019-06-19 (GitHub REST API).

The project was introduced publicly in the CNCF blog post "Armada - how to run millions of batch jobs over thousands of compute nodes using Kubernetes" on 2021-01-25.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Repository created at G-Research (2019-06-19, GitHub REST API). |
| 2021 | Public introduction via the CNCF blog (2021-01-25). |
| 2022 | Accepted into the CNCF as a Sandbox project (2022-07-25, CNCF project page). |
| 2026 | Active releases; v0.21.6 published 2026-06-26 (GitHub REST API). |

## How it evolved

When Armada joined the CNCF, the source moved from the `G-Research` GitHub organisation to a dedicated `armadaproject` organisation. The redirect from the old path still resolves to `armadaproject/armada`.

The internal design settled on event sourcing over Apache Pulsar: the message log is the source of truth, and each subsystem rebuilds its state by replaying the log (`docs/system_overview.md:62-70`). The submit path reflects this; a job submission does not write to a database directly, it publishes events to Pulsar and the scheduler picks them up later (`internal/server/submit/submit.go:141`). The scheduler keeps an in-memory, transactional copy of all jobs (`JobDb`) so its scheduling hot loop is decoupled from PostgreSQL I/O (`internal/scheduler/jobdb/jobdb.go:68`).

## Where it stands now

Armada is an actively maintained CNCF Sandbox project (accepted 2022-07-25, CNCF project page). Releases are frequent: the documented commit `85b582d` sits just after tag v0.21.5 (released 2026-06-17), and v0.21.6 followed on 2026-06-26 (GitHub REST API). It is built in Go (`go.mod` declares `go 1.26.1`) with a `mage`-based build system under `magefiles/`. The stated direction remains high-throughput, multi-cluster batch scheduling, with G-Research running it in production (ADOPTERS.md:9).
