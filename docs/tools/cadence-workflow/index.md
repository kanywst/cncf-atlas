# Cadence Workflow

> A fault-tolerant, code-first orchestration engine that runs long-lived workflows and resumes them from event history after any crash.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [cadence-workflow/cadence](https://github.com/cadence-workflow/cadence)
- **Documented at commit**: `66dcbaf` (2026-06-25, near tag `v1.4.1-prerelease31`)

## What it is

Cadence is a backend platform for durable execution (DE), the property that a program keeps running correctly even when the process or machine running it dies. You write a workflow as ordinary code in Go or Java. Cadence persists every step the code takes as an append-only event history, so if a worker crashes the workflow is replayed from that history on another worker and continues from where it left off. The user code never has to checkpoint its own state.

The repository here is the server side: a cluster of four services (frontend, history, matching, worker) plus a CLI and schema tooling. Workflow and activity code runs in your own processes using a client SDK, separate from the server (`README.md:13-15`). The server stores state in Cassandra, MySQL, or PostgreSQL, and can use Elasticsearch or OpenSearch for visibility queries and Kafka for asynchronous workflows.

Cadence started inside Uber, was open-sourced in 2017 (`README.md:8`), and was accepted into the CNCF Sandbox on 2025-05-22. Its design descends from AWS Simple Workflow Service and the Azure Durable Task Framework, rebuilt as a self-hosted system.

## When to use it

- You have a multi-step process that must survive process restarts and run for minutes, days, or months (order fulfillment, infrastructure rollout, machine-learning training pipelines).
- You want to express control flow (loops, branches, long sleeps, waiting for an external signal) as normal code rather than a static directed acyclic graph (DAG) or JSON DSL.
- You need automatic activity retries and at-most-once side-effect handling managed by the platform.
- It is a poor fit for short stateless request/response work where a queue or a plain remote procedure call (RPC) is enough.
- It is a poor fit for fixed data-pipeline DAGs on a schedule, where Airflow or Argo Workflows are a closer match.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cadence-workflow/cadence repository](https://github.com/cadence-workflow/cadence), read at commit `66dcbaf`.
2. [CNCF project page: Cadence Workflow](https://www.cncf.io/projects/cadence-workflow/).
3. [Uber Blog: Cadence Workflow Joins the CNCF](https://www.uber.com/us/en/blog/cadence-workflow-joins-the-cloud-native-computing-foundation/).
4. [cadenceworkflow.io: Cadence Joins CNCF](https://cadenceworkflow.io/blog/2025/10/06/cadence-joins-cncf-cloud-native-computing-foundation).
5. [ia40: Temporal Founders Samar Abbas and Maxim Fateev](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev).
6. [Amplify Partners: Our Investment in Temporal](https://www.amplifypartners.com/blog-posts/our-investment-in-temporal).
7. [Instaclustr: Uber donates Cadence Workflow to CNCF](https://www.instaclustr.com/blog/cadence-workflow-uber-cncf-projects/).
8. [Cadence vs Temporal FAQ](https://cadenceworkflow.io/faq/cadence-vs-temporal).
9. [cncf/sandbox issue #368: Cadence](https://github.com/cncf/sandbox/issues/368).
10. [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md).
11. [cadence-go-client (official Go SDK)](https://github.com/cadence-workflow/cadence-go-client).
12. [cadence-web (UI)](https://github.com/cadence-workflow/cadence-web).
