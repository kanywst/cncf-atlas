# History

## Origin

Harbor started in 2014 as an internal project inside VMware's China R&D organization, built to solve the image-storage problems that early container users hit. VMware open-sourced it in March 2016, and it grew alongside the rise of Kubernetes. The name and framing have stayed consistent since: a registry that stores, signs, and scans content, extending Docker Distribution with the security, identity, and management features enterprises expect.

## Timeline

| Year | Milestone |
| --- | --- |
| 2014 | Started as an internal VMware project in China R&D. |
| 2016 | VMware open-sources Harbor (March). |
| 2018 | Donated to CNCF, accepted into the Sandbox (July 31), promoted to Incubating (November 14). |
| 2020 | Graduated from the CNCF (June 15, announced June 23). |
| 2026 | Active development toward v2.16.0; v2.14.4 is the latest GA. |

## How it evolved

Harbor's notable shift was the move to Graduated status on 2020-06-15. It was the first open-source registry to reach CNCF Graduated, and the first CNCF Graduated project that originated in China. The graduation marked Harbor as a mature, vendor-neutral project rather than a VMware product.

The artifact model generalized over time. What began as a container image registry now treats images, Helm charts, and other OCI artifacts through one unified `artifact.Artifact` abstraction (`src/pkg/artifact/model.go:32-48`), so the same project, RBAC, quota, and scanning machinery applies to all of them.

Signing has tracked the wider ecosystem. The README still documents Notary v1 (Docker Content Trust) for image signing (`README.md:39`), but the project has moved toward Cosign (sigstore), which is verified as a manifest-push gate (`src/server/registry/route.go:81`). Since v2.15.0, Harbor's own release artifacts are signed with Cosign (`README.md:65`).

## Where it stands now

Harbor releases on a regular cadence of minor and patch versions. As documented here, the `VERSION` file targets `v2.16.0` in development while `v2.14.4` (2026-05-11) is the latest GA release. Governance runs under the CNCF with bi-weekly community calls across two timezones (`README.md:16`). The reported repository metrics at the time of writing were about 28,755 stars and 5,264 forks.
