# Fluentd

> An open source data collector that unifies log collection: it ingests events from many sources, routes them by tag, buffers them, and ships them to many destinations.

- **Category**: Observability
- **CNCF maturity**: Graduated
- **Language**: Ruby (core) with C extensions through dependency gems
- **License**: Apache-2.0
- **Repository**: [fluent/fluentd](https://github.com/fluent/fluentd)
- **Documented at commit**: `729eb32` (2026-06-19, master after v1.19.2)

## What it is

Fluentd is a logging agent that sits between things that produce events and the systems that store or analyze them. Instead of writing one custom shipper per source and destination, you point Fluentd at your inputs, attach a tag to each event, and write routing rules that send tagged events to outputs. It calls this the "Unified Logging Layer" ([source 3](https://www.fluentd.org/architecture/)).

The core is written in Ruby. Performance-sensitive parts lean on C extensions reached through dependency gems such as `msgpack`. Events flow as MessagePack-encoded records carrying a tag, a nanosecond-precision timestamp, and a record body. Buffering, retry with backoff, and routing live in the core, so individual plugins stay small. The project requires Ruby `>= 3.2` (`fluentd.gemspec:28`).

Almost everything beyond the core is a plugin. Inputs, outputs, filters, parsers, formatters, and buffer backends are all pluggable, and the community ships hundreds of them. Fluentd is a CNCF Graduated project ([source 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/)).

## When to use it

- You collect logs from heterogeneous sources and need one place to tag, filter, and fan them out to multiple backends.
- You need reliable delivery with buffering and retry, including file-backed buffers that survive a restart.
- You want a large catalog of ready-made input and output plugins instead of writing integrations yourself.
- You run on Kubernetes and want a vendor-neutral collector with an operator and Helm charts around it.

It is a weaker fit when you need a sub-megabyte memory footprint on every edge node; the Ruby core runs in the tens of megabytes, and the sister project Fluent Bit targets that case ([source 3](https://www.fluentd.org/architecture/)). It is also more than you need if a single source ships straight to a single backend with no routing.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how events flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [fluent/fluentd (GitHub)](https://github.com/fluent/fluentd)
2. [Fluentd LICENSE (Apache-2.0)](https://github.com/fluent/fluentd/blob/master/LICENSE)
3. [What is Fluentd? (architecture)](https://www.fluentd.org/architecture/)
4. [CNCF announces Fluentd graduation (2019-04-11)](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/)
5. [Fluentd (Wikipedia)](https://en.wikipedia.org/wiki/Fluentd)
6. [Logstash, Fluentd, Fluent Bit, or Vector? (CNCF)](https://www.cncf.io/blog/2022/02/10/logstash-fluentd-fluent-bit-or-vector-how-to-choose-the-right-open-source-log-collector/)
7. [Fluentd testimonials](https://www.fluentd.org/testimonials)
8. [gh API repos/fluent/fluentd](https://api.github.com/repos/fluent/fluentd)
