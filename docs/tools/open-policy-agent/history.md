# History

## Origin

OPA started in 2016 at Styra, the company founded by Tim Hinrichs, Torin Sandall, and Teemu Koponen. The goal was to pull authorization logic out of individual applications and unify it behind a single declarative policy layer, so that policy lived as its own artifact instead of being scattered through service code ([Styra OPA 101](https://www.styra.com/blog/open-policy-agent-101-a-beginners-guide/)).

The policy language is Rego, pronounced "ray-go". It is a declarative query language for hierarchical structured data. OPA evaluates Rego and can run as an embedded library, a sidecar, or a standalone daemon ([openpolicyagent.org docs](https://www.openpolicyagent.org/docs)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Development begins inside Styra. |
| 2018 | Accepted into CNCF as a Sandbox project (2018-03-29). |
| 2019 | Promoted to CNCF Incubating (2019-04-02). |
| 2021 | Graduated from CNCF (2021-01-29, announced 2021-02-04), the 15th project to graduate. |
| 2024 | OPA 1.0 released, with breaking language changes and new server defaults. |
| 2025 | The three founders and several Styra engineers move to Apple; the project stays under CNCF governance. |

## How it evolved

CNCF acceptance moved in the usual three steps: Sandbox in 2018, Incubating in 2019, and Graduated in January 2021. The graduation announcement described OPA as the first CNCF authorization-focused project to graduate, with maintainers from Google, Microsoft, VMware, and Styra ([CNCF graduation announcement](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/), [InfoQ](https://www.infoq.com/news/2021/02/opa-cncf-graduation/)).

OPA 1.0 shipped in December 2024, eight years after the first commit, with the project reporting over 5,000 commits and more than 400 contributors. The release made breaking changes: `if` and `contains` keywords became mandatory in rule definitions, `every` and `in` no longer needed an explicit import, and the server now binds to localhost by default to avoid accidental policy exposure. The `rego.v1` import became a no-op from 1.0 onward ([OPA 1.0 blog](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368), [v1.0.0 release notes](https://github.com/open-policy-agent/opa/releases/tag/v1.0.0)).

## Where it stands now

In August 2025 the three founders (Teemu Koponen, Tim Hinrichs, Torin Sandall) and several Styra engineers moved to Apple, effectively an acquihire, with Styra winding down and no public acquisition filing. The founders stated in a community note that OPA itself stays under CNCF governance and that the maintainer list does not change. Styra's commercial assets, including Enterprise OPA, OPA Control Plane, the Regal linter, and the SDKs, were open-sourced ([founders' community note](https://blog.openpolicyagent.org/note-from-teemu-tim-and-torin-to-the-open-policy-agent-community-2dbbfe494371), [Cloud Native Now](https://cloudnativenow.com/features/apple-buys-styra-brains-opa-remains-open/), [Open Source For You](https://www.opensourceforu.com/2025/08/apple-acquires-open-policy-agent-developers-while-cncf-retains-control-of-open-source-project/)).

Governance follows an organizational voting model: one organization gets one vote so no single company can dominate an area. Maintainers are scoped to an area of expertise (a repository or subtree); a new maintainer is nominated by an existing one and confirmed by a two-thirds majority of organizations, with the role expiring after one year unless renewed ([GOVERNANCE.md](https://github.com/open-policy-agent/opa/blob/main/GOVERNANCE.md), [MAINTAINERS.md](https://github.com/open-policy-agent/opa/blob/main/MAINTAINERS.md)). The pinned source reports its in-development version as `1.18.0-dev` (`v1/version/version.go:13`), sitting between the released v1.17.1 and the next minor.
