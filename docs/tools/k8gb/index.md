# k8gb

> Global load balancing across Kubernetes clusters, built out of DNS delegation and CoreDNS instead of an appliance or a control plane.

- **Category**: Service Mesh & Networking
- **CNCF maturity**: Incubating (sandbox 2021-03-30, incubating 2026-07-18)
- **Language**: Go 1.26.5
- **License**: Apache-2.0
- **Repository**: `k8gb-io/k8gb`
- **Documented at commit**: `34b4535c` (2026-09-03, four commits past `v1.0.0`)

## What it is

Inside one Kubernetes cluster, splitting traffic across pods is what Services and Ingresses do. Across clusters it is a different problem: you have the same application running in Frankfurt and in Virginia, one public hostname, and you need clients to reach a healthy cluster, preferably a close one, and to stop reaching one that has failed. That job is called Global Server Load Balancing, and it has traditionally belonged to appliances from F5 or Infoblox, or to a cloud provider's own DNS routing.

k8gb does it with a Kubernetes operator and DNS. You install it in each cluster, delegate a DNS zone to the CoreDNS instances those clusters run, and then describe what you want with a single custom resource:

```yaml
apiVersion: k8gb.io/v1beta1
kind: Gslb
metadata:
  name: test-gslb-failover
  namespace: test-gslb
spec:
  resourceRef:
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    name: test-gslb-failover
  strategy:
    type: failover
    primaryGeoTag: eu-west-1
```

Each cluster's operator watches its own applications, publishes the healthy endpoints it can see as DNS records, and learns what the other clusters have by querying them over DNS. There is no central controller, no cluster-to-cluster API access, and no shared datastore. The design consequence is covered in [Internals](./internals): DNS is both how traffic is steered and how the clusters share state.

The project was created inside the South African bank Absa and first ran in production across regional data centres (`ADOPTERS.md`).

## When to use it

- You run the same application in more than one Kubernetes cluster and want one hostname in front of them, with automatic failover.
- Your clusters span providers or span cloud and on-premises, so a single cloud provider's DNS routing does not cover all of them.
- You want the global traffic policy to be a Kubernetes object under the same review and RBAC as everything else, rather than a configuration in a separate appliance.
- You cannot or do not want to connect clusters at the network layer. k8gb asks only that a DNS zone be delegated to them.

Where it is the wrong choice:

- Everything is in one cloud. Route 53 latency and failover routing, Azure Traffic Manager, or Google Cloud Load Balancing will be less to operate.
- You need per-request steering. DNS decides at resolution time, and clients and resolvers cache. The `dnsTtlSeconds` field in the `Gslb` strategy is the only lever, and low TTLs are respected unevenly in the wild.
- You need IPv6. k8gb publishes A records only, and rejects IPv6 explicitly (`controllers/resolver/config.go:59`).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [K8gb becomes a CNCF incubating project](https://www.cncf.io/announcements/2026/08/05/k8gb-becomes-a-cncf-incubating-project/), CNCF, 2026-08-05.
2. [cncf/landscape `landscape.yml`](https://github.com/cncf/landscape/blob/master/landscape.yml), for the sandbox and incubating dates.
3. [Millennium bcp case study](https://www.cncf.io/case-studies/millennium-bcp/), CNCF.
4. [k8gb project page](https://www.cncf.io/projects/k8gb/), CNCF.
5. [k8gb documentation](https://www.k8gb.io/), k8gb.io.
6. [k8gb DevStats](https://k8gb.devstats.cncf.io/), CNCF.
7. [CLOMonitor: K8GB](https://clomonitor.io/projects/cncf/k8gb), CNCF.
