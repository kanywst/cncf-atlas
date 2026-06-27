# History

## Origin

Athenz began inside Yahoo (later Verizon Media / Oath) as the company's internal authentication and authorization platform, running in large-scale production before it was open-sourced. Maintainers Mujib Wahab and Henry Avetisyan described that path on the Dash Open podcast episode 21 in 2020 (source 5). The public GitHub repository was created on 2016-11-16 under the `yahoo` org and was later moved to the `AthenZ` org; the Go module identifier moved with it, from `github.com/yahoo/athenz` to `github.com/AthenZ/athenz` (sources 3, 6).

The problem it set out to solve: in dynamic infrastructure (autoscaling VMs, containers, FaaS), you want to give each workload an identity without shipping long-lived static credentials, manage fine-grained RBAC centrally, and still enforce it locally at runtime. That goal is the reason the system separates central management (ZMS) from distributed enforcement (ZTS plus a client-side policy engine).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | GitHub repository created under the `yahoo` org (2016-11-16) (source 6). |
| 2020 | Maintainers describe the open-sourcing of the platform on Dash Open 21 (source 5). |
| 2021 | Accepted as a CNCF Sandbox project on 2021-01-26 (sources 1, 2). |
| 2021 | v1.10.4 (2021-02-14) adopts an open governance model, change #1299 (source 7). |
| 2026 | v1.12.43 released 2026-06-19; actively maintained on the 1.12.x line (source 6). |

## How it evolved

The defining shift was governance, not a rewrite. Moving from a single-vendor project to CNCF Sandbox (accepted 2021-01-26) coincided with the v1.10.4 release adopting an open governance model, recorded in the CHANGELOG as change #1299 (sources 2, 7). The repository move from the `yahoo` org to the `AthenZ` org, and the matching Go module rename, are part of that same transition away from a single corporate home (sources 3, 6).

The product scope grew outward from the two core servers (ZMS and ZTS) into a wide set of platform-specific Service Identity Agent (SIA) providers, so the same identity-bootstrap model now covers AWS, GCP, Azure, Kubernetes, and CI systems such as GitHub Actions, Buildkite, Harness, and Spacelift.

## Where it stands now

Athenz is on the 1.12.x release line with frequent point releases, the latest being v1.12.43 on 2026-06-19 (source 6). It is a CNCF Sandbox project under open governance (sources 1, 7). Development discussion happens on the Athenz-Dev and Athenz-Users Google Groups linked from the README (source 3).
