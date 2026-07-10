# Getting Started

> Based on the `examples/local/` walkthrough at commit `7924743`. Commands assume a local MySQL and the built Vitess binaries on your `PATH`.

## Prerequisites

- `mysqld` and the `mysql` client installed locally.
- Vitess binaries built and on `PATH`. From a clone of the repo, run `make build`.
- The example scripts under `examples/local/` from the repository.

## Install

```bash
git clone https://github.com/vitessio/vitess.git
cd vitess
make build
export PATH="$PWD/bin:$PATH"
```

## A first working setup

The `examples/local/` directory brings up a topology service, vtctld, VTGate, and VTTablets for a `commerce` keyspace. The command summary is in `examples/local/README.md`.

1. Set up the environment and aliases, then bring up the initial cluster (`examples/local/README.md:9`, `README.md:12`).

   ```bash
   source ../common/env.sh
   ./101_initial_cluster.sh
   ```

1. Insert and read back sample data through VTGate (`examples/local/README.md:15`).

   ```bash
   mysql < ../common/insert_commerce_data.sql
   mysql --table < ../common/select_commerce_data.sql
   ```

1. Move two tables into a new `customer` keyspace with VReplication (`examples/local/README.md:22`).

   ```bash
   vtctldclient MoveTables --workflow commerce2customer --target-keyspace customer create --source-keyspace commerce --tables "customer,corder"
   ```

1. Reshard the `customer` keyspace from one shard into two (`examples/local/README.md:40`).

   ```bash
   vtctldclient Reshard --workflow cust2cust --target-keyspace customer create --source-shards '0' --target-shards '-80,80-'
   ```

## Verify it works

After step 2, the `mysql --table` select should print rows from the `commerce` keyspace, which confirms VTGate is routing real queries to a VTTablet and its MySQL backend. For workflow steps, use `vtctldclient vdiff ... show last` to confirm a MoveTables or Reshard workflow has copied and matched its data before switching traffic.

## Where to go next

For production deployments on Kubernetes, use vitess-operator with `examples/operator/101_initial_cluster.yaml`. The official site at <https://vitess.io/> covers high availability, backups, security, and scaling. The repository's `GOVERNANCE.md` and `GUIDING_PRINCIPLES.md` describe how the project is run.
