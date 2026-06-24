# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS` file, so the named users below come from published Kubernetes case studies.

| Organisation | Use case | Source |
| --- | --- | --- |
| Spotify | Migrated from its in-house orchestrator Helios to Kubernetes; bin-packing and multi-tenancy raised average CPU utilization 2 to 3 times, and its largest service handles over 10 million requests per second | [Kubernetes case study: Spotify](https://kubernetes.io/case-studies/spotify/) |
| adidas | Moved 100% of its e-commerce site to Kubernetes in 6 months, halving load time and going from a release every 4 to 6 weeks to 3 to 4 per day; runs 4,000 pods on 200 nodes with 80,000 builds per month | [Kubernetes case study: adidas](https://kubernetes.io/case-studies/adidas/) |

## Adoption signals

Measured on 2026-06-22 from the GitHub API: 123,184 stars and 43,267 forks for `kubernetes/kubernetes`. CNCF-cited material puts the contributor count at 8,012, a growth of about 996% since 2016 ([IBM: History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history)). Releases follow a regular minor cadence; the latest stable at the pinned commit is `v1.36.2` (2026-06-12).

## Ecosystem

Kubernetes is the base of a large stack rather than a standalone tool. Container runtimes plug in through the CRI (containerd, CRI-O). Networking uses CNI plugins (Cilium, Calico). Storage uses CSI drivers. The scheduler is extended through framework plugins or extenders. Monitoring commonly uses Prometheus, and application packaging uses Helm. adidas, for example, built its cloud native platform on Kubernetes plus Prometheus ([Kubernetes case study: adidas](https://kubernetes.io/case-studies/adidas/)). Distributions and managed offerings include GKE, EKS, AKS, OpenShift, Rancher, and k3s.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Docker Swarm | Simpler to set up but a far smaller feature set and ecosystem; no declarative controller model of comparable depth |
| HashiCorp Nomad | A lighter scheduler that also runs non-container workloads; fewer built-in primitives and a smaller ecosystem |
| Apache Mesos / Marathon | A two-level scheduler aimed at mixed datacenter workloads; less focused on the container-native, CRD-driven model |

The distinction that matters is the declarative API plus controller reconcile model, pluggable extension through CRDs and interfaces, and the size of the surrounding ecosystem. Pick Kubernetes when you want that model and portability. Pick a lighter alternative when the operational cost of Kubernetes outweighs what you need.
