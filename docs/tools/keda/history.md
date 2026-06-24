# History

## Origin

KEDA began in 2019 as a joint open source project from Microsoft and Red Hat, aimed at running serverless, event-driven containers on Kubernetes ([4]). The repository `kedacore/keda` was created on 2019-02-13. The motivation was concrete: the native HPA scales on CPU and memory and stops at one replica, which does not match queue- and event-driven workloads that should idle at zero and burst on demand.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Started as a Microsoft + Red Hat collaboration; repo created 2019-02-13 ([4]) |
| 2020 | Accepted into the CNCF Sandbox on 2020-03-12 ([4]) |
| 2021 | Promoted to CNCF Incubating on 2021-08-18 ([4], [6]) |
| 2023 | Graduated in the CNCF on 2023-08-22 ([4], [6]) |
| 2026 | `v2.20.1` released 2026-06-08 ([3]) |

## How it evolved

The defining architectural shift came in the v2 line. KEDA split into a controller (operator) and a separate metrics adapter that serves the Kubernetes External Metrics API. The pinned commit still ships that two-component model plus an admission webhook: `make build` produces the `manager`, `adapter`, and `webhooks` binaries ([2], `Makefile:211`). The scaler catalogue grew alongside it; the build switch in `buildScaler` now has roughly 78 cases ([2], `pkg/scaling/scalers_builder.go:123`).

Governance matured in step with the CNCF milestones. By graduation the project reported 60+ scalers and 9 authentication providers, and described itself as vendor-neutral against cloud-specific autoscalers ([4]).

## Where it stands now

KEDA is a CNCF Graduated project ([4], [5]). It releases on the v2 line with regular patch and minor releases; `v2.20.1` shipped on 2026-06-08 ([3]). This deep-dive is pinned to `main` at `c5b577c` (2026-06-19), about 11 days ahead of `v2.20.1`, with no tag of its own ([2]). The adopter list and scaler documentation live on the `keda.sh` site rather than in the core repo ([1], `README.md:66-68`).
