# Adoption & Ecosystem

## Who uses it

The project lists organisations running it in production in its `ADOPTERS.md` file. The CNCF incubation announcement names a subset of these as production users.

| Organisation | Use case | Source |
| --- | --- | --- |
| Capital One | Origin; cloud governance in production | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Intuit | Production cloud governance | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| JP Morgan Chase & Co | Production cloud governance | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Siemens | Production cloud governance | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| HBO Max | Production cloud governance | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Databricks | Production cloud governance | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| CyberArk | Production cloud governance | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Zapier | Production cloud governance | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Premise Data | Production cloud governance | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |

The full `ADOPTERS.md` list also names Avalara, Code 42, Grupo, and Sage. The CNCF announcement separately cites Capital One, Code 42, HBO Max, Intuit, JP Morgan Chase & Co, Siemens, Premise Data, and Zapier as production users ([CNCF blog, 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/)). No adopters beyond these cited sources are claimed here.

## Adoption signals

- GitHub, observed 2026-06-24: 6,014 stars, 1,625 forks, around 418 contributors, repository created 2016-03-01 ([GitHub REST API](https://api.github.com/repos/cloud-custodian/cloud-custodian)).
- At CNCF incubation in 2022 the project reported 350+ contributors, 130+ contributing organisations, and over 150M downloads ([CNCF blog, 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/)).
- Distribution: published on PyPI as `c7n` and as a container image `cloudcustodian/c7n` on Docker Hub ([PyPI](https://pypi.org/project/c7n/), [Docker Hub](https://hub.docker.com/r/cloudcustodian/c7n)).

## Ecosystem

The repository ships companion tools under `tools/`:

- `c7n_mailer`: sends notifications, typically over SQS, for policy results.
- `c7n_org`: runs policies across many AWS accounts, Azure subscriptions, or GCP projects.
- `c7n_left`: shift-left scanning of infrastructure as code, with `c7n_terraform` for Terraform.
- `c7n_kube`: Kubernetes admission control.
- `c7n_awscc`: resource coverage through the AWS Cloud Control API.
- Provider packages: `c7n_azure`, `c7n_gcp`, `c7n_oci`, `c7n_tencentcloud`, `c7n_openstack`.

The standard production pattern combines the serverless modes with AWS Lambda and CloudWatch Events or AWS Config for continuous enforcement ([README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md)).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| OPA Gatekeeper / Kyverno | Policy as code for Kubernetes admission; sits at the API server rather than governing cloud provider resources |
| Prowler / ScoutSuite / Steampipe | Security assessment and query focused; detection without the built-in remediation actions and event-driven enforcement c7n pairs with detection |
| AWS Config Rules / Azure Policy | Native to one cloud; c7n spans AWS, Azure, and GCP through one DSL |

Cloud Custodian fits when you need detection and remediation of cloud provider resources in one declarative language across more than one cloud. A Kubernetes-admission engine fits better when the policy boundary is the cluster API; a read-only scanner fits better when you only need posture reporting.
