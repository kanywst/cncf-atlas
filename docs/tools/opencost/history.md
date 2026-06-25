# History

## Origin

OpenCost grew out of the cost allocation engine that Kubecost built. The repository itself dates back to 2019-03-27, when it was Kubecost's `cost-model` repo. In 2022 the engine was carved out and re-launched as a vendor-neutral open standard: the "OpenCost Specification" plus a reference implementation. The specification was drafted with a group of companies including Adobe, AWS, Google, Microsoft, New Relic, SUSE, Mindcurv, D2iQ, and Armory, so that Kubernetes cost monitoring would not depend on any single vendor's definition. The problem it set out to solve was concrete: a cloud bill tells you what an account spent, but not what a namespace, a team, or a single pod cost.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Repository created (2019-03-27) as Kubecost's `cost-model` |
| 2022 | OpenCost announced as an open specification and engine; accepted into the CNCF Sandbox (2022-06-17) |
| 2024 | Kubecost acquired by IBM; OpenCost advances to CNCF Incubating (2024-10-25, announced at KubeCon NA) |

## How it evolved

During the Sandbox period the scope widened beyond in-cluster allocation. Plugins were added to ingest external costs from sources such as Datadog, OpenAI, and MongoDB Atlas. Carbon cost monitoring and OCI support followed. The data-source layer was also abstracted so Prometheus is no longer the only backend: a `collector-source` module can stand in its place.

The governance picture changed in 2024. Kubecost was acquired by IBM and folded into the IBM FinOps Suite alongside Cloudability and Turbonomic. OpenCost stayed in CNCF and is now maintained by a community spanning IBM Kubecost, Randoli, and the cloud providers. The relationship between the two is unchanged in substance: Kubecost's commercial allocation model still rests on the OpenCost engine, and OpenCost remains the specification-plus-core-engine layer underneath it.

## Where it stands now

OpenCost is a CNCF Incubating project. The latest stable release at the documented commit is `v2.5.3`, with `v2.6.0-rc.0` and later work landing on the `develop` branch. The codebase is a Go workspace split into several modules (`github.com/opencost/opencost`, `/core`, and the `prometheus-source` and `collector-source` modules), with the UI and Helm chart maintained in separate repositories. The project's stated direction stays anchored to the OpenCost Specification: a vendor-neutral, self-hostable definition of Kubernetes cost monitoring that the engine implements.
