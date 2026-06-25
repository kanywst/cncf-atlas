# History

## Origin

wasmCloud was started by Liam Randall and Kevin Hoffman while they worked at a large US bank. They wanted to run business logic as small, portable units that the platform could place and connect, rather than as monoliths bound to a single runtime. The early abstraction drew on the actor model (which dates to 1973). The implementation moved from Rust to Erlang/OTP for a period, and then returned to Rust once the WebAssembly Component Model made a Rust-based component runtime practical ([b-nova](https://b-nova.com/en/home/content/actors-in-the-cloud-with-wasmcloud/), [InfoWorld](https://www.infoworld.com/article/2338269/first-look-wasmcloud-and-cosmonic.html)).

The project is sponsored by Cosmonic, co-founded by Liam Randall and Stuart Harris. The current project lead is Bailey Hayes, Cosmonic CTO and a member of the Bytecode Alliance TSC ([CNCF incubator blog](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Accepted into the CNCF Sandbox on 2021-07-13 ([CNCF project page](https://www.cncf.io/projects/wasmcloud/)) |
| 2023 | Ecosystem componentized for WASI Preview 2 / Component Model; WIT adopted as the IDL ([Cosmonic](https://cosmonic.com/blog/industry/cosmonic-componentizes-wasmcloud-ecosystem)) |
| 2024 | wasmCloud 1.0 at KubeCon EU Paris, bringing WASI 0.2 and wRPC to production use ([Cosmonic](https://blog.cosmonic.com/engineering/wasmcloud-1-brings-components-to-enterprise/)) |
| 2024 | Kubernetes operator (formerly Cosmonic Connect Kubernetes) donated to CNCF ([Cosmonic](https://blog.cosmonic.com/engineering/wasmcloud-operator-is-here/)) |
| 2024 | Promoted from Sandbox to Incubating by TOC vote on 2024-11-08 ([CNCF](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)) |
| 2026 | v2.4.0 released on 2026-06-17 (GitHub Releases) |

## How it evolved

The largest shift is the v2 rewrite reflected at the pinned commit. Historically wasmCloud was a multi-crate system organised around a NATS "lattice" connecting actors (later components), capability providers, and the `wadm` declarative deployment manager ([wasmCloud docs](https://wasmcloud.com/docs/concepts/hosts/)). The `wasmCloud/wasmCloud` repository at the pinned commit is substantially different. It centres on `wash` (`README.md:1`) and a Cargo workspace of three members: the `wash` CLI, the `wash-runtime` runtime, and a benchmark crate.

This tracks the Q3 2025 roadmap, which set out to reframe providers as wRPC servers and to rework transport, scheduling, events, and claims while leaning into Kubernetes ([roadmap](https://wasmcloud.com/docs/roadmap/)). In the v2 code the NATS lattice is no longer the control plane. Control flows over gRPC to a Kubernetes operator (`proto/wasmcloud/runtime/v2/`). NATS remains a dependency used by some capability plugins (key-value and blob store), not a required control-plane element.

Two consequences follow for readers. Older write-ups describing lattice, NATS, actors, and `wadm` are still useful for the conceptual model, but they do not match the current code layout. The architecture and internals sections here describe the v2 code as it exists at `0c6315b`.

## Where it stands now

The project is CNCF Incubating. Releases continue on the `v2.x` line, with v2.4.0 dated 2026-06-17. Development centres on the `wash` CLI and the embedded `wash-runtime`, with the Go operator and gateway providing the Kubernetes integration. The stated direction is a single component runtime shared between local development (`wash dev`) and Kubernetes production (operator plus gRPC), as captured in the roadmap and realised in the v2 workspace ([roadmap](https://wasmcloud.com/docs/roadmap/)).
