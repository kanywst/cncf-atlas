# Getting Started

> Verified against the source at commit `2ce1174` (near tag `v9.0.0-beta.2.pre`). Build commands assume a Unix-like host.

## Prerequisites

The build toolchain is listed in the repository's `AGENTS.md`:

- `git`
- `rustup` (the project pins a nightly toolchain in `rust-toolchain.toml`, channel `nightly-2026-01-30`)
- `make`
- `cmake` (required for gRPC)
- `awk`
- `protoc` (the protocol buffer compiler)
- A C++ compiler, gcc 5+ or clang (required for gRPC)

A running TiKV cluster also needs a Placement Driver (`pd-server` from `tikv/pd`). TiKV does not run standalone.

## Install

Build the server from source. The Makefile pins the toolchain and sets the flags, so prefer it over calling `cargo` directly.

```bash
git clone https://github.com/tikv/tikv.git
cd tikv
make build
```

`make build` produces a debug binary; `make release` produces an optimized one. The server binary comes from `cmd/tikv-server` and the operations CLI from `cmd/tikv-ctl`.

## A first working setup

The shortest real cluster is one PD and one TiKV node on the loopback interface. Start PD first, because TiKV registers with it on boot.

Step 1: start a single-node Placement Driver. The client URL defaults to port `2379`.

```bash
pd-server --name=pd1 \
  --data-dir=pd1 \
  --client-urls="http://127.0.0.1:2379" \
  --peer-urls="http://127.0.0.1:2380"
```

Step 2: start a TiKV node and point it at PD.

```bash
tikv-server --pd-endpoints="127.0.0.1:2379" \
  --addr="127.0.0.1:20160" \
  --data-dir=tikv1
```

The TiKV listen address defaults to port `20160`. From here you read and write through a client library (`client-rust`, `client-go`, `client-java`, `client-python`) or through TiDB.

## Verify it works

Use the operations CLI to query the cluster through PD:

```bash
tikv-ctl --pd 127.0.0.1:2379 cluster
```

A healthy cluster prints its cluster ID. You can also confirm the TiKV process is registered by checking that PD reports a store at the `127.0.0.1:20160` address.

## Where to go next

For multi-node deployment, high availability, TLS, encryption at rest, monitoring, and tuning, follow the official TiKV documentation [10]. For production clusters the project documents deployment through its toolchain rather than starting each binary by hand.

## Sources

- [4] [tikv/tikv README](https://github.com/tikv/tikv)
- [10] [TiKV Documentation](https://tikv.org/docs/latest/concepts/overview/)
