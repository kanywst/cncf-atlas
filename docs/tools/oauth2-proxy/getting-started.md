# Getting Started

> Verified against `v7.15.3`. Commands assume a Unix shell and a registered OAuth application at your identity provider.

## Prerequisites

- An OAuth2 / OIDC application registered with a provider (Google, GitHub, an OIDC issuer, etc.), giving you a client ID and client secret.
- A redirect URL registered with that provider that ends in `/oauth2/callback` (the callback path is fixed at `oauthproxy.go:53`).
- An upstream service to protect, reachable over HTTP.

## Install

Pick one. A prebuilt binary or container image is the quickest (source 7).

```bash
# Go install
go install github.com/oauth2-proxy/oauth2-proxy/v7@latest

# or Docker
docker pull quay.io/oauth2-proxy/oauth2-proxy:latest
```

## A first working setup

1. Generate a cookie secret. It must decode to 16, 24, or 32 bytes, or startup validation rejects it (`pkg/validation/cookie.go:64-67`).

```bash
openssl rand -base64 32 | tr -- '+/' '-_'
```

1. Run the proxy in front of your upstream. Replace the client credentials, the upstream URL, and the cookie secret from step 1.

```bash
oauth2-proxy \
  --provider=github \
  --client-id=YOUR_CLIENT_ID \
  --client-secret=YOUR_CLIENT_SECRET \
  --redirect-url=https://your.host/oauth2/callback \
  --cookie-secret=GENERATED_SECRET \
  --email-domain=* \
  --upstream=http://127.0.0.1:8080/ \
  --http-address=0.0.0.0:4180
```

1. The flags map directly to behaviour: `--upstream` is the service the proxy forwards authenticated requests to, `--redirect-url` must match the provider registration, and `--email-domain=*` sets the access boundary to "any authenticated email" (tighten it to a domain, or use `--authenticated-emails-file`, in production). The email check is enforced by the validator in `validator.go:107`.

## Verify it works

- Open `http://localhost:4180/` in a browser. The proxy should redirect you to the provider's login, then back through `/oauth2/callback`, then to your upstream.
- For a subrequest gate (nginx `auth_request`), call `GET /oauth2/auth`: an authenticated session returns `202 Accepted`, an unauthenticated one returns `401` (`oauthproxy.go:1018-1036`).
- On startup the log records the chosen provider and, if you set `--authenticated-emails-file`, a line confirming it is in use (`validator.go:30`).

## Where to go next

- For production hardening, server-side sessions (Redis), and TLS, see the official documentation (source 6) and installation guide (source 7).
- For nginx, Traefik, and Kubernetes integration patterns, the integration section of the official docs covers `auth_request`, `forwardAuth`, and the Helm chart.
