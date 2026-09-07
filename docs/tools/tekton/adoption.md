# Adoption & Ecosystem

## Who uses it

Tekton has no `ADOPTERS` file in the repository. The names below come from the project's CNCF incubation application and the CNCF's announcement of its acceptance. The application also lists Apple, marked as needing confirmation, so it is left out here.

| Organisation | Use case | Source |
| --- | --- | --- |
| Google | Listed adopter; original donor of the project | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Red Hat | Listed adopter; ships OpenShift Pipelines on Tekton | [CNCF, 2026-03-24](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/) |
| IBM | Listed adopter; ships IBM Cloud Continuous Delivery on Tekton | [CNCF, 2026-03-24](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/) |
| CloudBees | Listed adopter | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Nubank | Listed adopter | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Marriott Vacations Worldwide | Listed adopter | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| OneStock | Listed adopter | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| SolarWinds | Listed adopter | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Ozone | Listed adopter | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Kaiju.ci | Listed adopter | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Puppet | Named in the CNCF acceptance announcement | [CNCF, 2026-03-24](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/) |
| Ford Motor Company | Named in the CNCF acceptance announcement | [CNCF, 2026-03-24](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/) |

Several of the largest names are vendors shipping Tekton inside a product rather than end users running it directly. Red Hat OpenShift Pipelines and IBM Cloud Continuous Delivery both mean a Tekton install that most of their users never see as Tekton.

## Adoption signals

From the CNCF announcement, observed 2026-03-24 ([CNCF](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/)): over 11,000 GitHub stars, over 5,000 pull requests, over 2,500 issues, and over 600 contributors across the project's history.

From the [incubation application](https://github.com/cncf/toc/issues/1310): more than 60 contributors made at least 10 contributions in the preceding six months, and Artifact Hub carries over 350 Tekton tasks. Maintainer counts by component are Pipelines 13, Results 11, Triggers 5, Chains 5, CLI 5, Operator 5, and Dashboard 4. A single-component project would be riskier; the spread across seven components with five or more maintainers each is what an incubation review looks for.

Release cadence is monthly with four long-term support releases a year, in January, April, July, and October (`releases.md`). Ongoing activity is published at [Tekton DevStats](https://tekton.devstats.cncf.io/).

## Ecosystem

The Tekton family, all separate controllers reading the same CRDs:

- **Triggers**: receives webhooks and other events and creates `PipelineRun` objects from them. Without it, something outside the cluster has to create runs.
- **Chains**: watches completed runs, signs the artifacts they produced with Sigstore, and emits SLSA provenance. Tekton uses it to sign its own release images (`releases.md`).
- **Results**: archives completed runs so history outlives etcd retention.
- **CLI (`tkn`)**, **Dashboard**, **Operator**, **Hub**: the human-facing and installation surfaces.

Integrations the project itself names: Argo CD for GitOps, SPIFFE/SPIRE for workload identity, Sigstore through Chains, CloudEvents, OpenTelemetry and Prometheus for metrics and tracing, Helm through the Operator, and Artifact Hub for the task catalogue. The repository carries `pkg/spire/` and `pkg/tracing/` for the first and the fifth of those.

Commercial distributions: Red Hat OpenShift Pipelines and IBM Cloud Continuous Delivery ([CNCF](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/)). Red Hat's Pipelines as Code is a developer-facing layer that sits on top of Tekton.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Argo Workflows | Also Kubernetes-native, also a DAG in CRDs. Argo is a general workflow engine that CI/CD is one use of; Tekton's API is shaped around CI/CD nouns. In practice teams often run Argo Workflows for data pipelines and Tekton or Argo CD for delivery |
| GitHub Actions, GitLab CI | A hosted product with a UI, a marketplace, and no control plane to run. You give up portability across clusters and the ability to treat pipelines as Kubernetes objects |
| Jenkins, Jenkins X | The incumbent, and a CDF sibling. Jenkins X adopted Tekton as its execution engine, which says something about where the two sit relative to each other |
| Dagger | Pipelines written as code in a general-purpose language, executed in containers, not as Kubernetes custom resources. Better local reproduction, no cluster-native RBAC or audit story |
| Concourse | Container-based and declarative, but with its own scheduler and its own resource model rather than Kubernetes CRDs |

The real question is whether you want CI/CD expressed as Kubernetes objects. If yes, the shortlist is Tekton and Argo Workflows, and the choice comes down to whether the CI/CD-shaped API helps or gets in the way. If no, a hosted product is almost always less work.
