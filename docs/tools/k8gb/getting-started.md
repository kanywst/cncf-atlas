# Getting Started

> Commands follow `README.md` and `docs/local.md` at commit `34b4535c`.

Global load balancing needs at least two clusters and a delegated DNS zone, so there is no single-command install that demonstrates anything. The project solves this with a local playground: three k3s clusters in Docker, one acting as the parent DNS, two running k8gb. That is the fastest way to see the mechanism from [Internals](./internals) actually work, so it is what this page uses.

## Prerequisites

From `docs/local.md`:

- `kubectl`
- Helm 3
- `k3d`, version 5.3.0 or newer, and a working Docker
- Go and `make`, to run the repository's targets

## Install

Clone the repository and bring up the playground:

```bash
git clone https://github.com/k8gb-io/k8gb
cd k8gb
make deploy-full-local-setup
```

This creates three k3d clusters. `k3d-edgedns` runs BIND and holds the parent zone that delegates to the other two. `k3d-test-gslb1` and `k3d-test-gslb2` each run k8gb, a CoreDNS exposed for UDP DNS on ports 5053 and 5054 respectively, a test application, and sample `Gslb` resources.

For a real deployment the operator is a Helm chart instead:

```bash
helm install k8gb oci://ghcr.io/k8gb-io/charts/k8gb --version <version>
```

That path also requires exposing each cluster's CoreDNS for external DNS traffic and delegating a zone to those addresses, which is the part the playground has already done for you. `docs/exposing_dns.md` and the provider pages under `docs/deploy_*.md` cover it.

## A first working setup

The playground ships with `Gslb` resources already applied, so the interesting work is observing rather than creating.

1. Confirm all three clusters came up.

```bash
kubectl cluster-info --context k3d-edgedns \
  && kubectl cluster-info --context k3d-test-gslb1 \
  && kubectl cluster-info --context k3d-test-gslb2
```

1. Ask the parent DNS for the round robin hostname. This is the query a real client would make.

```bash
dig @localhost -p 1053 roundrobin.cloud.example.com +short +tcp
```

You should get A records from both clusters, one per node, in an order that varies. `docs/local.md` shows this output for the default setup:

```text
172.20.0.2
172.20.0.5
172.20.0.4
172.20.0.6
```

1. Check those addresses against the actual cluster nodes.

```bash
for c in k3d-test-gslb{1,2}; do
  kubectl get no --context "$c" \
    -o custom-columns="NAME:.metadata.name,IP:status.addresses[0].address"
done
```

The IPs in the DNS answer should be exactly the node IPs across both clusters. One hostname, endpoints from two independent clusters, and no component that knows about both.

## Verify it works

To see the cross-cluster mechanism rather than only its result, query the internal record that clusters publish for each other, described in [Internals](./internals):

```bash
dig @localhost -p 5053 localtargets-roundrobin.cloud.example.com +short +tcp
dig @localhost -p 5054 localtargets-roundrobin.cloud.example.com +short +tcp
```

Each cluster's CoreDNS answers with only its own healthy endpoints. That is the record the peer operator fetches on every reconcile, and putting the two answers side by side shows why the public record contains both sets.

To see the operator's own view:

```bash
kubectl get gslb --context k3d-test-gslb1 -n test-gslb -o wide
kubectl get dnsendpoint --context k3d-test-gslb1 -n test-gslb
```

The `Gslb` status carries the hosts, the health it computed, and the targets it settled on. The `DNSEndpoint` is the object CoreDNS is serving from.

To watch a failover, scale the test application to zero in one cluster and re-run the `dig` from step 2. The addresses belonging to that cluster should disappear once the records expire.

## Where to go next

The playground avoids the two things a real deployment has to solve: exposing CoreDNS so other clusters and resolvers can reach it (`docs/exposing_dns.md`), and delegating a zone from a DNS provider you actually run (`docs/deploy_route53.md` and its siblings). Strategy choice, geo tags, and split brain handling are covered in the [project documentation](https://www.k8gb.io/). Use the `k8gb.io/v1beta1` API group for anything new; `k8gb.absa.oss/v1beta1` still works but is the legacy group being migrated away from, as described in [History](./history).
