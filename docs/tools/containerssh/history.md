# History

## Origin

ContainerSSH was started by Janos Pasztor. The repository was created on 2020-06-03 (source 10) and the Go module was published later that year. The original motivation was not honeypots. It came from a web-hosting problem: moving user data between servers where the same person had different usernames on each machine. The usual answer, an SSH server pinned to a `ForceCommand`, is vulnerable to command injection through `SSH_ORIGINAL_COMMAND`, which makes it dangerous to expose. Isolating each session in its own container removed that class of risk (source 5).

The honeypot use case arrived through a talk. At FOSDEM 2021, Sanja Bonic and Janos Pasztor presented an experiment in building an SSH honeypot from containers. Their first design recorded console sessions to asciinema, but they found that most attackers were bots that never opened an interactive console and instead sent commands directly over SSH, so nothing was captured. They switched to a binary audit log that records everything, passwords included (source 5). That audit model is still a defining feature of the project.

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | Repository created (2020-06-03) under `janoszen/containerssh`; the Go module is published later that year (source 10). |
| 2021 | FOSDEM 2021 talk on building an SSH honeypot from containers; the project pivots its audit design to a full binary log (source 5). |
| 2022 | Accepted into the CNCF Sandbox on 2022-09-14 (source 3). |
| 2026 | v0.6.0 released on 2026-03-23; releases ship SLSA provenance verifiable with `slsa-verifier` (source 2). |

## How it evolved

The most visible change over time was where the code lives. The project began under `github.com/janoszen/containerssh`, and for a period the core implementation was split into a separate `libcontainerssh` repository. That split has since been reversed: the main repository is now the implementation itself, published under the module path `go.containerssh.io/containerssh`. At the documented commit the top level carries `agentprotocol/`, `auditlog/`, `auth/`, `cmd/`, `config/`, `http/`, `internal/`, `log/`, `message/`, `metadata/`, and `service/`, with the bulk of the code (about 256 of roughly 328 non-test Go files) under `internal/`.

The other shift is in supply-chain assurance. Releases now attach SLSA (Supply-chain Levels for Software Artifacts) provenance as a `multiple.intoto.jsonl` file, which a consumer can check with `slsa-verifier` before trusting a binary (source 2). This matters more than usual for a project whose whole job is to accept untrusted SSH connections.

## Where it stands now

The pinned commit `ce7d2b6` is on `main`, a little after the v0.6.0 release of 2026-03-23, which is the latest tagged release at that point. The project builds with Go (`go 1.25.3`, `go.mod:3`) either from source via `go build ./cmd/containerssh` or from the official `containerssh/containerssh` image. It is a CNCF Sandbox project (accepted 2022-09-14) and coordinates through a `#containerssh` channel on the CNCF Slack (source 2). It remains a single-maintainer-led project with a modest contributor base; the adoption page covers the measurable signals.
