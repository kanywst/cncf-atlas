# History

## Origin

Atlantis started inside Hootsuite. Anubhav Mishra built an early internal tool, then rewrote it in Go with Luke Kysow, and the two open-sourced it as `hootsuite/atlantis`. The problem they were solving was collaboration: how does a team run `terraform plan` and `terraform apply` together, and how do you let developers apply infrastructure changes safely without giving everyone direct production access. The founding write-up, "Introducing Atlantis", is annotated as originally written on 11 September 2017 and was published on 27 February 2018 (source 2).

The Hootsuite origin is visible in the source itself. `main.go` still carries the line `// Copyright 2017 HootSuite Media Inc.` (`main.go:1`), with the SPDX (Software Package Data Exchange) identifier `Apache-2.0` on the next line (`main.go:2`).

The idea Atlantis popularised is "apply before merge": the apply runs on the pull request, against real infrastructure, while the change is still open for review. The state lives in the user's own Terraform backend, and Atlantis keeps only locks and plan metadata. That division is still the core of the design today.

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Anubhav Mishra and Luke Kysow build and rewrite the tool in Go at Hootsuite (source 2). |
| 2018 | Public launch post; the GitHub repository was created 2018-02-06, and the project moves from `hootsuite/atlantis` to the `runatlantis/atlantis` org (sources 2, 3). |
| 2024 | Accepted into the CNCF Sandbox on 2024-06-18, in the 2024 first-half cohort (sources 4, 6). |
| 2026 | Release `v0.44.0` published 2026-06-10; this deep-dive pins the main branch just after it (source 15). |

## How it evolved

The most visible governance shift was the move out of a company namespace. In 2018 the project was transferred from `hootsuite/atlantis` to the `runatlantis/atlantis` GitHub organisation, putting it in a neutral home rather than under a single employer (source 3). The original two authors later joined HashiCorp, and the Terraform team's support was acknowledged at the time of the CNCF donation (source 4).

The donation to the CNCF was about governance, not features. The project had gone through a quieter period, and contributing it to the CNCF was a way to strengthen its governance and continuity. The Sandbox application was filed as cncf/sandbox#60, the TAG App Delivery review ran as cncf/tag-app-delivery#474, and the community vote in mid-2024 cleared the bar before acceptance on 2024-06-18 (sources 4, 5, 6).

## Where it stands now

Atlantis ships tagged releases regularly; `v0.44.0` landed on 2026-06-10 (source 15). It is a CNCF Sandbox project maintained by a group listed in `MAINTAINERS.md`, with maintainers drawn from several companies rather than one (source 14). The scope has stayed deliberately narrow: it remains the pull request automation layer for Terraform and OpenTofu, leaving state, modules, and policy to the user's own backend and tooling.
