# Getting Started

> Verified against v1.8.2 (commit `d8d6dcb`). Commands assume a Unix-like shell with Go 1.22+ and `make` installed.

## Prerequisites

- Go 1.22 or newer (the `go.mod` declares `go 1.22`).
- `make` and `git`.
- Network access for `go build` to fetch modules, and for `make prepare` to install `goyacc`, which regenerates the condition DSL parser.

## Install

Clone the repository and build with `make`. The default target runs `prepare`, `compile`, and `package`, producing a binary and a copy of the bundled config under `output/`.

```bash
git clone https://github.com/bfenetworks/bfe.git
cd bfe
make
```

## A first working setup

The `package` step leaves the binary at `output/bin/bfe` and the configuration at `output/conf` (`Makefile:112-115`). Run the server against that bundled config.

1. Change into the built output directory.

    ```bash
    cd output/bin
    ```

2. Start BFE, pointing `-c` at the config root and `-l` at a log directory. These flags are defined in `bfe.go:40-41`.

    ```bash
    ./bfe -c ../conf -l ../log
    ```

3. To validate the configuration without serving traffic, use `-t`, the test-config flag from `bfe.go:46`. It loads the config and exits.

    ```bash
    ./bfe -t -c ../conf
    ```

## Verify it works

- A successful start logs `bfe[version:...] start` through the logger initialised in `main` (`bfe.go:99`).
- `./bfe -v` prints the version string and exits (`bfe.go:62-65`).
- `./bfe -t -c ../conf` exits cleanly on valid config; on a bad config it prints `bfe: configuration file ... test failed` (`bfe.go:107`).

The bundled `conf/bfe.conf` listens on its configured HTTP and HTTPS ports; send a request to the HTTP listener to confirm forwarding once you have pointed a route at a backend.

## Where to go next

- The README explains running the official Docker image `bfenetworks/bfe` with `docker run` (source [2]).
- For configuration management at scale, use the control-plane repositories: API-Server, Conf-Agent, and Dashboard (source [7]).
- For Kubernetes, deploy the ingress-bfe controller (source [7]).
- baidu/bfe-book is the in-depth reference for routing, the condition DSL, and load balancing (source [4]).
