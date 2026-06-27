# Getting Started

> Verified against the Docker development setup at commit `3a7ae05`. Commands assume macOS or Linux with the prerequisites below.

## Prerequisites

- `git`
- `docker`
- `make`
- `sh`

The official Docker setup states it is tested on CentOS 7 and macOS 10.14 or newer (source 3, `docker/README.md`).

## Install

There is no single binary install for the servers. The development path builds ZMS, ZTS, and the UI as Docker images from the source tree.

```bash
git clone https://github.com/AthenZ/athenz.git
cd athenz/docker
```

## A first working setup

This brings up a local ZMS, ZTS, and UI for development. The build step is slow (the README estimates 15 to 30 minutes).

1. Build the Athenz container images.

```bash
make build
```

1. Deploy the development environment (ZMS on port 4443, ZTS on port 8443).

```bash
make deploy-dev
```

1. Run the bundled verification once the containers are up.

```bash
make verify
```

## Verify it works

`make verify` exercises the deployed servers. You can also tail the server logs the deployment writes locally:

```bash
less ./logs/zms/server.log
less ./logs/zts/server.log
```

ZMS listens on `localhost:4443` and ZTS on `localhost:8443` in this setup. To clean up afterward, run `make clean` from the `docker` directory.

## Where to go next

For real deployments, follow the official server setup guides rather than the development Docker path: `docs/setup_zms.md`, `docs/setup_zts.md`, and `docs/setup_ui.md` for local and production installs, and `docs/aws_athenz_setup.md` for AWS. The authorization model is documented in `docs/data_model.md`, `docs/auth_flow.md`, and `docs/copper_argos.md` (the service-identity X.509 feature). Day-to-day management uses the ZMS client utility (`docs/zms_client.md`).
