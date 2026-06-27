# Getting Started

> Verified against trustee near tag v0.20.0 (commit `af53e98`). Commands assume a Linux host with Docker and the Docker Compose plugin, plus the Rust toolchain to build the client.

This walkthrough uses the `docker compose` cluster, the quickest way to run a Key Broker Service (KBS), Attestation Service (AS), and Reference Value Provider Service (RVPS) together. No real Trusted Execution Environment (TEE) hardware is required, because the cluster can be driven with the built-in sample attester.

## Prerequisites

- Docker with the Compose plugin (`docker compose version` works).
- The Rust toolchain (`cargo`) to build the `kbs-client` binary.
- `git` and a checkout of the trustee repository.

## Install

Clone the repository and start the cluster:

```bash
git clone https://github.com/confidential-containers/trustee.git
cd trustee
docker compose up -d
```

The `setup` container writes admin keys and an admin bearer token under `kbs/config/docker-compose/` automatically, including `admin-token`. The KBS listens on `127.0.0.1:8080`.

Build and install the client (run from the repository root in a second shell):

```bash
make -C kbs cli
sudo make -C kbs install-cli
```

## A first working setup

By default the cluster blocks sample evidence, so the first step is to relax the resource policy. These commands assume your working directory is the `trustee` checkout.

1. Allow all requests with a permissive resource policy.

   ```bash
   kbs-client config \
     --url http://127.0.0.1:8080 \
     --admin-token-file kbs/config/docker-compose/admin-token \
     set-resource-policy --allow-all
   ```

2. Upload a secret resource at the path `default/test/dummy`.

   ```bash
   printf '1234567890abcde\n' > dummy_data
   kbs-client \
     --url http://127.0.0.1:8080 \
     config --admin-token-file kbs/config/docker-compose/admin-token \
     set-resource --resource-file dummy_data --path default/test/dummy
   ```

3. Fetch the resource back. Outside a TEE the sample attester is used, which the permissive policy from step 1 now allows.

   ```bash
   kbs-client --url http://127.0.0.1:8080 get-resource --path default/test/dummy
   ```

   The command prints the resource contents (base64-encoded) on success.

## Verify it works

Check the KBS health endpoint, which returns HTTP 200 when the server is up:

```bash
curl -i http://127.0.0.1:8080/healthz
```

You can also confirm the services are running with `docker compose ps` from the `trustee` checkout, which should list the `kbs`, `as`, and `rvps` containers as up.

## Where to go next

- The KBS quickstart at `kbs/quickstart.md` covers the native (non-container) build on Ubuntu, background-check mode, and passport mode.
- The KBS README at `kbs/README.md` documents deployment modes, attestation backends, and TLS configuration.
- For production deployment on Kubernetes, see the KBS operator referenced from the project website at <https://confidentialcontainers.org/>.
