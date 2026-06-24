# Internals

> Read from the source at commit `fe36ad62`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `daemon/` | The `cilium-agent` binary; `daemon/cmd/` holds the cobra root and Hive cells |
| `plugins/cilium-cni/` | CNI plugin kubelet invokes per pod; talks to the agent over REST |
| `pkg/endpoint/` | Endpoint state machine and regeneration logic |
| `pkg/identity/`, `pkg/labels/` | Maps label sets to numeric security identities |
| `pkg/policy/` | Resolves policy into per-endpoint `MapState` (eBPF policy map contents) |
| `pkg/ipcache/` | Cluster-wide IP-to-identity mapping synced into the eBPF ipcache map |
| `pkg/datapath/` | Datapath abstraction; `pkg/datapath/loader/` compiles and loads eBPF objects |
| `pkg/maps/` | Go wrappers over the individual eBPF maps (lxcmap, policymap, ctmap) |
| `operator/` | Cluster-scoped Deployment: IPAM, identity GC, CRD management |
| `bpf/` | The C datapath, compiled by clang/LLVM to eBPF bytecode |

## Core data structures

- Endpoint (`pkg/endpoint/endpoint.go:126`). One pod equals one Endpoint. It carries a node-unique `ID uint16`, references to the `loader` and `orchestrator` plus a `compilationLock` for datapath builds, a policy repository, the lxcmap reference, and a `RWMutex`. It embeds a state machine (waiting-for-identity, regenerating, ready) and serializes its own regeneration.
- Identity (`pkg/identity/identity.go:27`). Holds an `ID NumericIdentity`, the `Labels`, a `LabelArray` for fast lookup, and a reference count. Allocating exactly one numeric identity per label set is the root of Cilium's policy model. `IdentityMap` aliases `map[NumericIdentity]labels.LabelArray` (`pkg/identity/identity.go:62`).
- IPCache (`pkg/ipcache/ipcache.go:117`). Holds the bidirectional IP/CIDR-to-identity mapping cluster-wide and syncs it into the eBPF ipcache map, so the kernel can resolve source and destination IPs to identities during packet processing.
- mapState / MapState (`pkg/policy/mapstate.go:98`). Resolved policy keyed by identity plus port plus protocol plus traffic direction. This becomes the eBPF policy map contents directly.
- templateCfg (`pkg/datapath/loader/template.go:45`). A wrapper used for ELF templating: it passes through the conditional-branch parts of a real endpoint config while replacing static data with dummy values.

## A path worth tracing

The template-and-substitute datapath is the part worth reading. `fetchOrCompile` looks up the object for an endpoint configuration, compiling it only if that configuration's hash has not been compiled yet:

```text
fetchOrCompile(ctx, cfg, ...)            pkg/datapath/loader/cache.go:175
  cfg = wrap(cfg)                        wrap endpoint config in templateCfg
  hash = o.baseHash.hashTemplate(cfg)    pkg/datapath/loader/cache.go:179
  -> compile once per distinct hash, otherwise return a copy of the cached ELF
```

When a new hash is compiled, the agent logs `"Compiled new BPF template"` with the object path and the compilation time (`pkg/datapath/loader/cache.go:160`). Endpoint-specific values (ID, MAC, IP, identity) are substituted into the ELF just before load, so the expensive clang invocation happens once per configuration shape rather than once per pod.

## Things that surprised me

- The dummy values in the template are deliberately non-zero in every 32-bit section. The comment on `templateCfg` explains why: a zero-initialized static integer makes the compiler emit a `.bss` reference, which cannot be substituted later, so the values are forced non-zero to keep them in the `.data` section (`pkg/datapath/loader/template.go:35`).
- The template is built to be harmless if it ever attaches to a real device by accident. Its identity resolves to `world`, the least-privileged context (`pkg/datapath/loader/template.go:71`), and its IPv4 address is in the RFC5737 documentation prefix, which is not routable (`pkg/datapath/loader/template.go:91`).
- There is an explicit ordering hazard around the compilation lock. `regenerateBPF` waits on `<-e.orchestrator.DatapathInitialized()` before taking `e.compilationLock.RLock()`, because taking the read lock first would block datapath initialization (which needs the write lock) and deadlock (`pkg/endpoint/bpf.go:368`).
