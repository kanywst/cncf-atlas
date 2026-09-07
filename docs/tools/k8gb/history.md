# History

## Origin

k8gb began at Absa, a South African bank, in late 2019. The `ADOPTERS.md` file in the repository states it plainly: "K8GB was created in Absa and had its first production use in cross-regional datacenter context." The problem was the ordinary one for a bank running Kubernetes in more than one data centre: the same application in two places, one hostname, and a need for traffic to move when a region goes down.

The first commit is dated 2019-11-27, authored by Donovan Muller. The two commits after it are `[WIP] Added initial solution documentation` (same day) and `[WIP] Added more use cases` (2019-11-28). Like Tekton, the project starts with written design rather than code.

The lineage is still visible in the tree. Container images were historically published to Docker Hub under `absaoss/k8gb`, which the README still mentions when explaining that the current default is `registry.k8gb.io/k8gb-io/k8gb` (`README.md:34`). More consequentially, the original API group was `k8gb.absa.oss`, a vendor-specific domain that the project has spent 2026 migrating away from.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | First commit 2019-11-27 at Absa, starting from solution documentation |
| 2021 | Accepted into the CNCF sandbox on 2021-03-30 [1], [2]; `v0.8.0` tagged 2021-05-13 |
| 2024 | `v0.14.0` tagged 2024-09-16 |
| 2026 | ADR-0002 accepted 2026-03-09, moving the API group to `k8gb.io`; `v0.20.0` on 2026-07-03; CNCF incubating on 2026-07-18, announced 2026-08-05 [1]; `v1.0.0` on 2026-09-02 |

Tag dates and commit dates come from the pinned clone's git history. Sandbox, incubation, and announcement dates come from the cited CNCF sources.

## How it evolved

The change that most shaped 2026 was renaming the API group. `k8gb.absa.oss/v1beta1` carried the name of the company that created the project, which the maintainers judged a problem for a project under neutral governance. ADR-0002 (`adr/0002-migrate-gslb-api-group-to-vendor-neutral-k8gb-io.md`, accepted 2026-03-09) records the reasoning and, usefully, the options that were rejected:

- **Hard cutover** to `k8gb.io`, breaking every existing cluster.
- **Dual-write**, keeping both groups writable and reconciled, which the ADR rejects for creating two sources of truth.
- **A one-way migration bridge**, making `k8gb.io` canonical, keeping the legacy CRD readable during the transition, and migrating legacy objects automatically.

The third was chosen. That decision is why the repository currently contains two API packages that look almost identical: `api/v1beta1` declares the group `k8gb.absa.oss` (`api/v1beta1/groupversion_info.go:31`) and `api/v1beta1io` declares `k8gb.io` (`api/v1beta1io/groupversion_info.go:32`). The bridge between them is `controllers/gslb_migration_controller.go` and `controllers/conversion_k8gbio.go`, with `controllers/gslb_legacy_controller.go` keeping the old objects working meanwhile.

The other visible arc is the CNCF ladder. Sandbox in March 2021, incubating in July 2026, and `v1.0.0` six weeks after the promotion. The ordering is unusual: the project reached incubating maturity before it declared a 1.0, which is the opposite of the usual sequence and suggests the version number was being held back rather than the maturity being rushed.

## Where it stands now

`v1.0.0` was tagged on 2026-09-02, one day before the commit this deep-dive reads. The API group migration is in progress rather than finished: both groups still compile, and the local development setup deliberately deploys legacy resources so the migration path stays exercised (`docs/local.md`).

The project publishes its health signals prominently. The README carries badges for CLOMonitor, OpenSSF Scorecard, CII Best Practices (project 4866), and FOSSA, and container images and Helm charts are signed with cosign and published to `ghcr.io/k8gb-io` (`docs/CONTRIBUTING.md`). Governance documents (`GOVERNANCE.md`, `SECURITY.md`, `SECURITY-INSIGHTS.yml`, `self-assessment.md`) are all present in the tree, which is what a CNCF incubation review asks for.
