# Getting Started

> Based on release `v1.14.4`. Building from source assumes a working Go 1.25.0 or newer toolchain.

## Prerequisites

- Go 1.25.0 or newer, since `src/go.mod:5` pins that minimum (`src/README.md:60`).
- `make` and `git`.
- A port to bind to. CoreDNS listens on port 53 by default, which usually needs elevated privileges; the example below uses a high port to avoid that.

## Install

Build the binary from source (`src/README.md:62-68`):

```bash
git clone https://github.com/coredns/coredns
cd coredns
make
```

This produces a `coredns` binary in the repository root.

## A first working setup

The goal is a resolver that forwards every query to a public upstream and logs what it does.

1. Write a Corefile. The block `.:1053` serves the root zone on port 1053, forwards to `8.8.8.8`, and enables logging and error reporting.

```text
.:1053 {
    forward . 8.8.8.8
    log
    errors
}
```

1. Start CoreDNS against that Corefile.

```bash
./coredns -conf Corefile
```

1. In another terminal, query it. Any DNS client works; `dig` is shown here.

```bash
dig @127.0.0.1 -p 1053 example.com
```

You should get an answer section for `example.com`, and the CoreDNS terminal should print a `log` line for the query.

## Verify it works

- The `log` plugin prints one line per query, so a successful `dig` produces a matching log entry in the CoreDNS output.
- Add the `prometheus` plugin to a block to expose metrics, then check that the metrics endpoint responds; the address is configured in the Corefile (the default is `localhost:9153`).
- A non-zero exit on startup usually means a Corefile parse error or a port already in use.

## Where to go next

- Plugin reference and configuration syntax: [coredns.io/plugins](https://coredns.io/plugins).
- Out-of-tree plugins: [coredns.io/explugins](https://coredns.io/explugins).
- For Kubernetes, CoreDNS is deployed as the cluster DNS add-on (via Helm or the cluster manifests), where the `kubernetes` plugin resolves `cluster.local`. Consult the Kubernetes and CoreDNS docs for production concerns such as scaling, autoscaling, and security hardening.
