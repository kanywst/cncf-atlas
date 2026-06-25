# History

## Origin

Cortex began in June 2016 as a design document titled "Project Frankenstein: A Multi Tenant, Scale Out Prometheus", followed by a talk of the same name at PromCon 2016. It was started by Tom Wilkie (then at Weaveworks, later Grafana Labs) together with Prometheus co-author Julius Volz, and ran as the engine behind Weaveworks' hosted Prometheus service ([Grafana Labs blog](https://grafana.com/blog/cortex-the-scalable-prometheus-project-has-advanced-to-incubation-within-cncf/)).

The motivating problem: a single Prometheus is capped by one machine's throughput and storage, its HA story is weak, and it cannot isolate many independent Prometheus tenants inside one cluster. Cortex addresses this by centrally receiving remote write traffic and sharding it horizontally ([CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | "Project Frankenstein" design doc and PromCon talk; origin at Weaveworks. |
| 2018 | Accepted into the CNCF Sandbox (2018-09-20). |
| 2020 | Promoted to CNCF Incubating (2020-08-20), announced alongside Thanos. |
| 2026 | Active development continues; `v1.21.1` released 2026-06-04. |

## How it evolved

The largest architectural shift was storage. The original chunks storage engine was deprecated in `v1.10.0` and superseded by blocks storage, which is built on the Prometheus TSDB and Thanos object storage blocks. Through that move, Cortex came to share shipper, store-gateway, and compactor code with Thanos ([CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/)).

Governance matured at the same pace. At incubation the project reported 8 maintainers across 4 companies (Grafana Labs, Microsoft, Splunk, Weaveworks), and named EA, Gojek, and REWE Digital as production users running more than 15 million active series ([CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/)).

In 2022 Grafana Labs forked Cortex into Grafana Mimir. That fork is real, but it did not stop Cortex: the upstream repository continues to ship releases independently.

## Where it stands now

Cortex remains an actively developed CNCF Incubating project. The pinned commit `42c26e7` was pushed on 2026-06-23, the repository is not archived, and `v1.21.1` was released on 2026-06-04. Some third-party comparison posts describe Cortex as stalled or in maintenance mode after the Mimir fork, but that claim is contradicted by the live repository's recent releases and commits, so it is not adopted here.
