# wasmCloud

> A WebAssembly component runtime that runs the same host locally and on Kubernetes, wiring components to swappable capability plugins.

- **Category**: Runtime
- **CNCF maturity**: Incubating
- **Language**: Rust (with a Go Kubernetes operator and gateway)
- **License**: Apache-2.0
- **Repository**: [wasmCloud/wasmCloud](https://github.com/wasmCloud/wasmCloud)
- **Documented at commit**: `0c6315b` (2026-06-24, near tag v2.4.0)

## What it is

wasmCloud runs WebAssembly components built against the WASI 0.2 / 0.3 Component Model. A component declares the capabilities it needs through WIT interfaces (`wasi:*` for standard capabilities, `wasmcloud:*` for project-specific ones), and the host supplies those capabilities as plugins at instantiation time. The component itself stays free of vendor SDKs and transport details.

At the pinned commit the repository is built around `wash` (The Wasm Shell), a single CLI for scaffolding, building, inspecting, and running components. The README opens with `# wash - The Wasm Shell` (`README.md:1`). The Cargo workspace has three members: the `wash` CLI, the `wash-runtime` embedded runtime, and a benchmark crate. A Go Kubernetes operator and HTTP gateway sit alongside in `runtime-operator/` and `runtime-gateway/`.

The point of the v2 design is that one runtime serves two front ends. Locally, `wash dev` drives the runtime with hot reload. In production, the Kubernetes operator drives the same runtime over gRPC. The code below the entry point is identical.

## When to use it

- You want to write business logic as a polyglot WebAssembly component and let the platform inject capabilities (HTTP, key-value, blob, messaging, config) rather than linking SDKs.
- You want the same component to run on a laptop during development and on Kubernetes in production without rewriting the host wiring.
- You need a zero-trust default for outbound traffic: egress is denied unless an allowlist is set (`crates/wash-runtime/src/types.rs:92`).
- It is a weaker fit if you need a mature, battle-tested control plane today: the v2 runtime is a recent rewrite (see [History](./history)), and several public adopters are at PoC stage.
- It is not a general container runtime; it executes Wasm components, not OCI container images.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [wasmCloud/wasmCloud (GitHub)](https://github.com/wasmCloud/wasmCloud)
2. [wash - The Wasm Shell (README)](https://github.com/wasmCloud/wasmCloud/blob/main/README.md)
3. [CNCF welcomes wasmCloud to the CNCF Incubator](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)
4. [wasmCloud (CNCF projects)](https://www.cncf.io/projects/wasmcloud/)
5. [wasmCloud 1.0 Brings the WebAssembly Component Model to Enterprise (Cosmonic)](https://blog.cosmonic.com/engineering/wasmcloud-1-brings-components-to-enterprise/)
6. [Cosmonic Componentizes wasmCloud Ecosystem](https://cosmonic.com/blog/industry/cosmonic-componentizes-wasmcloud-ecosystem)
7. [wasmCloud Operator: Open Source Wasm on K8s (Cosmonic)](https://blog.cosmonic.com/engineering/wasmcloud-operator-is-here/)
8. [WebAssembly Adoption Grows across Telco, Manufacturing, Tech](https://wasmcloud.com/blog/2024-10-22-webassembly-adoption-telco-manufacturing-tech/)
9. [First look: wasmCloud and Cosmonic (InfoWorld)](https://www.infoworld.com/article/2338269/first-look-wasmcloud-and-cosmonic.html)
10. [Actors in the Cloud with wasmCloud (b-nova)](https://b-nova.com/en/home/content/actors-in-the-cloud-with-wasmcloud/)
