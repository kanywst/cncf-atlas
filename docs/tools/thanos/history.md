# History

## Origin

Thanos was started in late 2017 at Improbable in London by Bartłomiej Płotka and Fabian Reinartz, and opened to the public in early 2018. The motivation was a practical operations problem: scaling Prometheus to long retention and a global view without paying for ever-larger local disks. Fabian Reinartz, a Prometheus core developer, and Bartłomiej Płotka described the design and its origin in their conference talk [Fabian Reinartz and Bartlomiej Plotka: Thanos](https://www.youtube.com/watch?v=l8syWgJ98sk).

The name reflects the design: the components combine to give Prometheus powers it does not have alone.

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Started at Improbable by Bartłomiej Płotka and Fabian Reinartz. |
| 2018 | Project made public. |
| 2019 | Accepted into the CNCF as a Sandbox project (2019-07-14). |
| 2020 | Promoted to CNCF Incubating (2020-08-19). |
| 2026 | Latest stable release `v0.41.0` (2026-02-12); `v0.42.0-rc.0` cut 2026-06-23. |

## How it evolved

Thanos began as a sidecar-plus-object-storage extension to existing Prometheus servers: the sidecar uploads TSDB blocks and exposes a StoreAPI, the store gateway serves those blocks back, and the querier merges everything. A push-based ingestion path, the Receive component, was added later so that workloads that cannot be scraped can remote-write into Thanos. Both ingestion styles are now supported side by side, which the [recon notes](https://github.com/thanos-io/thanos) describe as the project's two front doors.

Governance moved away from a single company toward CNCF multi-vendor stewardship. The [TOC incubation announcement](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) marks that step, and the core maintainers listed in `MAINTAINERS.md` now span several employers including Google, Polar Signals, Vinted, Red Hat, AWS, Shopify, and Cloudflare.

## Where it stands now

Thanos is a CNCF Incubating project (see the [CNCF project page](https://www.cncf.io/projects/thanos/)) under multi-vendor maintenance. Releases land roughly every six weeks as a single binary on GitHub Releases plus a `quay.io/thanos/thanos` container image. A [CNCF TAG Security self-assessment](https://tag-security.cncf.io/community/assessments/projects/thanos/self-assessment/) documents its security posture.
