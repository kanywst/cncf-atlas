# Adoption & Ecosystem

## Who uses it

The CNCF incubator announcement named Adobe, Orange, MachineMetrics, TM Forum member CSPs, and Akamai among organisations working with wasmCloud ([CNCF](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)). Several of these are described as proof-of-concept or prototype work rather than full production deployments, and that distinction is kept below.

| Organisation | Use case | Source |
| --- | --- | --- |
| Adobe | PoC combining wasmCloud with Kubernetes (Colin Murphy, Sean Isom) | [CNCF](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/), [adoption blog](https://wasmcloud.com/blog/2024-10-22-webassembly-adoption-telco-manufacturing-tech/) |
| MachineMetrics | PoC running high-frequency factory-edge data workloads as components, deployed to Argo CD-managed K8s and edge devices | [adoption blog](https://wasmcloud.com/blog/2024-10-22-webassembly-adoption-telco-manufacturing-tech/) |
| TM Forum CSPs | "WebAssembly Canvas Phase I" Catalyst PoC evaluating wasmCloud as an alternative to Kubernetes (ODA Canvas) | [adoption blog](https://wasmcloud.com/blog/2024-10-22-webassembly-adoption-telco-manufacturing-tech/) |

Most public stories are PoC or prototype stage. Full production case studies are limited.

## Adoption signals

Observed on 2026-06-24 via the GitHub REST API for `wasmCloud/wasmCloud`: 2,356 stars, 248 forks, 37 open issues, and roughly 71 contributors (including anonymous). The primary language is Rust. The latest release at that date is v2.4.0, dated 2026-06-17 ([GitHub](https://github.com/wasmCloud/wasmCloud)). The project is CNCF Incubating, promoted from Sandbox on 2024-11-08 ([CNCF project page](https://www.cncf.io/projects/wasmcloud/)).

## Ecosystem

wasmCloud builds on the Bytecode Alliance's Wasmtime and the WASI 0.2 / 0.3 Component Model, with WIT as the interface language. Component distribution uses OCI registries, and observability is wired through OpenTelemetry via the `wasi_otel` plugin (`crates/wash-runtime/src/plugin/`). NATS remains a dependency inside the key-value and blob-store plugins. Cosmonic offers a commercial PaaS built on wasmCloud.

## Alternatives

wasmCloud's differentiators are: WIT and the Component Model as first-class citizens for polyglot component composition; capabilities supplied as swappable `wasi:*` / `wasmcloud:*` plugins; one runtime shared between local (`wash dev`) and Kubernetes (operator plus gRPC); and zero-trust defaults such as deny-by-default egress.

| Alternative | Differs by |
| --- | --- |
| Fermyon Spin | App framework for Wasm microservices; more opinionated programming model, less focused on host-supplied swappable capabilities |
| SpinKube | Runs Spin apps on Kubernetes via a containerd shim, rather than a dedicated component-runtime operator |
| runwasi / containerd-shim-wasm | Runs Wasm through the container runtime as an OCI-shaped workload, not a Component Model host with capability plugins |
| WasmEdge | A WebAssembly runtime (also CNCF); lower-level, without wasmCloud's capability-plugin and operator layer |
| Wasmtime standalone | The same underlying engine wasmCloud embeds, but you build placement, capabilities, and operations yourself |
| Cosmonic | Commercial PaaS built on wasmCloud; managed offering rather than self-hosted open source |
