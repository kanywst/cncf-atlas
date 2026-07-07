# Internals

> Read from the source at commit `ce7d2b6`. Every claim here should point at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `main.go` | Real entry point: `Main()` (`main.go:26`), argument parsing (`getArguments`, `main.go:145`), host-key generation (`main.go:238`). |
| `factory.go` | Assembles the nested handler stack from the inside out (`New`, `factory.go:22`; order at `factory.go:54-78`). |
| `internal/sshserver/` | TCP listener, the SSH protocol, and the handler interfaces every layer implements (`handler.go`). |
| `internal/backend/` | The bridge layer: loads per-connection config, selects the backend, applies the security overlay (`handler.go`). |
| `internal/config/` | Configuration loaders, including the HTTP config webhook client (`loader_http.go`). |
| `internal/auth/` | The auth webhook client plus built-in OAuth2 / OIDC and Kerberos (`webhook_client_impl.go`, `oauth2_oidc.go`, `kerberos.go`). |
| `internal/docker/` | The Docker backend: per-connection container lifecycle and per-channel program execution. |
| `config/` | The root `AppConfig` type and its validation (`appconfig.go`). |

## Core data structures

- `config.AppConfig` (`config/appconfig.go:11`) is the root of all configuration. The config webhook dynamically replaces part of it per connection.
- `sshserver.Handler` and `NetworkConnectionHandler` (`internal/sshserver/handler.go:19`, `:97`) are the interface hierarchy for the connection, authentication, and session-channel stages. Every backend and every integration layer implements this same contract.
- `sshserver.AuthResponse` (`internal/sshserver/handler.go:35`) is a three-valued enum: `Success`, `Failure`, `Unavailable`. `Unavailable` means the auth backend is down, deliberately distinct from a credential failure.
- `backend.networkHandler` (`internal/backend/handler.go:52`) holds the connection and the delegate for the chosen backend (`backend sshserver.NetworkConnectionHandler`), centralising `OnDisconnect` and `OnShutdown`.
- `docker.channelHandler` (`internal/docker/handler_channel.go:16`) maps one SSH session channel to one program execution inside a container, holding the `exec dockerExecution` and the `pty`/`rows`/`columns`/`env` state.

## A path worth tracing

Follow a Docker backend connection in the default `connection` execution mode, from handshake to disconnect.

1. After the SSH handshake succeeds, `docker.networkHandler.OnHandshakeSuccess` (`internal/docker/handler_network.go:52`) opens a `ContainerStart` context with a timeout, prepares the Docker client (`setupDockerClient`, `internal/docker/handler_network.go:153`), and pulls the image (`pullImage`, `internal/docker/handler_network.go:144`).
2. It builds the connection labels (`containerssh_connection_id`, `containerssh_ip`, `containerssh_username`) and, in `connection` mode, creates and starts exactly one container for the connection (`internal/docker/handler_network.go:88-95`), writing any files from `meta.GetFiles()` into it (`internal/docker/handler_network.go:97-108`).
3. When the client opens a session channel, `sshConnectionHandler.OnSessionChannel` (`internal/docker/handler_ssh.go:33`) returns a `channelHandler`.
4. A `shell`, `exec`, or `subsystem` request calls `channelHandler.OnShell` (`internal/docker/handler_channel.go:199`) or `OnExecRequest` (`internal/docker/handler_channel.go:187`), both of which call `run` (`internal/docker/handler_channel.go:80`).
5. `run` branches on the execution mode (`internal/docker/handler_channel.go:91`). In `connection` mode it calls `handleExecModeConnection` (`internal/docker/handler_channel.go:129`), which does a `createExec` (the equivalent of `docker exec`) against the already-running container. In `session` mode it calls `handleExecModeSession` (`internal/docker/handler_channel.go:147`), which starts a fresh container per session and makes the program that container's main process.
6. `c.exec.run(...)` (`internal/docker/handler_channel.go:108`) wires the SSH channel's stdin, stdout, and stderr directly to the container's I/O and returns `session.ExitStatus` when the program exits.
7. On disconnect, `networkHandler.OnDisconnect` (`internal/docker/handler_network.go:164`) calls `container.remove` and destroys the container.

```text
OnHandshakeSuccess (create+start container)  handler_network.go:52,88-95
  OnSessionChannel -> channelHandler          handler_ssh.go:33
    OnShell/OnExecRequest -> run              handler_channel.go:199,187,80
      run branches on exec mode               handler_channel.go:91
        connection: handleExecModeConnection  handler_channel.go:129  (docker exec)
        session:    handleExecModeSession     handler_channel.go:147  (new container, PID 1)
      c.exec.run wires stdio, returns exit     handler_channel.go:108
OnDisconnect (container.remove)               handler_network.go:164
```

`parseProgram` (`internal/docker/handler_channel.go:64`) decides how to interpret a requested command: if it starts with `/`, `./`, or `../` it is used as an argv directly, otherwise it is wrapped as `/bin/sh -c <program>`.

The auth webhook client is worth noting alongside this. `internal/auth/webhook_client_impl.go` builds the endpoints `/password` (`webhook_client_impl.go:68`), `/pubkey` (`:92`), and `/authz` (`:47`), and the password is base64-encoded before being sent (near `webhook_client_impl.go:73`). This fully separates the credential check from the server, so any IdP, database, or LDAP directory can sit behind the webhook.

## Things that surprised me

- **A single enum turns ContainerSSH into two different products.** The Docker backend has two execution modes (`config.DockerExecutionModeConnection` versus `DockerExecutionModeSession`, `internal/docker/handler_channel.go:91-95`). In `connection` mode there is one container per SSH connection and each channel enters it with `docker exec`, so multiple sessions share state and PTY and agent forwarding both work (`setupAgent`, `internal/docker/handler_ssh.go:127`). In `session` mode each session channel starts a new container with the user's program as PID 1: isolation is stronger, but port and agent forwarding are explicitly refused inside `setupAgent` (`internal/docker/handler_ssh.go:185`). Honeypot deployments want the strong-isolation `session` mode; lab and debug deployments want the convenient `connection` mode. This one branch is what lets the same server be both.
- **An unavailable auth backend is not a failed login.** `AuthResponse` carries a distinct `Unavailable` value (`internal/sshserver/handler.go:35`) so that an auth-service outage is handled differently from wrong credentials rather than collapsing into a generic rejection.
- **Config validation is deliberately skipped when a config server is configured.** `AppConfig.Validate` skips backend validation when `ConfigServer.URL != "" && !dynamic` (`config/appconfig.go:103`), because the backend settings are expected to arrive from the config webhook at connection time, not from the static file.
- **The server generates its own host key on first run.** With no host key configured, `runContainerSSH` (`main.go:120`) generates a temporary host key and writes it back into the configuration file (`generateHostKeys`, `main.go:238`).
