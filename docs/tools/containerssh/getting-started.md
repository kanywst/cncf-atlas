# Getting Started

> Uses the official examples quick-start (source 9). Commands assume a Unix shell with Docker and an SSH client installed.

## Prerequisites

- Docker and Docker Compose, since the quick-start runs ContainerSSH and its container backend locally.
- Git, to clone the examples repository.
- An SSH client.

## Install

For the quick-start you do not build anything: the examples repository ships a `docker-compose` stack that pulls the official image. Clone it and enter the quick-start directory (source 9).

```bash
git clone https://github.com/ContainerSSH/examples.git
cd examples/quick-start
```

To build the binary from source instead, use Go: `go build ./cmd/containerssh` at the repository root. The official image is `containerssh/containerssh`.

## A first working setup

The quick-start includes a dummy authentication server and a dummy configuration server so the whole thing runs on one machine. It is a test-only configuration: the bundled auth server accepts any password. Do not expose it.

1. Start the stack.

    ```bash
    docker-compose up -d
    ```

2. Connect over SSH. Because the sample auth server accepts any password, the username is what matters. Connecting as `busybox` drops you into a BusyBox container; `foo` uses the default guest image (source 7).

    ```bash
    ssh foo@localhost -p 2222
    ```

3. When you disconnect, the container for that connection is removed. Reconnecting gives you a fresh one.

4. Tear it down.

    ```bash
    docker-compose down
    docker-compose rm
    docker image rm containerssh/containerssh-guest-image
    ```

## Verify it works

- A successful `ssh foo@localhost -p 2222` lands you at a shell prompt inside a container, not on the host. Run `hostname` or `cat /etc/os-release`: it reflects the guest image, not your machine.
- Run `docker ps` on the host while connected. You should see a container labelled with `containerssh_connection_id`, `containerssh_ip`, and `containerssh_username` (`internal/docker/handler_network.go:88-95`). After you disconnect it disappears.
- If you run the binary directly with no host key configured, it generates a temporary one and writes it back into the config file on first start (`generateHostKeys`, `main.go:238`). The relevant CLI flags are `-config`, `-dump-config`, `-licenses`, and `-healthcheck` (`getArguments`, `main.go:145`).

## Where to go next

- The dummy auth and config servers are placeholders. For real use you write your own authentication and configuration webhooks; the official documentation (source 6) covers their request and response shapes.
- For the honeypot deployment, including the binary audit log and strong `session`-mode isolation, see the honeypot use-case guide (source 8).
- For production concerns such as Kubernetes as the backend, audit-log upload to object storage, and metrics, follow the official docs (source 6) rather than this quick-start.
