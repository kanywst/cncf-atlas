# Drasi

> Drasi watches data sources for changes, evaluates a standing Cypher query against every change, and fires reactions when the query result set moves, without copying the data into a central store or polling it on a timer.

- **Category**: Messaging & Streaming
- **CNCF maturity**: Sandbox (accepted 2025-01-21)
- **Language**: Rust core (engine, control plane, sources) with a Go CLI and a multi-language SDK layer
- **License**: Apache-2.0
- **Repository**: [drasi-project/drasi-platform](https://github.com/drasi-project/drasi-platform)
- **Documented at commit**: `62b10c7` (18 commits past tag `0.10.0`)

## What it is

Drasi is a change data processing platform that runs on Kubernetes. It is built from three user-facing concepts. A **Source** connects to an external system such as a relational database or a message broker, watches its change feed, and turns every change into an internal Drasi event. A **Continuous Query** is a query written in Cypher that stays live: instead of returning a result once, it maintains a result set that Drasi keeps up to date as changes arrive. A **Reaction** subscribes to a continuous query and acts when the result set gains, updates, or loses a row.

The problem Drasi targets is the recurring one where a change in one system should trigger work somewhere else, and the data needed to decide is spread across systems that do not share a database. The usual answer is to copy everything into a central store and poll it, or to hand-write integration code for each pair of systems. Drasi instead evaluates the condition where the data lives, expressed as one graph query that can join across sources, and only re-computes the parts of the result that a change actually touched.

Drasi comes from Microsoft's Azure Incubations team, the same group behind Dapr, KEDA, Radius, and Copacetic. It leans on Dapr for its internal messaging and actor model, and it uses Debezium inside its relational source to read database change logs. The core engine and control plane are written in Rust; the `drasi` command-line tool is written in Go; and the Source and Reaction SDKs are offered in several languages so that integrations can be written in .NET, Java, Python, JavaScript, or Rust.

## When to use it

- You need to react to a condition that spans several systems (a database, a queue, a Kubernetes resource) and you do not want to copy all of that data into one place first.
- The condition is naturally a graph or relational join (match a pattern across entities from different sources) and you want to express it declaratively rather than as polling code.
- You already run Kubernetes and can run Dapr, since Drasi's components are deployed there and depend on Dapr for messaging and state.
- Not the right fit if a single database already holds all the data and a materialized view or a database trigger covers the need, because Drasi's cross-source model would add operational weight for no gain.
- Not a general stream-processing engine: it offers the fixed Source/Continuous Query/Reaction shape, so an arbitrary dataflow topology is better served by a lower-level engine.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a change flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [drasi-project/drasi-platform (GitHub, repository and API)](https://github.com/drasi-project/drasi-platform) (accessed 2026-07-08)
2. [Drasi project page (CNCF)](https://www.cncf.io/projects/drasi/) (accessed 2026-07-08)
3. [Introducing Drasi: Microsoft's new change data processing system (Azure Blog, Mark Russinovich)](https://azure.microsoft.com/en-us/blog/drasi-microsofts-newest-open-source-project-simplifies-change-detection-and-reaction-in-complex-systems/) (accessed 2026-07-08)
4. [Drasi accepted into CNCF sandbox for change-driven solutions (Microsoft Open Source Blog)](https://opensource.microsoft.com/blog/2025/06/10/drasi-accepted-into-cncf-sandbox-for-change-driven-solutions/) (accessed 2026-07-08)
5. [Drasi documentation (drasi.io)](https://drasi.io/) (accessed 2026-07-08)
6. [\[Sandbox\] Drasi, cncf/sandbox Issue #296](https://github.com/cncf/sandbox/issues/296) (accessed 2026-07-08)
7. [Exploring Cloud Native projects in CNCF Sandbox, Part 5: January 2025 (Palark)](https://palark.com/blog/cncf-sandbox-2025-jan/) (accessed 2026-07-08)
8. [Continuous Queries (Drasi Docs)](https://drasi.io/concepts/continuous-queries/) (accessed 2026-07-08)
9. [Reactions (Drasi Docs)](https://drasi.io/concepts/reactions/) (accessed 2026-07-08)
10. [Netstar (CNCF Case Study)](https://www.cncf.io/case-studies/netstar/) (accessed 2026-07-08)
11. [How Netstar Streamlined Fleet Monitoring and Reduced Custom Integrations with Drasi (Microsoft Community Hub)](https://techcommunity.microsoft.com/blog/linuxandopensourceblog/how-netstar-streamlined-fleet-monitoring-and-reduced-custom-integrations-with-dr/4499592) (accessed 2026-07-08)
