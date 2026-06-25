# OpenCost

> A vendor-neutral CNCF specification and engine for real-time Kubernetes and cloud cost allocation.

- **Category**: Observability
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [opencost/opencost](https://github.com/opencost/opencost)
- **Documented at commit**: `4d117aa` (develop, 2026-06-19)

## What it is

OpenCost measures and allocates the cost of running workloads on Kubernetes. It runs inside the cluster, reads usage metrics from Prometheus, multiplies them by cloud provider pricing, and splits the result down to the namespace, pod, and controller level. It also pulls cloud billing data through a separate pipeline so out-of-cluster spend lands in the same model.

The project is two things at once: a written specification for how Kubernetes cost monitoring should work, and a reference implementation of that specification. The specification was drafted with Adobe, AWS, Google, Microsoft, New Relic, SUSE, Mindcurv, D2iQ, and Armory. The implementation is the cost allocation engine that also powers the commercial Kubecost product.

It sits in the observability layer next to Prometheus. OpenCost is a Prometheus consumer (it queries metrics) and a Prometheus producer (it exports its own cost metrics on `/metrics`), so it slots into an existing monitoring stack rather than replacing it.

## When to use it

- You run workloads on Kubernetes and need per-namespace, per-pod, or per-controller cost breakdowns, not just a cloud bill at the account level.
- You want idle and shared costs attributed back to teams instead of left as an unexplained gap.
- You already run Prometheus and want cost data in the same place as the rest of your telemetry.
- You want a vendor-neutral, self-hosted, open-source baseline before committing to a commercial FinOps product.

It is a weaker fit when you only need account-level cloud billing with no in-cluster breakdown, where a cloud provider's native cost tool is simpler. It is also a weaker fit when you need multi-cluster aggregation, long-term retention, SSO, and alerting out of the box, which is where the commercial Kubecost upgrade or another FinOps platform fits.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [OpenCost Advances to CNCF Incubation (official blog)](https://opencost.io/blog/cncf-incubation/)
2. [Apptio: Celebrating OpenCost's Journey to CNCF Incubation](https://www.apptio.com/blog/opencost-cncf-incubation/)
3. [CNCF: OpenCost, a new CNCF Sandbox Project (2022-12-06)](https://www.cncf.io/blog/2022/12/06/opencost-a-new-cncf-sandbox-project-for-real-time-kubernetes-cost-monitoring/)
4. [CNCF: OpenCost advances to the CNCF Incubator (2024-10-31)](https://www.cncf.io/blog/2024/10/31/opencost-advances-to-the-cncf-incubator/)
5. [CNCF Projects: OpenCost](https://www.cncf.io/projects/opencost/)
6. [Introducing OpenCost (official blog)](https://opencost.io/blog/introducing-opencost/)
7. [GitHub: opencost/opencost](https://github.com/opencost/opencost)
8. [ADOPTERS.MD at commit 4d117aa](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD)
9. [Grafana Labs: How Grafana Labs uses and contributes to OpenCost](https://grafana.com/blog/2023/02/02/how-grafana-labs-uses-and-contributes-to-opencost-the-open-source-project-for-real-time-cost-monitoring-in-kubernetes/)
10. [OpenCost README at commit 4d117aa](https://github.com/opencost/opencost/blob/develop/README.md)
11. [OpenCost Documentation](https://www.opencost.io/docs/)
