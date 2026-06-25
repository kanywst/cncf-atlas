# Cloud Custodian

> A YAML policy engine that queries cloud resources, filters them, and runs actions such as tagging, stopping, or deleting, so governance rules live as code instead of ad hoc scripts.

- **Category**: Security & Compliance
- **CNCF maturity**: Incubating
- **Language**: Python
- **License**: Apache-2.0
- **Repository**: [cloud-custodian/cloud-custodian](https://github.com/cloud-custodian/cloud-custodian)
- **Documented at commit**: `3d8a562` (0.9.51 line, 2026-06-22)

## What it is

Cloud Custodian (the package and CLI are named `c7n`) is a rules engine for cloud governance. You write policies in YAML. Each policy names a `resource` type, a list of `filters` that narrow the set, and a list of `actions` to run on what is left. The CLI command `custodian run` evaluates the policies against a cloud account and writes a report of what matched.

A policy can run in two broad ways. The default `pull` mode queries the provider API on demand, applies filters, and acts on the results. Serverless modes deploy the policy as an AWS Lambda function triggered by CloudTrail events, a schedule, or AWS Config, so a rule enforces itself continuously rather than only when you run it. The same DSL covers detection and remediation in one file.

It started on AWS and remains AWS-first, with around 120 resource files under `c7n/resources/`. Separate provider packages under `tools/` add Azure, GCP, Oracle Cloud, Tencent Cloud, Kubernetes admission, and IaC scanning, alongside helpers for notifications (`c7n_mailer`) and multi-account runs (`c7n_org`).

## When to use it

- You want one declarative language to find and remediate cloud resources across AWS, Azure, and GCP rather than per-cloud scripts.
- You need continuous enforcement: stop untagged instances, delete public snapshots, or enforce off-hours shutdown on a schedule or in response to events.
- You want detection and action in the same tool, not a scanner that only reports findings.
- It is a weaker fit when your governance is Kubernetes admission control, where Kyverno or OPA Gatekeeper sit closer to the API server.
- It is a weaker fit when you only need posture assessment and reporting, where a read-only scanner is simpler.

## In this deep-dive

- [History](./history): origin at Capital One, CNCF Sandbox, and incubation.
- [Architecture](./architecture): the registry-driven DSL and how a `pull` run flows.
- [Adoption & Ecosystem](./adoption): cited adopters, GitHub signals, and the surrounding tools.
- [Internals](./internals): the policy, registry, and query types, read from source.
- [Getting Started](./getting-started): install `c7n` and run a first policy against EC2.

## Sources

1. [cloud-custodian/cloud-custodian on GitHub](https://github.com/cloud-custodian/cloud-custodian) (2026-06-24)
2. [Cloud Custodian becomes a CNCF incubating project](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/) (2026-06-24)
3. [Cloud Custodian - CNCF project](https://www.cncf.io/projects/cloud-custodian/) (2026-06-24)
4. [c7n on PyPI](https://pypi.org/project/c7n/) (2026-06-24)
5. [cloudcustodian/c7n on Docker Hub](https://hub.docker.com/r/cloudcustodian/c7n) (2026-06-24)
6. [Cloud Custodian ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) (2026-06-24)
7. [Cloud Custodian GOVERNANCE.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/GOVERNANCE.md) (2026-06-24)
8. [Cloud Custodian README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md) (2026-06-24)
9. [Cloud Custodian docs](https://cloudcustodian.io/) (2026-06-24)
10. [GitHub REST API repos/cloud-custodian/cloud-custodian](https://api.github.com/repos/cloud-custodian/cloud-custodian) (2026-06-24)
