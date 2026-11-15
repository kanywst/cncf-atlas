# Internals

> Read from the source at commit `6993500c`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `server/client.go` | The `client` struct, read loop, and publish/subscribe processing for every connection kind |
| `server/parser.go` | Hand-written protocol state machine |
| `server/sublist.go` | Subject-token interest tree and its results cache |
| `server/accounts.go` | `Account`, the multi-tenancy boundary with its own sublist |
| `server/route.go`, `server/gateway.go`, `server/leafnode.go` | Cluster routes, super-cluster gateways, edge leaf nodes |
| `server/stream.go`, `server/consumer.go`, `server/jetstream*.go` | JetStream streams and consumers |
| `server/filestore.go`, `server/memstore.go`, `server/raft.go` | JetStream storage backends and Raft consensus |
| `server/auth.go`, `server/auth_callout.go` | JWT/nkey authentication and auth callout |

## Core data structures

`client` ([`server/client.go:260`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L260)) is shared by all connection kinds. It carries the `kind`, a `pa` parse state, in/out buffers, and permissions, and it concentrates the pub/sub processing methods.

`subscription` ([`server/client.go:648`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L648)) holds the owning `client`, the subject and optional queue name, a subscription id, auto-unsubscribe counters, an optional internal callback, account-import shadow subscriptions, and an atomic closed flag.

The `Sublist` ([`server/sublist.go:71`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L71)) is a tree of subject tokens. A `node` ([`server/sublist.go:93`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L93)) holds `psubs` (a set of normal subscriptions) and `qsubs` (a map from queue name to subscription set). A `level` ([`server/sublist.go:102`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L102)) holds the normal child nodes plus the `*` (pwc) and `>` (fwc) wildcard nodes. `Match` returns a `SublistResult` ([`server/sublist.go:60`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L60)) carrying the matched psubs and qsubs.

`Account` ([`server/accounts.go:51`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/accounts.go#L51)) is the tenancy boundary. It owns its own sublist (`sl`), import/export rules, and gateway reply mapping, so subject names are scoped per account.

`msgBlock` ([`server/filestore.go:231`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/filestore.go#L231)) is the JetStream file store's append block. It carries a HighwayHash checksum, optional per-block AEAD encryption keys, and a per-subject in-memory index, so JetStream persists to its own block format rather than an external database.

## A path worth tracing

Follow a core publish from socket bytes to subscriber.

1. `readLoop` reads from the socket ([`server/client.go:1514`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L1514)) and calls `parse` ([`server/parser.go:139`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/parser.go#L139)).
2. The parser collects the `PUB` arguments and, when complete, calls `processPub` ([`server/parser.go:455`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/parser.go#L455)).
3. `processPub` ([`server/client.go:3027`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L3027)) splits the arguments into a fixed-size stack array to avoid heap allocation, stores subject/reply/size into the parse state, and checks the payload size against `maxPayload` ([`server/client.go:3068`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L3068)).
4. Once the payload is in, `processInboundClientMsg` ([`server/client.go:4556`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4556)) updates stats and checks publish permissions.
5. Matching reads the per-client L1 cache first, validated against the account sublist's generation counter, and only falls back to `acc.sl.Match` on a miss ([`server/client.go:4663`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4663)).
6. `Match` ([`server/sublist.go:555`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L555)) calls `match` ([`server/sublist.go:582`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L582)), which checks the sublist's own `s.cache` ([`server/sublist.go:590`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L590)) before walking the token tree.
7. `processMsgResults` ([`server/client.go:5490`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L5490)) separates normal subscriptions from queue groups and picks one member per group. The pick is weighted: a queue subscription that arrived over a route or leaf node stands for several members on the remote side, so it gets that many shares of the draw ([`server/sublist.go:731`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L731), [`server/sublist.go:742`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L742)). It then calls `deliverMsg` ([`server/client.go:3866`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L3866)) for each, enqueuing into the target's write buffer after echo and permission checks.

```text
readLoop -> parse -> processPub -> processInboundClientMsg
  -> [L1 cache hit] processMsgResults -> deliverMsg
  -> [L1 miss]      acc.sl.Match -> match -> processMsgResults -> deliverMsg
```

## Things that surprised me

The publish hot path is built to avoid both heap allocation and lock contention. `processPub` unrolls argument splitting into a fixed-size stack array `a := [MAX_PUB_ARGS][]byte{}` ([`server/client.go:3029`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L3029)) so a normal publish allocates nothing for its arguments.

Matching is a two-level cache. Each client keeps its own L1 results map `c.in.results`, and before using it the server loads the account sublist's atomic generation counter `genidAddr := &acc.sl.genid` ([`server/client.go:4575`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4575)). If the counter still matches the client's stored `genid`, the cached result is reused without touching the shared lock; if a subscription changed, the counter advanced and the whole L1 cache is dropped ([`server/client.go:4663`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4663)). The cache is bounded: past `maxResultCacheSize` entries it deletes a random batch rather than tracking recency ([`server/client.go:4678`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4678)). Behind it, the sublist has its own shared `s.cache` ([`server/sublist.go:590`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L590)), so a subject can be served without walking the token tree at all. A comment marks the inline approach as driven by measured benchmark impact ([`server/client.go:4613`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4613)).
