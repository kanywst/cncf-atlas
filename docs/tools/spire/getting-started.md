# Getting Started

> Based on the source at commit `73215a39` (near `v1.15.1`). Commands assume a Linux or macOS host with Go and a shell. The join-token flow below runs server and agent on one machine.

## Prerequisites

- Go (the module targets `go 1.26.4`, `go.mod:3`), or a prebuilt release tarball.
- A POSIX host where the server and agent can share a directory for the agent socket.

## Install

Build the two binaries from source:

```bash
make build
```

This produces `bin/spire-server` and `bin/spire-agent` (`Makefile:256`, `build: tidy $(addprefix bin/,$(binaries))`). Alternatively, download a release tarball from the [releases page](https://github.com/spiffe/spire/releases).

## A first working setup

1. Start the server with the sample config. `conf/server/server.conf` sets `trust_domain`, `data_dir`, and the `DataStore`, `KeyManager`, and `NodeAttestor` plugins; `conf/server/server_full.conf` documents every option.

   ```bash
   bin/spire-server run -config conf/server/server.conf
   ```

1. Generate a join token for the agent. The token is the agent's bootstrap credential for node attestation.

   ```bash
   bin/spire-server token generate -spiffeID spiffe://example.org/myagent
   ```

1. Start the agent with that token, using the sample agent config `conf/agent/agent.conf`.

   ```bash
   bin/spire-agent run -config conf/agent/agent.conf -joinToken <token>
   ```

1. Create a registration entry. This says: a workload running as uid 1000 under the agent's SPIFFE ID is issued `spiffe://example.org/myworkload`.

   ```bash
   bin/spire-server entry create \
     -parentID spiffe://example.org/myagent \
     -spiffeID spiffe://example.org/myworkload \
     -selector unix:uid:1000
   ```

## Verify it works

Fetch an SVID through the Workload API as the matching uid. Point `-socketPath` at the agent's configured socket (the sample config uses a path under a temp directory).

```bash
bin/spire-agent api fetch x509 -socketPath <agent-socket-path>
```

A healthy setup prints the SPIFFE ID, the SVID certificate, and its bundle. No credential is presented on the call; the agent reads the caller's uid from the socket peer credential.

## Where to go next

For production concerns such as choosing a real node attestor (Kubernetes, AWS, GCP, TPM), persistent datastores, HA, and federation between trust domains, see the [SPIFFE Kubernetes quickstart](https://spiffe.io/docs/latest/try/getting-started-k8s/) and the `doc/` directory in the repository. This page covers only the local join-token path.
