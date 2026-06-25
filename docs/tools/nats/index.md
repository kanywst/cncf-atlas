# NATS

> A high-performance messaging system that ships as a single Go binary and adds optional JetStream persistence on top of a fire-and-forget core.

- **Category**: Messaging & Streaming
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [nats-io/nats-server](https://github.com/nats-io/nats-server)
- **Documented at commit**: `bd058fac` (default branch HEAD, source VERSION `2.15.0-dev`, nearest release `v2.14.2`)

## What it is

NATS is a publish/subscribe messaging system. Producers send messages to a subject (a dotted string like `orders.eu.new`), and the server routes each message to every subscriber whose interest matches that subject. Matching uses a subject token tree with wildcards, so subscribers express interest in patterns such as `orders.*.new` or `orders.>`.

The core protocol is at-most-once. The server holds nothing on disk, and a message with no current subscriber is dropped. On top of this core, JetStream adds persistence, replay, at-least-once delivery, key/value buckets, and object storage. JetStream stores data in its own append-only file format and replicates across a cluster with Raft, so it needs no external database.

A single `nats-server` binary covers the full range of deployment shapes: a standalone process, a clustered set of routed servers, a super-cluster of gateways across regions, and leaf nodes that extend a cluster out to the edge. The same connection-handling code serves all of these by tagging each connection with a `kind` ([`server/client.go:259`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L259)).

## When to use it

- You want low tail latency for request/reply and pub/sub between services, with one binary and no external dependencies.
- You run across regions or out to edge devices and want a built-in topology (gateways, leaf nodes) rather than bolting one on.
- You need at-least-once delivery, replay, or a key/value store, and want it from the same system through JetStream.
- It is a weaker fit when you need Kafka-style partition and offset semantics as a first-class model. Strict per-key ordering combined with horizontal scale means building subject-based partitioning yourself.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [nats-io/nats-server (GitHub)](https://github.com/nats-io/nats-server)
2. [nats-io organization (GitHub)](https://github.com/nats-io)
3. [NATS project page (CNCF)](https://www.cncf.io/projects/nats/)
4. [NATS Graduation Application (cncf/toc#2042)](https://github.com/cncf/toc/issues/2042)
5. [CNCF and Synadia Align on Securing NATS.io](https://www.cncf.io/announcements/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project/)
6. [Protecting NATS and the integrity of open source (CNCF)](https://www.cncf.io/blog/2025/05/01/protecting-nats-and-the-integrity-of-open-source-cncfs-commitment-to-the-community/)
7. [RedMonk Conversation with Derek Collison](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/)
8. [NATS Messaging (Wikipedia)](https://en.wikipedia.org/wiki/NATS_Messaging)
9. [JetStream (NATS Docs)](https://docs.nats.io/nats-concepts/jetstream)
10. [Consumers (NATS Docs)](https://docs.nats.io/nats-concepts/jetstream/consumers)
11. [NATS.io About](https://nats.io/about/)
12. [Synadia tries to claw NATS back (The Stack)](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/)
13. [Benchmarking Message Queue Latency (Brave New Geek)](https://bravenewgeek.com/benchmarking-message-queue-latency/)
14. [Message Brokers Comparison 2026 (dev.to)](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8)
15. [Kafka vs RabbitMQ vs NATS vs SQS (BackendBytes)](https://backendbytes.com/articles/message-queue-comparison/)
