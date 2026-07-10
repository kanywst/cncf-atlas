# History

## Origin

Dex was built at CoreOS, Inc. as its authentication service. The repository was created in August 2015. A trace of that origin is still visible in the source: the JWT example in the README uses `eric.chiang@coreos.com` and `coreos.com` as its sample identity, and the routing TODO comments in the server carry CoreOS-era author handles.

The problem it addressed was practical. CoreOS shipped Kubernetes tooling, and Kubernetes could authenticate users with OIDC ID Tokens but had no way to issue them from a company's existing directory. Dex filled that gap: it speaks OIDC to Kubernetes and delegates the actual login to whatever the organisation already ran.

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | First commit at CoreOS; the initial Dex is a heavier standalone identity provider. |
| 2016 | The v2 rewrite reframes Dex as a pure OIDC provider that delegates to upstream connectors. |
| 2018 | CoreOS is acquired by Red Hat; active maintenance slows and the community seeks a neutral home. |
| 2020 | Dex is accepted as a CNCF Sandbox project (June 2020). |
| 2026 | Current releases are in the `v2.45.x` line; the project stays community-run. |

## How it evolved

The defining shift was the v1 to v2 rewrite. The early Dex was a more self-contained identity provider. Version 2 redesigned it into the model it uses today: a thin OIDC provider that owns no user identities and instead federates to upstream providers through connectors. Every current release tag is in the `v2.x` series, so v2 is effectively the only Dex most users have run.

Governance changed through acquisition. When Red Hat acquired CoreOS, the project lost its corporate owner's active attention. The CNCF Sandbox proposal notes that by the time of donation Dex was already community-driven, owned by neither CoreOS, Red Hat, nor IBM, and that an active user community wanted a vendor-neutral home for it. The Technical Oversight Committee accepted it into the Sandbox in June 2020.

## Where it stands now

Dex is maintained by a community group with a `MAINTAINERS.md` and a contributor guide, and roughly 260 contributors have landed changes over its lifetime. Releases continue in the `v2.45.x` line. The scope has stayed deliberately narrow: a federated OIDC provider, not a full identity platform. One consequence of the small maintainer surface is documented plainly: the SAML 2.0 connector is marked in the README as unmaintained and likely vulnerable to authentication bypasses, a trade-off discussed on the [Adoption & Ecosystem](./adoption) page.

## Sources

- [Dex repository](https://github.com/dexidp/dex)
- [CNCF Sandbox proposal for Dex (TOC PR #379)](https://github.com/cncf/toc/pull/379)
- [Dex README](https://github.com/dexidp/dex/blob/17a54e9046cee1142530de4d0a809809d7c9cee9/README.md)
