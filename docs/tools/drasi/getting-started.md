# Getting Started

> Verified against the source at commit `62b10c7` (18 commits past tag `0.10.0`). Commands assume a Kubernetes cluster reachable through `kubectl` and a shell with `curl`.

## Prerequisites

- A Kubernetes cluster set as the current `kubectl` context. Drasi installs its components there.
- `curl` (or `wget`) to fetch the CLI installer, which downloads a release binary from GitHub (`cli/installers/install-drasi-cli.sh`).
- Network access to pull Drasi's container images during `drasi init`.

## Install

Drasi is used through the `drasi` CLI. The repository ships an installer script that downloads the matching release binary into `/usr/local/bin` (`cli/installers/install-drasi-cli.sh:15`, `install-drasi-cli.sh:117`):

```bash
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh | /bin/bash
```

With the CLI in place, install the Drasi platform onto the cluster that is your current `kubectl` context. `drasi init` is the install command (`cli/cmd/init.go`):

```bash
drasi init
```

## A first working setup

The shortest working path is a Source, a Continuous Query, and a Reaction that shows the query output. The repository carries example resources under `cli/` that match this shape (`cli/test-source.yaml`, `cli/test-query.yaml`).

1. Apply a Source that connects to the system whose changes you want to observe. A PostgreSQL Source names the tables to watch (`cli/test-source.yaml`). `drasi apply` creates or updates resources (`cli/cmd/apply.go`).

   ```bash
   drasi apply -f source.yaml
   ```

1. Apply a Continuous Query that defines what to observe. The query is Cypher, and it subscribes to the Source by id and returns the shape of the output (`cli/test-query.yaml`):

   ```yaml
   kind: ContinuousQuery
   apiVersion: v1
   name: query1
   spec:
     mode: query
     sources:
       subscriptions:
         - id: foo
     query: >
       MATCH
         (i:Item {Category: '1'})
       RETURN
         i.ItemId AS Id,
         i.Name as Name,
         i.Category as Category
   ```

   ```bash
   drasi apply -f query.yaml
   ```

1. Apply a Reaction to observe the output. The tutorial uses a debug Reaction that displays the rows a query adds, updates, and deletes.

   ```bash
   drasi apply -f reaction.yaml
   ```

## Verify it works

List the resources Drasi is managing and confirm the query is running:

```bash
drasi list query
```

Then describe the query to see its status and current result set (`cli/cmd/describe.go`):

```bash
drasi describe query query1
```

Change a row in the source table that matches the query pattern (here, an `Item` with `Category` `1`), and the debug Reaction shows the corresponding added, updated, or deleted result. A green status on `drasi describe` means the Source is bootstrapped and the query is evaluating live changes.

## Where to go next

The official Getting Started tutorial walks the full Source, Continuous Query, and debug Reaction flow on Kubernetes at <https://drasi.io/drasi-kubernetes/getting-started/>, and the documentation site at <https://drasi.io/> covers the prebuilt Sources and Reactions, the Continuous Query language, and how-to guides for production concerns. For custom integrations, the Source and Reaction SDKs live under `sources/sdk` and `reactions/sdk` in the repository.
