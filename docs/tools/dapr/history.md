# History

## Origin

Microsoft published Dapr as an open-source incubation project on 2019-10-16, led by Azure CTO Mark Russinovich (source 10). The goal was to take the repetitive distributed-systems work out of cloud-native development: state management, messaging, service discovery, and resilience that every microservice team rebuilds by hand. Dapr packaged that work as a language-agnostic sidecar so an app could use it over plain HTTP or gRPC.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Microsoft announces Dapr as an open-source project (source 10) |
| 2020 | Roughly 120 contributors within the first six months (source 6); move to open governance announced |
| 2021 | v1.0 declared production-ready (source 7); accepted into the CNCF Incubator on 2021-11-03 (source 5) |
| 2024 | CNCF graduation level reached 2024-10-30, announced at KubeCon NA 2024-11-12 (source 3) |
| 2026 | Dapr Runtime v1.18.1 released 2026-06-16 (source 1) |

## How it evolved

Dapr started inside Microsoft but moved to open governance in 2020 to make it vendor-neutral, a step that preceded donating it to the CNCF (source 6). The 1.0 release in February 2021 marked the API surface as stable enough for production Kubernetes deployments (source 7). Acceptance into the CNCF Incubator later that year put the project under foundation governance (source 5).

The building-block set has grown over time. The component registry now carries state, pub/sub, bindings, secrets, configuration, locks, crypto, workflows, and conversation components in one structure (`pkg/runtime/compstore/compstore.go:42`), and the registry holds an `mcpServers` slice alongside them, reflecting the more recent push toward AI and agent workloads.

## Where it stands now

Dapr graduated within the CNCF on 2024-10-30, with the public announcement at KubeCon North America on 2024-11-12 (source 3). The current runtime release at the documented commit is v1.18.1 (2026-06-16, source 1). The pinned tree builds with Go 1.26.4 (`go.mod:3`). Development continues across the runtime, the CLI (`dapr/cli`), components (`dapr/components-contrib`), and the language SDKs, with stated direction toward AI agents and workflows (source 12).
