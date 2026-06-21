# History

## Origin

authentik began as a personal project by Jens Langhammer in Hamburg, Germany. The project's own retrospective dates the first commit to 11 November 2018 ([Happy Birthday to Us!](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/)). The GitHub repository `goauthentik/authentik` was created on 30 December 2019 ([GitHub REST API](https://api.github.com/repos/goauthentik/authentik)). It started as a way to provide self-hosted single sign-on, a need that the self-hosting and home-lab community shares with small companies that do not want to pay for a hosted identity service.

## Timeline

| Year | Milestone |
| --- | --- |
| 2018 | First commit, as Jens Langhammer's personal project in Hamburg |
| 2019 | `goauthentik/authentik` GitHub repository created (2019-12-30) |
| 2021 | Gains traction in the self-hosting community |
| 2022 | Open Core Ventures approaches the founder; Authentik Security, Inc. is founded as a public benefit company |
| 2026 | Active releases; code at this commit declares `2026.8.0-rc1`, nearest stable tag `version/2026.5.3` |

## How it evolved

Two shifts matter. The first is the move from a solo project to a company. Around April 2022 Open Core Ventures approached Jens with funding, and in November 2022 Authentik Security, Inc. was founded as a public benefit company with Jens Langhammer as CTO and Fletcher Heisler as CEO ([Happy Birthday to Us!](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/)). The project runs on an open-core model from that point: a permissively licensed core plus a source-available Enterprise edition under `authentik/enterprise/` ([source](https://github.com/goauthentik/authentik)).

The second is scope. authentik grew from SSO into a single server that speaks OAuth2/OIDC, SAML, LDAP, RADIUS, and SCIM, with the protocol-specific gateways (proxy, LDAP, RADIUS, RAC) split out into separate Go "outpost" processes under `cmd/` and `internal/outpost/`.

## Where it stands now

authentik ships frequent calendar-versioned releases (the code at this commit declares `2026.8.0-rc1`, with `version/2026.5.3` as the nearest stable tag). Governance is single-vendor: Authentik Security, Inc. sets direction, in contrast to projects governed by a neutral foundation. authentik is not a CNCF project ([CNCF Projects](https://www.cncf.io/projects/), checked 2026-06-22). The repository remains the single home for the Python core, the Go outposts, and the TypeScript/Lit web UI.
