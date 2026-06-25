# Internals

> Read from the source at commit `bd058fac`. Every claim here points at a file and line.

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

`client` ([`server/client.go:259`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L259)) is shared by all connection kinds. It carries the `kind`, a `pa` parse state, in/out buffers, and permissions, and it concentrates the pub/sub processing methods.

`subscription` ([`server/client.go:638`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L638)) holds the owning `client`, the subject and optional queue name, a subscription id, auto-unsubscribe counters, an optional internal callback, account-import shadow subscriptions, and an atomic closed flag.

The `Sublist` ([`server/sublist.go:65`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/sublist.go#L65)) is a tree of subject tokens. A `node` ([`server/sublist.go:87`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/sublist.go#L87)) holds `psubs` (a set of normal subscriptions) and `qsubs` (a map from queue name to subscription set). A `level` ([`server/sublist.go:96`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/sublist.go#L96)) holds the normal child nodes plus the `*` (pwc) and `>` (fwc) wildcard nodes. `Match` returns a `SublistResult` ([`server/sublist.go:59`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/sublist.go#L59)) carrying the matched psubs and qsubs.

`Account` ([`server/accounts.go:52`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/accounts.go#L52)) is the tenancy boundary. It owns its own sublist (`sl`), import/export rules, and gateway reply mapping, so subject names are scoped per account.

`msgBlock` ([`server/filestore.go:220`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/filestore.go#L220)) is the JetStream file store's append block. It carries a HighwayHash checksum, optional per-block AEAD encryption keys, and a per-subject in-memory index, so JetStream persists to its own block format rather than an external database.

## A path worth tracing

Follow a core publish from socket bytes to subscriber.

1. `readLoop` reads from the socket ([`server/client.go:1403`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L1403)) and calls `parse` ([`server/parser.go:137`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/parser.go#L137)).
2. The parser collects the `PUB` arguments and, when complete, calls `processPub` ([`server/parser.go:442`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/parser.go#L442)).
3. `processPub` ([`server/client.go:2880`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L2880)) splits the arguments into a fixed-size stack array to avoid heap allocation, stores subject/reply/size into the parse state, and checks the payload size against `maxPayload` ([`server/client.go:2921`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L2921)).
4. Once the payload is in, `processInboundClientMsg` ([`server/client.go:4311`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L4311)) updates stats and checks publish permissions.
5. Matching reads the per-client L1 cache first, validated against the account sublist's generation counter, and only falls back to `acc.sl.Match` on a miss ([`server/client.go:4421`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L4421)).
6. `Match` ([`server/sublist.go:532`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/sublist.go#L532)) calls `match` ([`server/sublist.go:559`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/sublist.go#L559)), which checks the sublist's own `s.cache` ([`server/sublist.go:567`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/sublist.go#L567)) before walking the token tree.
7. `processMsgResults` ([`server/client.go:5127`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L5127)) separates normal subscriptions from queue groups (picking one member per group) and calls `deliverMsg` ([`server/client.go:3690`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L3690)) for each, enqueuing into the target's write buffer after echo and permission checks.

```text
readLoop -> parse -> processPub -> processInboundClientMsg
  -> [L1 cache hit] processMsgResults -> deliverMsg
  -> [L1 miss]      acc.sl.Match -> match -> processMsgResults -> deliverMsg
```

## Things that surprised me

The publish hot path is built to avoid both heap allocation and lock contention. `processPub` unrolls argument splitting into a fixed-size stack array `a := [MAX_PUB_ARGS][]byte{}` ([`server/client.go:2882`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L2882)) so a normal publish allocates nothing for its arguments.

Matching is a two-level cache. Each client keeps its own L1 results map `c.in.results`, and before using it the server loads the account sublist's atomic generation counter `genidAddr := &acc.sl.genid` ([`server/client.go:4330`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L4330)). If the counter still matches the client's stored `genid`, the cached result is reused without touching the shared lock; if a subscription changed, the counter advanced and the whole L1 cache is dropped ([`server/client.go:4421`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L4421)). The cache is bounded: past `maxResultCacheSize` entries it deletes a random batch rather than tracking recency ([`server/client.go:4436`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L4436)). Behind it, the sublist has its own shared `s.cache` ([`server/sublist.go:567`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/sublist.go#L567)), so a subject can be served without walking the token tree at all. A comment marks the inline approach as driven by measured benchmark impact ([`server/client.go:4371`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L4371)).
