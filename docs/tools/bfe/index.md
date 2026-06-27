# BFE

> BFE (Beyond Front End) is a Go layer-7 load balancer and reverse proxy from Baidu that routes traffic by request content using a human-readable condition language.

- **Category**: API Gateway
- **CNCF maturity**: Sandbox (accepted 2020-06-25)
- **Language**: Go (`go 1.22` in `go.mod`)
- **License**: Apache License 2.0
- **Repository**: [bfenetworks/bfe](https://github.com/bfenetworks/bfe)
- **Documented at commit**: `d8d6dcb` (v1.8.2, 2026-05-08)

## What it is

BFE is the data-plane forwarding engine of the larger BFE system. It terminates client connections, decides which backend should serve each request based on the request's content (host, path, headers, cookies, client IP), and proxies the request to that backend. L7 means layer 7, the application layer of the OSI model, so BFE works at the HTTP request level rather than the TCP packet level.

The engine grew out of Baidu's internal traffic platform, which has been forwarding production traffic since around 2012. The forwarding engine was open-sourced in 2019 and accepted into the CNCF (Cloud Native Computing Foundation) Sandbox in 2020. This repository is the server only. Configuration management lives in separate repositories (API-Server, Conf-Agent, Dashboard) that make up the control plane.

Two traits set BFE apart from other proxies. It is written in Go, a memory-safe language, and it recovers from runtime panics rather than crashing the process. Its routing rules are expressed in a small domain-specific language (DSL, a purpose-built configuration syntax) such as `req_host_in("example.org") && req_path_prefix_in("/api", false)`, parsed into an object tree at load time.

## When to use it

- You need content-based HTTP routing where rules are conditions over the request, not just host and path prefixes.
- You want two-stage load balancing (across sub-clusters, then across backends within a sub-cluster) built into the proxy.
- You prefer extending a proxy with compiled Go modules over embedded Lua scripts.
- You run many tenants behind one fleet and want a host to product to cluster routing hierarchy.

It is a weaker fit when you need a large third-party ecosystem and dynamic xDS (the Discovery Service application programming interfaces) configuration, where Envoy is more established, or when you only need a simple static reverse proxy, where NGINX is simpler to operate.

## In this deep-dive

- [History](./history): origin at Baidu, open-sourcing, and CNCF entry.
- [Architecture](./architecture): data plane components and how a request flows.
- [Adoption & Ecosystem](./adoption): cited adopters, GitHub signals, alternatives.
- [Internals](./internals): the core types and request path, read from source.
- [Getting Started](./getting-started): build from source and run with bundled config.

## Sources

1. BFE on CNCF, project page (maturity Sandbox, accepted 2020-06-25): <https://www.cncf.io/projects/bfe/>
2. bfenetworks/bfe README (overview, features, components): <https://github.com/bfenetworks/bfe>
3. GitHub API for bfenetworks/bfe (stars, forks, created date, releases): <https://api.github.com/repos/bfenetworks/bfe>
4. baidu/bfe-book, In-depth Understanding of BFE: <https://github.com/baidu/bfe-book>
5. Four Service Proxy Projects From CNCF (Cloud Native Now): <https://cloudnativenow.com/features/4-service-proxy-projects-from-cncf/>
6. bfenetworks/bfe ADOPTERS.md: <https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md>
7. bfenetworks organisation (api-server, conf-agent, dashboard, ingress-bfe): <https://github.com/bfenetworks>
8. BFE overview docs (data plane and control plane): <https://github.com/bfenetworks/bfe/blob/develop/docs/en_us/introduction/overview.md>
