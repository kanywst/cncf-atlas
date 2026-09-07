# History

## Origin

Tekton did not start as a CI/CD project. It started as the build machinery inside Knative, the serverless platform Google open sourced in 2018. Knative Build turned source into a container image; the pipeline work that grew out of it was meant to generalise that into arbitrary sequences of containerised work.

The first commit in `tektoncd/pipeline` is dated 2018-08-29, authored by Mark Chmarny, under the repository's original name `knative/build-pipeline`. The two commits after it are `Add pipeline strawman example` (2018-08-31) and the merge of the `pipeline_strawman` branch (2018-09-05), both from Christie Wilson. The project began from a written design proposal rather than from working code.

By early 2019 it was clear the work needed a home of its own. Knative's brand was tied to serverless, and the pipeline component was useful to anyone deploying anything [2]. In March 2019 Google renamed it Tekton and donated it to the newly formed Continuous Delivery Foundation, alongside Jenkins, Jenkins X, and Spinnaker as the CDF's founding projects [3].

## Timeline

| Year | Milestone |
| --- | --- |
| 2018 | First commit as `knative/build-pipeline` (2018-08-29), starting from a strawman design document |
| 2019 | `v0.1.0` tagged 2019-02-20; renamed Tekton and donated to the CD Foundation in March [3] |
| 2020 | Beta API (`v1beta1`) period; `v0.11.0` on 2020-03-30, with the beta release explained on the Google Open Source Blog [4] |
| 2022 | `v1` API types land in the tree (`pkg/apis/pipeline/v1/task_types.go` added 2022-06-29); graduated within the CDF on 2022-10-26 [5]; `v0.41.0` on 2022-10-31 becomes the first long-term support release |
| 2023 | PipelineResources removed across three commits between January and March |
| 2025 | `v1.0.0` tagged 2025-02-27 |
| 2026 | Accepted as a CNCF incubating project on 2026-03-13, announced 2026-03-24 [1]; the CD Foundation published its own handover the same day [7]; `v1.16.0` tagged 2026-08-21 |

Dates for tags, commits, and file additions come from the pinned clone's git history. Dates for donations, graduations, and acceptances come from the cited announcements.

## How it evolved

The largest change was not a rewrite but a deletion. Early Tekton had a concept called PipelineResources: typed inputs and outputs, so a task could declare that it consumed a `git` resource and produced an `image` resource, and the implementation behind each type could be swapped. It was the project's headline idea. It also proved hard to make general, and in 2023 it was removed entirely, in commits `6ba1c48ed` (PullRequest resources, 2023-01-19), `81876e6bc` (Git, Storage and Generic, 2023-02-14), and `3ca844439` (Image, 2023-02-23). What replaced it is plainer: parameters, results, and workspaces, all of which are just strings and volumes.

The `README.md` in the repository still advertises Tekton as "Typed", with an example about swapping kaniko for buildkit behind an `Image` resource (`README.md:22-28`). That paragraph outlived the feature it describes by three years.

The second shift was the slow move to a stable API. `v1beta1` arrived in 2020 and stayed for years. The `v1` types appear in the tree in mid-2022, and the project kept both alive through conversion webhooks (`pkg/apis/pipeline/v1/*_conversion.go`). API surface is still gated at runtime rather than at compile time: a cluster-wide flag `enable-api-fields` decides whether alpha, beta, or only stable fields are accepted, and it defaults to beta (`pkg/apis/config/feature_flags.go:73`).

The third shift is governance. Tekton graduated inside the CD Foundation in 2022 [5], then moved to the CNCF in 2026 [1], [7]. The stated reason was gravitational: adopters were already combining Tekton with Argo CD, SPIFFE/SPIRE, and Sigstore, so co-hosting removed a foundation boundary from the middle of a common stack [1].

## Where it stands now

Releases are monthly, with four long-term support releases a year in January, April, July, and October, and everything else supported for roughly a month (`releases.md`). The LTS scheme started with `v0.41.0` in October 2022. Release manifests are published to GitHub and to object storage, and the container images are signed with Sigstore through Tekton Chains, which is the project signing its own artifacts with its own tooling (`releases.md`).

The Kubernetes floor moves with the releases: `v0.59.x` required Kubernetes 1.27, `v0.61.x` requires 1.28 (`README.md`). Governance is multi-vendor, with maintainers from Google, Red Hat, and IBM among others [1], and the incubation application records 13 maintainers on Pipelines alone [6].
