# History

## Origin

Capsule was started by Clastix, a Kubernetes consultancy based in Italy, and released as open source in 2020. The GitHub repository was created on 2020-06-29 and the earliest release was tagged `v0.0.1`. The project author, Dario Tranchitella, announced it publicly as Apache-2.0 licensed and CNCF compatible from the start (source 9).

The problem it set out to solve is structural. A Kubernetes namespace is a flat unit: there is no built-in object that groups several namespaces for one team, shares a quota across them, or lets a team owner create more of them safely. The common workaround is to give each team its own cluster, which produces cluster sprawl and the operational cost that comes with it. Capsule consolidates per-team namespaces into a single `Tenant` object inside one cluster to avoid that (source 8).

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | Clastix open-sources Capsule; repository created 2020-06-29, first release v0.0.1 (sources 1, 9) |
| 2022 | Accepted into the CNCF Sandbox on 2022-12-13 (sources 2, 3) |
| 2022 onward | Sandbox onboarding: move to the neutral `projectcapsule` GitHub org, docs moved to MkDocs, DCO/CLA and Code of Conduct added (source 4) |
| 2026 | Active releases continue; v0.13.7 cut 2026-06-24 (source 1) |

## How it evolved

The largest non-code shift was governance. As part of CNCF Sandbox onboarding, tracked in umbrella issue #812, the project moved from the vendor-owned `clastix/capsule` repository to the neutral `projectcapsule` organisation, adopted a Developer Certificate of Origin and Contributor License Agreement flow, published a Code of Conduct, and rebuilt its documentation site (source 4). The documentation domain moved from `capsule.clastix.io` to `projectcapsule.dev`; the Helm chart README now points at the latter (`charts/capsule/README.md:5`).

On the API side, Capsule maintains two CRD API groups, `api/v1beta1` and `api/v1beta2`, with v1beta2 marked as the storage version (`api/v1beta2/tenant_types.go:141`, the `+kubebuilder:storageversion` marker). The tenant model has been growing toward a rule and enforcement system: several older `TenantStatus` and `TenantSpec` fields are now deprecated in favour of newer constructs. For example `TenantStatus.Namespaces []string` is marked deprecated (`api/v1beta2/tenant_status.go:42`) and replaced by `Spaces []*TenantStatusNamespaceItem` (`api/v1beta2/tenant_status.go:44`).

## Where it stands now

Capsule is a CNCF Sandbox project (source 2) under the `projectcapsule` organisation. Releases ship regularly, with v0.13.7 cut on 2026-06-24 (source 1). The project builds as a single Go controller binary; `make manager` runs `go build -o bin/manager` (`Makefile:64-65`), and the module targets Go 1.26 (`go.mod`, `go 1.26.4`). The stated direction is to keep consolidating per-namespace policy into a tenant-scoped rule and enforcement model while keeping the native Kubernetes experience (no extra API server, no per-tenant control plane).
