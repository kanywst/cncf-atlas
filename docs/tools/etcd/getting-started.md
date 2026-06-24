# Getting Started

> Based on the etcd v3.6 quickstart [5] [6] [7]. Commands assume Linux on amd64 and a shell.

## Prerequisites

- A Linux amd64 host with `wget` and `tar`.
- Ports 2379 (client) and 2380 (peer) free on localhost.

## Install

Download a release tarball and put the binaries on your path.

```bash
ETCD_VER=v3.6.0
wget https://github.com/etcd-io/etcd/releases/download/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz
tar xzf etcd-${ETCD_VER}-linux-amd64.tar.gz
sudo mv etcd-${ETCD_VER}-linux-amd64/etcd* /usr/local/bin/
etcd --version && etcdctl version
```

To run it as a container instead, the official image is `gcr.io/etcd-development/etcd` (primary), with `quay.io/coreos/etcd` as a secondary mirror [7].

## A first working setup

This runs a single-member etcd and stores a key.

1. Start the server. With no flags it listens for clients on 2379 and peers on 2380.

```bash
etcd &
```

1. Write a key with `etcdctl`.

```bash
etcdctl put greeting "Hello, etcd"
```

Expected output:

```text
OK
```

1. Read it back.

```bash
etcdctl get greeting
```

Expected output:

```text
greeting
Hello, etcd
```

## Verify it works

Check member health with the endpoint status command.

```bash
etcdctl endpoint health
```

A healthy member reports that the endpoint is healthy along with a response time.

## Where to go next

The single-member setup above is for local use only. For production concerns such as running a multi-member cluster, enabling TLS and RBAC, setting the storage quota, and backup and compaction, see the official documentation at [etcd.io/docs](https://etcd.io/docs/v3.6/). Do not run a single member as a real datastore; a cluster needs an odd number of members to tolerate failures.
