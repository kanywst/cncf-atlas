# ContainerSSH

> An SSH server that boots a throwaway container for each connection and puts the user inside it, delegating both authentication and per-connection configuration to external HTTP webhooks.

- **Category**: Developer Tools
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [ContainerSSH/ContainerSSH](https://github.com/ContainerSSH/ContainerSSH)
- **Documented at commit**: `ce7d2b6` (main, 2026-05-08, after tag v0.6.0)

## What it is

ContainerSSH is an SSH server with no fixed users and no fixed shells. When a client connects, it does not open a shell on the host. It asks an external webhook whether the credentials are valid, asks a second webhook what configuration this connection should get, then starts a container (Docker, Kubernetes, or Podman through its Docker-compatible API) and connects the SSH session to a process inside that container. When the client disconnects, the container is removed. Nothing survives the session.

The design moves two decisions out of the server and onto HTTP endpoints you write. Authentication is a POST to your webhook, which lets you back it with any identity provider, database, or LDAP directory. Per-connection configuration is a second POST, so the same server can drop user A into a Docker container, user B into a Kubernetes pod, and change the image per login, with all of that logic living in your webhook rather than in a config file.

Two use cases drive the project. The first is developer and lab access: give people a real, isolated container over SSH without provisioning host accounts. The second is honeypots: expose an SSH server that records everything an attacker types (passwords included) into a binary audit log, inside a strongly isolated throwaway container. The same server covers both because a single configuration switch changes how hard the isolation bites.

## When to use it

- You want to hand out ephemeral, per-connection containers over SSH without creating host user accounts.
- Your authentication or per-user configuration needs to come from a service you control (an IdP, a database), not a static file.
- You are building an SSH honeypot and want strong isolation plus a full audit log of the session, keystrokes and credentials included.
- It is a poor fit when you need persistent home directories or long-lived sessions that outlive the SSH connection: the container is destroyed on disconnect by design.
- It is also a poor fit when you want certificate-based access to existing fleets of machines. That is an access-plane problem better served by a tool like Teleport.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. ContainerSSH GitHub repository: <https://github.com/ContainerSSH/ContainerSSH>
2. ContainerSSH README: <https://github.com/ContainerSSH/ContainerSSH/blob/main/README.md>
3. CNCF project page, ContainerSSH: <https://www.cncf.io/projects/containerssh/>
4. CNCF Sandbox projects: <https://www.cncf.io/sandbox-projects/>
5. "Creating an SSH honeypot" (LWN.net, FOSDEM 2021 recap): <https://lwn.net/Articles/848291/>
6. About ContainerSSH: <https://containerssh.io/about/>
7. Getting started / quick start: <https://containerssh.io/v0.5/getting-started/>
8. Honeypot use case: <https://containerssh.io/v0.5/usecases/honeypots/>
9. ContainerSSH/examples (quick-start): <https://github.com/ContainerSSH/examples>
10. GitHub REST API (stars, forks, contributors): <https://api.github.com/repos/ContainerSSH/ContainerSSH>
11. slsa-verifier: <https://github.com/slsa-framework/slsa-verifier>
