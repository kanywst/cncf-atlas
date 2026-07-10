# Adoption & Ecosystem

## Who uses it

Dex's main habitat is inside other open-source projects, which embed it as their OIDC provider. Its `ADOPTERS.md` lists both projects and companies. A representative set:

| Organisation | Use case | Source |
| --- | --- | --- |
| Argo CD | SSO for its web UI and CLI | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| sigstore | Authentication in the public Fulcio CA, binding code-signing certs to OIDC identities | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Kubeflow | External OIDC authentication component of the Kubeflow Platform | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Kyma | Kubernetes API-server authentication and protection of integrated UIs (Grafana, Loki, Jaeger) | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| LitmusChaos | OAuth2 login in ChaosCenter | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Chef | User authentication in Chef Automate | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Ericsson | Kubernetes API-server auth in Cloud Container Distribution | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Flant | Access to core components of its Managed Kubernetes service | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Kasten | Auth for the K10 backup platform dashboard | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Pydio | OIDC service for Pydio Cells | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |

The file lists more, including Aspect, Banzai Cloud, JuliaBox, Pusher, Elastisys (Welkin), Terrakube, and LLMariner. Each entry there carries a link to the adopter and a description of the use case.

## Adoption signals

As observed on the repository in July 2026: roughly 10,900 GitHub stars, about 1,950 forks, and around 260 contributors over the project's lifetime. The current release line is `v2.45.x`, with `v2.45.1` published in March 2026. The README carries an OpenSSF Scorecard and an OpenSSF Best Practices badge. The clearest signal of reach is indirect: Dex ships inside widely-deployed projects like Argo CD, so its real install base is far larger than its own download numbers suggest.

## Ecosystem

Dex sits at a well-worn junction in the Kubernetes stack. The Kubernetes API server's OIDC authentication consumes Dex ID Tokens directly, usually reached from the command line through `kubectl` plugins such as `kubelogin`. AWS STS can likewise federate against a Dex issuer. For web UIs that are not OIDC-aware, `oauth2-proxy` is a common front end that authenticates through Dex. Operationally, the gRPC admin API (`api/api.proto`) lets external tooling manage clients and connectors at runtime.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Keycloak | A full IAM platform: it owns a user database, admin console, and role management. Dex is a thin delegating provider with no user store. |
| Zitadel | A product-oriented, multi-tenant IdP with auditing and self-service. Dex is a smaller building block meant to be embedded. |
| Ory Hydra | Also a focused OAuth2/OIDC server, but Hydra pushes login and user management to a separate app you build; Dex's selling point is built-in connectors that delegate to existing upstreams. |
| Authelia | A reverse-proxy forward-auth gate with its own login and 2FA; it grew OIDC provider support later. Dex started as an OIDC provider and does not do proxy-level gating. |

Pick Dex when you want a small provider that federates to a directory or OAuth2 upstream and issues Kubernetes-consumable tokens, especially embedded in another product. Pick Keycloak or Zitadel when you need to be the system of record for users, with registration, roles, and an admin UI.

One trade-off to weigh: the README marks the SAML 2.0 connector as unmaintained and likely vulnerable to authentication bypasses (discussion [#1884](https://github.com/dexidp/dex/discussions/1884)). If your only upstream is SAML, account for that before choosing Dex.

## Sources

- [Dex ADOPTERS file](https://github.com/dexidp/dex/blob/master/ADOPTERS.md)
- [Dex README](https://github.com/dexidp/dex/blob/17a54e9046cee1142530de4d0a809809d7c9cee9/README.md)
- [Dex documentation](https://dexidp.io/docs/)
