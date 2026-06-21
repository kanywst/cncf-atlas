# History

## Origin

OAuth2 Proxy began at Bitly as `google_auth_proxy` around 2014, a small proxy that gated internal tools behind a Google login. It was later generalised to support more providers and renamed to OAuth2 Proxy. The lineage and the Bitly origin are recorded in third-party write-ups of the project (source 4) and the project README (source 5).

The code that the current project descends from is the `bitly/oauth2_proxy` repository, which was no longer actively maintained. A community fork took over development.

## Timeline

| Year | Milestone |
| --- | --- |
| 2014 | Created at Bitly as `google_auth_proxy`, later generalised and renamed to `oauth2_proxy`. |
| 2018 | Forked from `bitly/oauth2_proxy` into `pusher/oauth2_proxy`; the v3.0.0 series and later belong to this fork and diverge from the original. |
| 2020 | Repository renamed from `pusher/oauth2_proxy` to `oauth2-proxy/oauth2-proxy` under its own org; images move to `quay.io/oauth2-proxy/oauth2-proxy` and the binary becomes `oauth2-proxy`. |
| 2025 | Accepted into the CNCF Sandbox on 2025-10-02. |

## How it evolved

The most consequential shift was governance, not code. Maintenance moved from a single company (Bitly) to a community fork hosted by Pusher, and then to an independent `oauth2-proxy` GitHub organisation in 2020 (source 5). The rename changed the binary name (from `oauth2_proxy` to `oauth2-proxy`) and the image registry, so the move was visible to every operator.

In October 2025 the project entered the CNCF Sandbox. The sandbox application (source 3) frames the motivation as long-term sustainability and clear, safe ownership under a neutral foundation, rather than a push to grow adoption. The onboarding is tracked separately (source 4).

Configuration has grown two parallel paths over time: the original flag and TOML based configuration, and a newer "alpha" YAML configuration. The loader still prefers legacy options and layers alpha config on top when supplied (`main.go:84` onward, in `loadConfiguration`).

## Where it stands now

The project ships tagged releases regularly; the most recent at the documented commit is v7.15.3 (2026-06-09), with the pinned `master` HEAD a few commits later. The Go module is `github.com/oauth2-proxy/oauth2-proxy/v7` (`go.mod:1`) and it builds a static `CGO_ENABLED=0` binary (`Makefile:55-56`). It is now a CNCF Sandbox project with an independent maintainer group and a broad contributor base (see [Adoption](./adoption)).
