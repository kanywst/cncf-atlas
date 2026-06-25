# Getting Started

> Verified against `v2.14.2`. Commands assume a Unix shell with Go 1.25+ or Docker, plus the `nats` CLI.

## Prerequisites

- Go 1.25 or newer to build from source, or Docker to run the published image.
- The `nats` CLI for publishing and subscribing from the command line.

## Install

```bash
go install github.com/nats-io/nats-server/v2@latest
```

You can instead download an official release binary, or run the published image:

```bash
docker run -p 4222:4222 nats
```

## A first working setup

The shortest path to a running server and a delivered message. The default client port is 4222, and the monitoring HTTP endpoint is enabled with `-m 8222` ([nats.io about](https://nats.io/about/)).

1. Start the server with JetStream enabled and monitoring on.

   ```bash
   nats-server -js -m 8222
   ```

1. In a second terminal, subscribe to a subject.

   ```bash
   nats sub foo
   ```

1. In a third terminal, publish a message to that subject.

   ```bash
   nats pub foo hello
   ```

The subscriber prints the received message on `foo`.

## Verify it works

Check the monitoring endpoint for server health and connection counts:

```bash
curl http://localhost:8222/varz
```

The `nats sub foo` terminal should also show the `hello` payload it received, which confirms end-to-end delivery.

## Where to go next

For durability, replay, key/value, and object storage, read the [JetStream docs](https://docs.nats.io/nats-concepts/jetstream) and [Consumers](https://docs.nats.io/nats-concepts/jetstream/consumers). For clustering, gateways, leaf nodes, and security hardening, see the official documentation rather than re-deriving it here ([nats.io about](https://nats.io/about/)).
