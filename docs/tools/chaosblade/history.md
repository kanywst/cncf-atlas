# History

## Origin

Chaosblade grew out of Alibaba's internal fault-testing and drill tooling, codenamed MonkeyKing. Alibaba's own account describes roughly ten years of fault-injection practice behind it, starting from validating the dependency problems of microservices and widening to steady-state validation in cloud and cloud-native environments. The project was open-sourced in 2019, initially as two repositories: `chaosblade`, the Go CLI plus basic resource and container executors, and `chaosblade-exec-jvm`, the executor for the JVM.

The stated motivation was that chaos tools of the time had scattered scenarios, were hard to deploy, lacked a standard experiment model, and were difficult to extend. Chaosblade's answer was to standardise the experiment model so scenarios could be defined, shared, and extended uniformly.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Open-sourced by Alibaba as `chaosblade` (Go CLI) plus `chaosblade-exec-jvm` |
| 2020 | v1.0.0-GA: Linux, Windows, Docker, and Kubernetes support; Java, Golang, JavaScript, C++ coverage; the `chaosblade-box` platform added |
| 2021 | Accepted into the CNCF Sandbox on 2021-04-28 |
| 2022 | New version of the `chaosblade-box` chaos engineering platform released |
| 2026 | Python `blade-ai/` agent layer added; mainline release line at `v1.8.0`, AI layer at `blade-ai-v0.5.1` |

## How it evolved

The project moved from a single tool to a platform. Alibaba describes adding `chaosblade-box` to manage chaos across multiple clusters, environments, and languages, and reports that at the v1.0.0-GA mark the tool covered 200+ scenarios with 3000+ parameters. The architecture stayed split: a thin CLI plus a family of sibling executor repositories (`chaosblade-exec-os`, `chaosblade-exec-jvm`, `chaosblade-exec-cplus`, and so on) that the build clones and packages, so new fault domains arrive as new executors rather than CLI rewrites.

Two visible changes appear in the source at this commit. Server command mode was disabled on 2023-12-30, noted in the CLI init at `cli/cmd/cmd.go:58`, so the CLI no longer registers a server subcommand even though the README still mentions it. And a Python AI agent layer was added under `blade-ai/`, described as orchestration that takes a plain-language failure description and runs intent understanding, safety review, injection, verification, recovery, and reporting.

## Where it stands now

Chaosblade remains a CNCF Sandbox project; the same-category projects Chaos Mesh and LitmusChaos are one step further at Incubating. The 2025 survey paper (arXiv 2505.13654) positions ChaosBlade as Sandbox with active development across many releases. LFX Insights reports a single-contributor concentration risk: in a recent quarter one contributor accounted for more than half of activity. The mainline release line is at `v1.8.0`, with the newer AI layer versioned separately as `blade-ai-v0.5.1` (2026-06-23). The Go module targets `go 1.25` (`go.mod:17`).
