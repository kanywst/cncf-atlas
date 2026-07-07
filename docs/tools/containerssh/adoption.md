# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md` or `MAINTAINERS.md` file (both return 404 from the GitHub API), and no first-party source naming a production-adopting organisation was found during research. No named production adopter is claimed here.

| Organisation | Use case | Source |
| --- | --- | --- |
| (no named production adopters confirmed) | An individual honeypot project, `paseaf/ContainerSSH-honeypot`, runs a high-interaction SSH honeypot built on ContainerSSH on GCP; this is a personal project, not an organisational deployment | [paseaf/ContainerSSH-honeypot](https://github.com/paseaf/ContainerSSH-honeypot) |

## Adoption signals

Measured from the GitHub API on 2026-06-26 (source 10):

- Stars: 3,061
- Forks: 106
- Contributors: 21
- Open issues: 57
- Latest release: v0.6.0, published 2026-03-23 (the documented commit `ce7d2b6` is a little later on `main`)
- CNCF maturity: Sandbox, accepted 2022-09-14 (source 3)
- Community: a `#containerssh` channel on the CNCF Slack (source 2)

## Ecosystem

ContainerSSH is built to sit between an SSH client and a container runtime, so most of its ecosystem is the systems it integrates with rather than tools built on top of it:

- **Container backends**: Docker, Kubernetes, and Podman (through its Docker-compatible HTTP API), plus a `sshproxy` backend that forwards to another SSH server.
- **Authentication and configuration webhooks**: any HTTP service you write, which is how it reaches an IdP, database, or directory.
- **Audit log storage**: the binary audit log can be uploaded to S3-compatible object storage.
- **Observability**: Prometheus metrics and GeoIP enrichment of connections.
- **Supply chain**: releases ship SLSA provenance (`multiple.intoto.jsonl`) verifiable with `slsa-verifier` (sources 2, 11).

## Alternatives

ContainerSSH occupies a narrow niche: an SSH front door that spawns a real, throwaway container per connection with webhook-driven auth and config. The nearest alternatives each solve an overlapping but distinct problem.

| Alternative | Differs by |
| --- | --- |
| [Cowrie](https://github.com/cowrie/cowrie) | A medium-interaction SSH/Telnet honeypot that emulates a shell in Python; it never starts a container, so an attacker is confined to the emulation rather than dropped into a real (isolated) system (source 5). |
| [Teleport](https://github.com/gravitational/teleport) | A certificate-based access plane for auditing SSH and Kubernetes access to existing machines and clusters; it governs access to real fleets rather than spawning disposable containers per login. |
| [sshpiper](https://github.com/tg123/sshpiper) | An SSH reverse proxy that routes connections to upstream SSH servers; it multiplexes and proxies but does not create ephemeral containers, drive auth/config webhooks, or upload session audit logs. |
