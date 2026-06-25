# Adoption & Ecosystem

## Who uses it

The NATS graduation application states that the nats.io adopters list and CNCF case studies name 2,000+ organizations ([cncf/toc#2042](https://github.com/cncf/toc/issues/2042)). The named examples below come from cited sources.

| Organisation | Use case | Source |
| --- | --- | --- |
| AT&T | Microservices and event streaming | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| Capital One | Microservices and event streaming | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| Tinder | Messaging between services | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| Walmart | Event streaming | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| Volvo | IoT and connected-vehicle messaging | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| DeFacto | Event-driven architecture | [cncf/toc#2042](https://github.com/cncf/toc/issues/2042) |
| Finleap Connect | Regulated fintech messaging with mTLS | [cncf/toc#2042](https://github.com/cncf/toc/issues/2042) |

## Adoption signals

As observed on 2026-06-24, `nats-io/nats-server` had 20,083 stars, 1,846 forks, and 508 open issues (GitHub API). The repository was created on 2012-10-29. GitHub GraphQL reported around 190 mentionable users. The graduation application cited 169+ contributors, 18.3k+ stars, and 11k+ Slack members at the time of filing ([cncf/toc#2042](https://github.com/cncf/toc/issues/2042)). The latest release is `v2.14.2` (2026-06-02).

## Ecosystem

NATS clients exist for 40+ languages as separate repositories under the `nats-io` organization, including `nats.go`, `nats.js`, `nats.rs`, `nats.net`, and `nats.java` ([nats.io about](https://nats.io/about/)). The ecosystem also includes the `nats` CLI, JetStream key/value and object stores, leaf-node edge connectivity, MQTT and WebSocket support, and a Helm chart and controller for Kubernetes ([nats.io about](https://nats.io/about/)).

## Alternatives

NATS ships as a single binary with no external dependencies, uses subject-based routing, and keeps tail latency tight ([Brave New Geek benchmark](https://bravenewgeek.com/benchmarking-message-queue-latency/)). Core NATS is at-most-once; JetStream adds at-least-once and exactly-once delivery plus key/value and object store. It does not map cleanly onto Kafka's partition-centric model, so strict per-key ordering with horizontal scale means building subject-based partitioning yourself ([dev.to comparison](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8)).

| Alternative | Differs by |
| --- | --- |
| Apache Kafka | Partitions and offsets are first-class, with very high throughput and strong replay, at the cost of heavier operations ([dev.to comparison](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8)) |
| RabbitMQ | AMQP with rich broker-side routing; lower throughput in the tens of thousands of messages per second range ([BackendBytes](https://backendbytes.com/articles/message-queue-comparison/)) |
| Redis Pub/Sub | In-memory and sub-millisecond, but no persistence ([dev.to comparison](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8)) |
