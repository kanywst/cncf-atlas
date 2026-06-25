# History

## Origin

Cloud Custodian was created in 2016 inside Capital One by Kapil Thangavelu. The bank was moving onto public cloud and had accumulated a sprawl of ad hoc scripts for tagging, cleanup, and compliance checks. The goal was to fold those scripts into a single lightweight and flexible tool with consistent metrics and reporting ([CNCF blog, 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/)). The GitHub repository was created on 2016-03-01 ([GitHub REST API](https://api.github.com/repos/cloud-custodian/cloud-custodian)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Created at Capital One by Kapil Thangavelu; repository opened 2016-03-01 |
| 2020 | Accepted into the CNCF Sandbox on 2020-06-25, contributed by Capital One |
| 2022 | Promoted to CNCF Incubating on 2022-09-14 by TOC vote |
| 2026 | Release line `0.9.51` (`0.9.51.0` published 2026-05-28) |

## How it evolved

The tool began as AWS-only and grew into a multi-cloud engine. Provider support for Azure, GCP, and others lives in separate packages under `tools/` rather than in the core, so the `c7n` core stays cloud-agnostic and each provider ships on its own. The same pattern produced satellite tools: `c7n_mailer` for notifications, `c7n_org` for multi-account runs, and `c7n_left` for scanning infrastructure as code before it is applied ([README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md)).

Governance moved from a single company to a community model. The project splits work into functional areas (the AWS, GCP, Azure, Tencent, and Oracle providers, `c7n-org`, notifications, docs, and releases), each with area maintainers tracked in `OWNERS.md` and `CODEOWNERS`, while core maintainers handle cross-area decisions and CNCF liaison ([GOVERNANCE.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/GOVERNANCE.md)).

At the time of incubation the project reported 350+ contributors, 130+ contributing organisations, 4.3K GitHub stars, and over 150M downloads ([CNCF blog, 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/)).

## Where it stands now

Cloud Custodian remains a CNCF Incubating project ([CNCF project page](https://www.cncf.io/projects/cloud-custodian/)). It is packaged on PyPI as `c7n` with the provider tools published as companion modules, and a container image is published as `cloudcustodian/c7n` on Docker Hub ([PyPI](https://pypi.org/project/c7n/), [Docker Hub](https://hub.docker.com/r/cloudcustodian/c7n)). As observed on 2026-06-24 the repository carried 6,014 stars, 1,625 forks, and roughly 418 contributors, on the `0.9.51` release line ([GitHub REST API](https://api.github.com/repos/cloud-custodian/cloud-custodian)).
