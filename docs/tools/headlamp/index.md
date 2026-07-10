# Headlamp

> Headlamp is an extensible web and desktop UI for Kubernetes that reaches every cluster API through its own backend proxy and lets plugins add pages at runtime.

- **Category**: Developer Tools
- **CNCF maturity**: Sandbox (accepted 2023-05-17); also a Kubernetes SIG UI subproject since 2025
- **Language**: Go (backend) and TypeScript/React (frontend)
- **License**: Apache-2.0
- **Repository**: [kubernetes-sigs/headlamp](https://github.com/kubernetes-sigs/headlamp)
- **Documented at commit**: `dab1a6c5` (tag `v0.43.0`, 2026-07-06)

## What it is

Headlamp is a graphical interface for operating Kubernetes clusters. It lists and inspects the usual resources (Pods, Deployments, Services, and the rest), edits them, and drives cluster actions such as scaling, log viewing, and port-forwarding. It runs two ways from the same code: a browser app served by a Go backend, and a desktop app that wraps the same backend and frontend in Electron for Linux, macOS, and Windows.

The frontend never talks to a Kubernetes API server directly. Every request goes through the Go backend, which holds the kubeconfig contexts, injects the bearer token, and reverse-proxies to the target cluster. That indirection is what lets one Headlamp instance manage several clusters, keep tokens out of the browser, and avoid CORS entirely. Authorization is left to the cluster: Headlamp proxies the call and the kube-apiserver decides whether it is allowed.

The other defining trait is the plugin system. The frontend loads plugin JavaScript at runtime and hands each plugin a registry through which it can add sidebar entries, routes, and detail-view sections. Vendors use this to ship their own product UI on top of Headlamp rather than forking it. Headlamp sits in the same shelf as Kubernetes Dashboard, Lens, and k9s: a cluster-operations UI rather than a metrics or tracing tool.

## When to use it

- You want a web or desktop UI that manages multiple clusters from one place, with tokens held server-side rather than in the browser.
- You need to extend the UI for your own platform (custom resources, product-specific views) without forking, and a runtime plugin API fits that.
- You want an Apache-2.0 tool that runs both in-cluster (served to a browser) and as a local desktop app from the same codebase.
- Not the right fit if you want a terminal-first, keyboard-driven navigator; k9s covers that ground better.
- Not an observability platform: it shows cluster state and can surface metrics, but it does not store or query time-series data the way Prometheus or Grafana do.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a request flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [kubernetes-sigs/headlamp (GitHub)](https://github.com/kubernetes-sigs/headlamp) (accessed 2026-07-08)
2. [Headlamp ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) (accessed 2026-07-08)
3. [Headlamp README.md NOTICE (Kubernetes SIG UI move)](https://github.com/kubernetes-sigs/headlamp/blob/main/README.md) (accessed 2026-07-08)
4. [Headlamp project page (CNCF)](https://www.cncf.io/projects/headlamp/) (accessed 2026-07-10)
5. [\[Sandbox\] Headlamp, cncf/sandbox Issue #25](https://github.com/cncf/sandbox/issues/25) (accessed 2026-07-10)
6. [Headlamp now in the CNCF Sandbox (Headlamp blog, 2023-10-12)](https://headlamp.dev/blog/2023/10/12/cncf-sandbox/) (accessed 2026-07-10)
7. [Microsoft acquires Kinvolk (Azure blog, 2021-04-29)](https://azure.microsoft.com/en-us/blog/microsoft-acquires-kinvolk-to-accelerate-containeroptimized-innovation/) (accessed 2026-07-10)
8. [Headlamp Project to Provide GUI for Kubernetes (Cloud Native Now, KubeCon EU 2025)](https://cloudnativenow.com/kubecon-cloudnativecon-europe-2025/headlamp-project-to-provide-graphical-user-interface-for-kubernetes/) (accessed 2026-07-10)
9. [Headlamp documentation site](https://headlamp.dev/) (accessed 2026-07-10)
10. [Headlamp plugin functionality docs](https://headlamp.dev/docs/latest/development/plugins/functionality/) (accessed 2026-07-10)
11. [GitHub REST API repos/kubernetes-sigs/headlamp](https://api.github.com/repos/kubernetes-sigs/headlamp) (accessed 2026-07-08)
12. [Headlamp: A multicluster management UI for Kubernetes (InfoWorld)](https://www.infoworld.com/article/3964051/headlamp-a-multicluster-kubernetes-user-interface.html) (accessed 2026-07-10)
