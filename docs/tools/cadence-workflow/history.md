# History

## Origin

Cadence was built at Uber's Seattle office starting in 2015, when Maxim Fateev and Samar Abbas joined forces to create it. Both had worked on the same problem before: AWS Simple Workflow Service and the Azure Durable Task Framework. Cadence reimplemented that idea of durable execution as a self-hosted system on a different stack ([ia40 interview](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev)).

The code was open-sourced in 2017. The README still states the project has been an "open-source platform since 2017" (`README.md:8`), and the GitHub repository was created on 2017-02-21. Inside Uber the platform grew from zero to roughly 100 use cases in three years, and external companies such as HashiCorp, Coinbase, and DoorDash picked it up ([ia40 interview](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | Fateev and Abbas begin Cadence at Uber Seattle ([ia40](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev)). |
| 2017 | Open-sourced; GitHub repository created 2017-02-21 (`README.md:8`). |
| 2019 | The two creators leave Uber, found Temporal, and fork Cadence ([Amplify Partners](https://www.amplifypartners.com/blog-posts/our-investment-in-temporal)). |
| 2025 | Accepted into the CNCF Sandbox on 2025-05-22 ([CNCF](https://www.cncf.io/projects/cadence-workflow/)). |
| 2026 | Latest stable release `v1.4.0` on 2026-02-27. |

## How it evolved

The largest fork in the project's history is literal. In 2019 the two original creators left Uber and founded Temporal, forking the Cadence codebase ([Amplify Partners](https://www.amplifypartners.com/blog-posts/our-investment-in-temporal)). Temporal moved its wire format from Thrift to protobuf and its transport from a custom RPC to gRPC, and it ships under the MIT license. The shared lineage is still visible inside the Cadence tree: source files carry a copyright line attributing portions of the software to Temporal Technologies (`service/history/engine/engineimpl/start_workflow_execution.go:2`).

Cadence stayed under Uber's stewardship and continued to evolve as an Apache-2.0 project. The Go module path is still `github.com/uber/cadence` (`go.mod:1`), a holdover from the original ownership, even though the GitHub organization is now `cadence-workflow`.

In May 2025 Uber donated Cadence to the CNCF, where it was accepted as a Sandbox project ([Uber Blog](https://www.uber.com/us/en/blog/cadence-workflow-joins-the-cloud-native-computing-foundation/), [cncf/sandbox issue #368](https://github.com/cncf/sandbox/issues/368)). The repository moved to the `cadence-workflow` GitHub organization and community chat moved to the `#cadence-users` channel in the CNCF Slack workspace.

## Where it stands now

Cadence is a CNCF Sandbox project with a neutral host, governed by a Technical Steering Committee of four plus a set of maintainers (`MAINTAINERS.md`). It builds on Go 1.24 (`go.mod:3`). The latest stable release is `v1.4.0` (2026-02-27), with prerelease tags such as `v1.4.1-prerelease31` cut on top. The project ships official Go and Java SDKs and a web UI as separate repositories, and the server engine documented here remains the actively developed core.
