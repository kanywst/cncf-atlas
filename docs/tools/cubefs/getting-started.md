# Getting Started

> Verified against release v3.5.3 and master commit `6b2e792`. Commands assume Linux with Docker, or Go 1.18+ and gcc for a source build.

## Prerequisites

- Docker and docker-compose for the quick path, or Go 1.18+ with gcc (CGO is used by libsdk and blobstore) for a source build.
- At least 10 GB of free disk for the DataNode; the script enforces `MIN_DNDISK_AVAIL_SIZE_GB=10` (`docker/run_docker.sh:6`).

## Install

Clone the repository and build from source:

```bash
git clone https://github.com/cubefs/cubefs.git
cd cubefs
make build
```

`make build` produces `cfs-server`, `cfs-client`, `cfs-cli`, and the other binaries through `build/build.sh`.

## A first working setup

The fastest way to a running cluster is the bundled Docker compose stack, which starts master, metanode, datanode, objectnode, client, and monitor together.

1. Start the full stack, pointing it at a disk path with 10+ GB free:

```bash
./docker/run_docker.sh -r -d /path/to/disk
```

1. To run a single role manually instead, point the binary at a role config. The role is read from the `role` key (`cmd/cmd.go:184`), and the dispatch switch maps it to a server (`cmd/cmd.go:206-239`):

```bash
./cfs-server -c master.json
```

Valid roles are the constants in `cmd/cmd.go:71-93`: `master`, `metanode`, `datanode`, `objectnode`, `authnode`, `console`, `lcnode`, `flashnode`, `flashgroupmanager`.

## Verify it works

The compose stack starts a monitor web UI (the `-m` flag in `docker/run_docker.sh`). Once the stack is up, use `cfs-cli` to query cluster state, then mount through the FUSE client or send an S3 request to ObjectNode to confirm reads and writes round-trip.

## Where to go next

For production topology, high availability, security hardening, and scaling, use the Helm chart (`cubefs/cubefs-helm`) and CSI driver (`cubefs/cubefs-csi`) and follow the official documentation rather than the single-host Docker stack (S1, S2).
