# History

## Origin

Authelia was created by Clément Michaud. The repository was first published on GitHub on 2016-12-07. The original implementation, through version 3, was a Node.js and TypeScript application, described at the time as a two-factor single sign-on server for NGINX using LDAP, TOTP, and U2F. The legacy npm package still records that lineage, with its last v3 release around 2019.

## The rewrite to Go

The defining moment in the project's history is version 4: a full rewrite from Node.js to Go, first published around October 2019. The rewrite was not only a language change. It replaced local storage with SQLite, deprecated MongoDB in favour of SQL backends (MySQL and PostgreSQL), introduced a Material UI and TypeScript frontend, shipped multi-architecture container images, and added a `v3` to `v4` migration command. The license was changed from MIT to Apache-2.0 at the same time. Everything documented in this deep-dive refers to the v4 codebase.

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Repository created; Node.js and TypeScript implementation begins. |
| 2019 | Version 4 rewrite to Go; SQL storage, new frontend, relicensed to Apache-2.0. |
| 2021 | OpenID Connect 1.0 provider introduced as a beta in v4.29. |
| 2022 | WebAuthn lands in v4.34 as a replacement for FIDO U2F. |
| 2025 | v4.38 adds Pushed Authorization Requests; v4.39 adds the device code flow, JWE tokens, and passkeys. |

## How it evolved

After the rewrite, the project grew along two lines. The first is the proxy integration surface: support expanded from NGINX to Traefik, Caddy, Envoy, HAProxy, and Skipper, each through the forward-auth or external-authorization mechanism that proxy supports. The second is the OpenID Connect provider, which began as a beta in v4.29 and has been built out release by release. As of v4.39 it is OpenID Certified for several profiles but is still officially labelled beta, with the team working toward removing that status.

WebAuthn replaced the older U2F second factor in v4.34, prompted in part by Chrome removing its U2F API in 2022, and v4.39 added passkeys for passwordless login.

## Where it stands now

The current stable release is 4.39.20. The project is independently maintained by a small core team (Clément Michaud, Amir Zarrinkafsh, and James Elliott) with more than one hundred contributors. It is funded through Open Collective and in-kind sponsorship, with funds earmarked for security audits. It is not part of any foundation. Releases follow a pattern of frequent patch releases within a feature line, with feature releases roughly once a year.

## Sources

- [Authelia repository](https://github.com/authelia/authelia)
- [authelia/v4 Go module](https://pkg.go.dev/github.com/authelia/authelia/v4)
- [npm: authelia (legacy v3)](https://www.npmjs.com/package/authelia)
- [WebAuthn roadmap entry](https://www.authelia.com/roadmap/complete/webauthn/)
- [OpenID Connect provider roadmap](https://www.authelia.com/roadmap/active/openid-connect-1.0-provider/)
- [4.39 release notes](https://www.authelia.com/blog/4.39-release-notes/)
