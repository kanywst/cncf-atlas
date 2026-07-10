# History

## Origin

The devfile format began inside Eclipse Che, the browser-based IDE that Red Hat and the Che community built for Kubernetes. Che needed a way to describe a workspace (the containers, tools, and commands a developer needs) so a project could carry its own environment definition. That first format is now called devfile 1.0.

The `devfile/api` repository was created on 2019-12-05 (GitHub `created_at`). Its purpose was different from the 1.0 format: it defined a Kubernetes API, `DevWorkspace`, that a cluster could reconcile into a running environment. The devfile 2.0 format was then designed as a subset of that API, so the file format and the cluster resource share the same Go types. The README records this relationship directly: the devfile 2.0 structure is a subset of the `DevWorkspace` API defined here (`README.md:26-28`).

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | `devfile/api` repository created (2019-12-05); work starts on the Kubernetes-native `DevWorkspace` API |
| 2021 | `v2.0.0` released (2021-01-18); `v2.1.0` follows (2021-05) |
| 2022 | Accepted into the CNCF Sandbox (2022-01-11); `v2.2.0` released (2022-10) |
| 2023 | `v2.2.1` (2023-10) and `v2.2.2` (2023-11) released |
| 2024 | `v2.3.0` released (2024-06), the current schema version in the repository |

## How it evolved

The defining shift was from a Che-specific workspace file (1.0) to a Kubernetes-native API (2.0). In the 2.x design the specification is Go code first: the CRDs, JSON schemas, and TypeScript model are all generated from the types in `pkg/apis/workspaces/v1alpha2/` rather than hand-written (`README.md:11-24`). An older API version, `v1alpha1`, still exists in the tree with hand-written conversion code (`*_conversion.go` files) that maps it to `v1alpha2`, so the CRDs ship more than one stored version.

The scope also settled into multiple repositories rather than one. `devfile/api` holds the specification and a runtime library for overrides, merging, unions, and validation. The full parser (reading a `devfile.yaml`, resolving a `parent`, fetching from a registry) lives in `devfile/library`. Related repositories cover the registry (`devfile/registry`, `devfile/registry-support`), the Kubernetes controller (`devfile/devworkspace-operator`), and source detection (`devfile/alizer`). The deep-dive here reads only `devfile/api`.

At the pinned commit the repository declares JSON schema version 2.3.0 and Kubernetes API version `v1alpha2` (`schemas/latest/jsonSchemaVersion.txt`, `schemas/latest/k8sApiVersion.txt`).

## Where it stands now

Devfile is a CNCF Sandbox project (accepted 2022-01-11, per the CNCF project page). Releases have been roughly annual since 2.0, with 2.3.0 the current line. The maintainer list in `MAINTAINERS.md` is drawn from Red Hat and AWS, which matches the project's origin in Red Hat's Che work and AWS's use of the format in CodeCatalyst. The stated direction stays consistent with the original premise: keep the Go types the single source of truth and generate every consumable artifact from them.
