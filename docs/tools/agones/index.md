# Agones

> Host, run, and scale dedicated multiplayer game servers on Kubernetes using custom resources and controllers.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Sandbox
- **Language**: Go (`go.mod:3`, `go 1.26`)
- **License**: Apache-2.0 (`LICENSE:1`)
- **Repository**: [agones-dev/agones](https://github.com/agones-dev/agones)
- **Documented at commit**: `19f82f4f` (next `1.59.0-dev` line, 2026-06-25)

## What it is

Agones is a Kubernetes extension for running dedicated game servers. A dedicated game server is the authoritative server process that hosts one match or session for connected players. Agones defines a set of Custom Resource Definitions (CRDs), the central one being `GameServer`, and a set of controllers that turn those resources into running game server Pods. A game server becomes a regular Kubernetes object that you create, watch, and delete with `kubectl`.

Each game server runs inside its own Pod with an Agones sidecar container next to the game binary. The game binary talks only to that local sidecar over gRPC (Google's Remote Procedure Call framework) through a Software Development Kit (SDK). The sidecar updates the Kubernetes resource on the binary's behalf, so game code never speaks to the Kubernetes Application Programming Interface (API) directly. Higher-level resources (`Fleet`, `GameServerSet`, `FleetAutoscaler`, `GameServerAllocation`) build group management, rollout, autoscaling, and allocation on top of single game servers.

It is for studios that already run, or are willing to run, Kubernetes and want one declarative control plane for fleets of game servers instead of a bespoke, cloud-locked scaling system. Agones started as a joint project between Google and Ubisoft to replace exactly that kind of in-house tooling.

## When to use it

- You run multiplayer games that need stateful, session-based dedicated servers and want to schedule and scale them with standard Kubernetes tooling.
- You want to avoid vendor lock-in: Agones is open source and runs on any conformant cluster (GKE, EKS, AKS, or on-prem).
- You pair a matchmaker (for example Open Match) with allocation: the matchmaker claims a ready server through a CRD or gRPC call and hands its address to players.
- It is a weaker fit when you do not run Kubernetes and only need a handful of servers; a managed offering may be less operational overhead.
- It is a weaker fit for stateless HTTP backends that an ordinary `Deployment` plus `Service` already covers.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [agones-dev/agones repository](https://github.com/agones-dev/agones) (commit `19f82f4f`)
2. [CNCF: Agones Moves to the CNCF](https://www.cncf.io/blog/2026/03/23/agones-moves-to-the-cncf-a-new-era-for-open-source-multiplayer-game-infrastructure/)
3. [CNCF projects: Agones](https://www.cncf.io/projects/agones/)
4. [Google Cloud: Introducing Agones](https://cloud.google.com/blog/products/containers-kubernetes/introducing-agones-open-source-multiplayer-dedicated-game-server-hosting-built-on-kubernetes)
5. [Agones documentation site](https://agones.dev/site/)
6. [issue #4421: Moving Agones to CNCF](https://github.com/agones-dev/agones/issues/4421)
