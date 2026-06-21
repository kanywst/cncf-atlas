# Getting Started

> Based on the official get-started guide. Authelia requires HTTPS even for a test setup.

## Prerequisites

- A reverse proxy that supports forward authentication (Traefik, NGINX, Caddy, or Envoy).
- A way to serve HTTPS, since Authelia refuses to operate over plain HTTP.

## Install

Authelia ships as a container image, a Helm chart for Kubernetes, and a standalone binary. The container image is the common path:

```bash
docker pull authelia/authelia
```

## A first working setup

A minimum configuration covers four areas in `configuration.yml`. The official repository ships a `config.template.yml` as a starting point.

1. **Authentication backend.** Either a YAML file users database (simplest for testing) or LDAP for a real directory.
2. **Storage.** SQLite for testing, or MySQL or PostgreSQL for production.
3. **Session.** A session secret and the single sign-on domain or domains. Redis is recommended for production and for high availability.
4. **Notifier.** A filesystem notifier for testing, or SMTP for production, used to send verification and reset messages.

You then point your reverse proxy at Authelia's authorization endpoint so that protected routes issue a forward-auth subrequest, and you write a starting access-control policy that says which domains require one factor, two factors, or are denied.

## Verify it works

Visit a protected application through the proxy. An unauthenticated request should redirect to the Authelia portal. After you log in and complete the second factor, the same request should reach the application, and the application should receive the `Remote-User` and `Remote-Groups` headers that Authelia adds on success.

## Where to go next

For production concerns such as high availability with Redis, LDAP integration, the OpenID Connect provider, and tuning the access-control rules, follow the official documentation rather than re-deriving them here.

## Sources

- [Authelia get-started guide](https://www.authelia.com/integration/prologue/get-started/)
- [Proxy integration support matrix](https://www.authelia.com/integration/proxies/support/)
