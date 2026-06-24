# History

## Origin

Falco was created at Sysdig and open-sourced in 2016. The GitHub repository's `created_at` is 2016-01-19 (source 2, 4). The technical roots reach back further: the first driver code dates to 2014, building on a lineage of kernel data collection that now runs on eBPF (source 4).

Founder Loris Degioanni framed the project around a specific idea: runtime security needs more than eBPF data collection. It needs enrichment, orchestrator integration, correlation across multiple data sources, and a maintained policy library (source 4). That framing explains why Falco grew a rule engine and a plugin system rather than staying a raw event collector.

## Timeline

| Year | Milestone |
| --- | --- |
| 2014 | First driver code; roots in kernel data collection (source 4) |
| 2016 | Created at Sysdig and open-sourced; repo created 2016-01-19 (source 2, 4) |
| 2018 | Donated to CNCF as a Sandbox project, the first runtime security project accepted (source 1, 4) |
| 2020 | Moved to CNCF Incubation in April (source 1, 4) |
| 2022 | Plugin framework launched, adding non-syscall event sources (source 7) |
| 2024 | Graduated from the CNCF on 2024-02-29 (source 1, 5) |

## How it evolved

The donation to CNCF in 2018 made Falco the first runtime security project in the foundation (source 1, 4). Incubation followed in 2020. After the move to Incubation the project reported a 400% increase in active contributors and a 526% increase in total downloads (source 1, 4).

The 2022 plugin framework was a scope change. It let Falco read event sources other than syscalls, such as Kubernetes audit logs and cloud trails, through shared libraries (source 7). This turned a host syscall monitor into a more general detection engine.

Graduation on 2024-02-29 required work beyond engineering. The TOC due diligence, a third-party security audit, and a licensing arrangement so a CNCF project could ship a GPL Linux kernel module alongside eBPF code all preceded the graduation vote (source 1, 5).

## Where it stands now

The latest stable release at the time of writing is `0.44.1`, published 2026-06-11 (source 3). The graduation announcement cited more than 100 million downloads and over 30 self-declared adopters (source 1, 4). The pinned commit for this deep-dive, `5123e90`, is a development build on `master` ahead of `0.44.1`.
