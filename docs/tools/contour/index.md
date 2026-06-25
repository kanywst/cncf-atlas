# Contour

> Contour is a Kubernetes ingress controller that programs Envoy as its data plane, translating Ingress, its own HTTPProxy CRD, and Gateway API objects into live Envoy configuration over xDS.

- **Category**: API Gateway
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [projectcontour/contour](https://github.com/projectcontour/contour)
- **Documented at commit**: `8f970f0` (2026-06-24, `main`, ahead of `v1.33.5`)

## What it is

Contour is a control plane for Envoy. It watches the Kubernetes API for routing objects, compiles them into an internal directed acyclic graph (DAG), and serves the result to one or more Envoy instances over gRPC using the xDS protocol. Envoy does the actual proxying of HTTP and HTTPS traffic; Contour decides what Envoy's configuration should be.

It accepts three configuration surfaces: the standard Kubernetes `Ingress`, Contour's own `HTTPProxy` custom resource, and the Gateway API. `HTTPProxy` exists because the standard Ingress object could not express TLS delegation, multi-team safe inclusion, or richer routing without vendor annotations.

Contour runs as a Deployment, while Envoy runs alongside it (commonly as a DaemonSet) behind a `LoadBalancer` Service. Because configuration is pushed dynamically over xDS, route and cluster changes do not require restarting or reloading Envoy.

## When to use it

- You want an Envoy-based ingress with dynamic configuration and no reload or restart on route changes.
- You need multi-team ingress where namespaces delegate routes safely, which `HTTPProxy` inclusion provides.
- You want a focused ingress controller rather than a full service mesh.
- It is a weaker fit if you only need basic single-team ingress and already run `ingress-nginx`, or if you need the broad L7 feature set and mesh integration of Istio.

## In this deep-dive

- [History](./history): origin at Heptio, the move to VMware, and donation to CNCF.
- [Architecture](./architecture): the DAG, the xDS caches, and how a change reaches Envoy.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. projectcontour/contour repository: <https://github.com/projectcontour/contour>
2. Pinned commit `8f970f0`: <https://github.com/projectcontour/contour/commit/8f970f082e645bf0be5119c376ac4f4d40a19acd>
3. Contour official site: <https://projectcontour.io/>
4. Getting Started: <https://projectcontour.io/getting-started/>
5. Contour Adopters: <https://projectcontour.io/resources/adopters/>
6. TOC accepts Contour as Incubating project (CNCF): <https://www.cncf.io/blog/2020/07/07/toc-accepts-contour-as-incubating-project/>
7. Donate Contour to CNCF (cncf/toc PR #330): <https://github.com/cncf/toc/pull/330>
8. cncf/foundation project-maintainers.csv: <https://github.com/cncf/foundation/blob/main/project-maintainers.csv>
9. Documentation (Ingress / HTTPProxy / Gateway API): <https://projectcontour.io/docs/main/>
