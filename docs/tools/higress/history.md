# History

## Origin

Higress started inside Alibaba. The problem it addressed was concrete: the company ran Tengine, a fork of nginx, and nginx reloads its configuration on every route change. For services holding long-lived connections that reload was disruptive, and the nginx model also lacked good load balancing for gRPC and for Dubbo, Alibaba's own RPC framework. Higress was built to route traffic without that reload penalty and to handle those protocols (README).

Alibaba Cloud went on to build a commercial API gateway product on top of Higress, which it markets with a 99.99% availability claim. Internally, Higress backs core AI applications including the Tongyi Bailian (通义百炼) model studio and the PAI machine learning platform (README). The GitHub repository was created on 2022-10-27 (repository metadata).

## Timeline

| Year | Milestone |
| --- | --- |
| 2022 | Repository created on GitHub (2022-10-27) |
| 2023-2025 | Progressed through `v0.x` to `v1.0.0` and into the `v2.x` line, shifting focus toward AI gateway and MCP server hosting |
| 2026 | CNCF announced Higress joining as a Sandbox project (2026-03-25); documented here at `bd9c4c5`, near tag `v2.2.3` (2026-06-25) |

## How it evolved

The clearest shift over the project's life is scope. Early versions were an Ingress and microservice gateway aimed at the nginx-reload and Dubbo problems. Through the `v2.x` line the emphasis moved toward AI: an `ai-proxy` plugin fronting many LLM providers, AI-specific plugins such as caching, and hosting for MCP (Model Context Protocol) servers. The CNCF announcement describes Higress as an AI-native API gateway built on Envoy and Istio that unifies traffic, microservice, and AI gateways into a single control plane (CNCF blog).

The other shift is governance. On 2026-03-25 CNCF announced that Higress had passed the TOC vote and joined as a Sandbox project. The canonical repository moved to the `higress-group` organization as part of that donation. One detail did not move with it: the Go module path in `go.mod` is still `github.com/alibaba/higress/v2`, so imports keep the Alibaba path even though the repository now lives under `higress-group` (`go.mod:1`).

## Where it stands now

Higress is an active CNCF Sandbox project. The `v2.x` line is current, with `v2.2.3` tagged on 2026-06-25 and the documented commit `bd9c4c5` a few commits past it on `main`. Development is centered on the AI gateway and MCP hosting features on top of the routing core. The project reports roughly 182 contributors, 8,816 stars, and 1,186 forks as of 2026-07-09 (repository signals), a contributor base wider than the single-vendor origin, though Alibaba remains the primary driver.
