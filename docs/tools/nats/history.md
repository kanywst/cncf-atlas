# History

## Origin

NATS was created by Derek Collison. It began around 2010 as the messaging control plane for Cloud Foundry at VMware, written in Ruby ([RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/), [Wikipedia](https://en.wikipedia.org/wiki/NATS_Messaging)). The goal was an internal nervous system for a platform: a fast, simple way for components to talk without a heavy broker in the middle.

When Collison founded Apcera, NATS was rewritten in Go as `gnatsd`. The motivation was not raw speed but escaping the dependency-management pain of Ruby and getting a static binary with a real stack, which cut garbage-collection pressure. The Go rewrite also dropped the regular-expression parser in favor of a hand-written, near-zero-allocation parser ([RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/)). That parser still drives the protocol path today ([`server/parser.go:137`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/parser.go#L137)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2010 | First Ruby implementation as the Cloud Foundry messaging control plane ([RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/)) |
| 2012 | `nats-io/nats-server` repository created on GitHub (2012-10-29) ([repo](https://github.com/nats-io/nats-server)) |
| 2018 | Accepted into CNCF as an Incubating project (2018-03-15) ([CNCF project page](https://www.cncf.io/projects/nats/)) |
| ~2021 | JetStream becomes the built-in, recommended path for persistence in the 2.2 line ([JetStream docs](https://docs.nats.io/nats-concepts/jetstream)) |
| 2025 | Governance dispute with Synadia resolved; trademarks transferred to the Linux Foundation, project stays Apache-2.0 ([CNCF announcement](https://www.cncf.io/announcements/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project/)) |
| 2026 | `v2.14.2` released (2026-06-02); graduation application open ([cncf/toc#2042](https://github.com/cncf/toc/issues/2042)) |

## How it evolved

Two shifts matter. The first was the Ruby-to-Go rewrite, which set the performance character of the project: a single static binary, a hand-written parser, and a focus on tail latency. After Apcera was sold to Ericsson, Collison founded Synadia and continued NATS there, writing most of the server code himself ([RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/)).

The second was persistence. Early durable messaging lived in a separate layer called NATS Streaming (STAN), which was later deprecated. JetStream replaced it by building persistence directly into the server, with its own append-only file store and Raft-based replication ([JetStream docs](https://docs.nats.io/nats-concepts/jetstream)). This kept the single-binary, no-external-dependency model intact while adding at-least-once delivery, replay, key/value, and object storage.

## Where it stands now

In 2025 a governance dispute surfaced when Synadia notified the community of intent to pull NATS from CNCF and relicense it under BUSL. It was resolved: Synadia transferred two NATS trademarks to the Linux Foundation, CNCF kept the domain and GitHub organization, and the code stayed Apache-2.0 ([CNCF announcement](https://www.cncf.io/announcements/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project/), [CNCF blog](https://www.cncf.io/blog/2025/05/01/protecting-nats-and-the-integrity-of-open-source-cncfs-commitment-to-the-community/)).

The project remains CNCF Incubating with an open graduation application ([cncf/toc#2042](https://github.com/cncf/toc/issues/2042)). The latest release is `v2.14.2` (2026-06-02), and the source on the default branch carries VERSION `2.15.0-dev` ([`server/const.go:69`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/const.go#L69)).
