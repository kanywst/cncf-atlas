# History

## Origin

Contour started at Heptio in 2017. The GitHub repository was created on 2017-10-26. The motivation was the limits of the standard Kubernetes `Ingress` specification: it could not express TLS delegation, safe multi-team operation, or richer routing without falling back to vendor-specific annotations. Contour set out to fill that gap by driving Envoy as its data plane.

Heptio was acquired by VMware in 2018, and development of Contour continued under VMware.

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Project created at Heptio (repo created 2017-10-26). |
| 2018 | Heptio acquired by VMware; development continues under VMware. |
| 2019 | Contour 1.0 released (November 2019). |
| 2020 | Donation to CNCF begins via cncf/toc PR #330; accepted as Incubating on 2020-07-07. |
| 2020 | Third-party security audit by Cure53 (December 2020). |

## How it evolved

The donation to CNCF was opened in early 2020 through cncf/toc PR #330 by Michael Michael. During due diligence the TOC noted that governance documentation was not present when the proposal was filed and was created during the review; the maintainers responded that governance was being practiced but had not been written down. The TOC accepted Contour as an Incubating project on 2020-07-07.

A third-party security audit by Cure53 was completed in December 2020; the report (`Contour_Security_Audit_Dec2020.pdf`) ships in the repository.

Over time the configuration surface grew from standard `Ingress` and the `HTTPProxy` CRD to include the Gateway API, plus a Gateway provisioner that creates the Envoy and Contour workloads from Gateway API objects.

## Where it stands now

Contour remains a CNCF Incubating project. At the pinned commit `main` targets Envoy 1.38.3, Kubernetes 1.34 through 1.36, and Gateway API 1.3.0, while the latest release `v1.33.5` (2026-05-28) targets Envoy 1.35.10. Maintainers are listed in the `projectcontour/community` repository's `MAINTAINERS.md` and tracked on the CNCF side in `cncf/foundation`'s `project-maintainers.csv`. Triage happens in a weekly community meeting.

## Sources

- projectcontour/contour repository: <https://github.com/projectcontour/contour>
- TOC accepts Contour as Incubating project (CNCF): <https://www.cncf.io/blog/2020/07/07/toc-accepts-contour-as-incubating-project/>
- Donate Contour to CNCF (cncf/toc PR #330): <https://github.com/cncf/toc/pull/330>
- cncf/foundation project-maintainers.csv: <https://github.com/cncf/foundation/blob/main/project-maintainers.csv>
