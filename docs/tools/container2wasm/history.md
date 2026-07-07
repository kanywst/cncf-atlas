# History

## Origin

container2wasm was started in early 2023 by Kohei Tokunaga (`ktock`), an engineer at NTT who also maintains containerd, Stargz Snapshotter, and nerdctl. The repository was created on 2023-02-15. The founding idea, described in his nttlabs blog post, was to run an unmodified container on WebAssembly by emulating the CPU rather than porting the application. The first version targeted RISC-V only, using TinyEMU, a small system emulator written by Fabrice Bellard. container2wasm uses a patched fork, `ktock/tinyemu-c2w`.

## Timeline

| Year | Milestone |
| --- | --- |
| 2023 | Repository created 2023-02-15. v0.3.0 (mid-2023) added x86_64 support via Bochs. v0.4.0 added host directory mapping into the guest over virtio-9p for both x86_64 and riscv64. |
| 2024 | Talks at Cloud Native Wasm Day (KubeCon NA 2023), Open Source Summit NA 2024, WasmCon 2024, and FOSDEM 2024. |
| 2025 | Accepted into the CNCF Sandbox in January 2025 as one of a batch of 13 projects. Talk at FOSDEM 2025 on running QEMU inside the browser. |
| 2026 | v0.8.x integrated QEMU Wasm into the `--to-js` path for x86_64, aarch64, and riscv64 browser output. Latest release v0.8.4 (2026-03-16). |

## How it evolved

The project grew from a single-architecture experiment into a multi-emulator converter. TinyEMU (MIT) handles riscv64, Bochs (LGPL-2.1) was added for x86_64, and the `--to-js` browser path later adopted QEMU compiled with Emscripten for x86_64, aarch64, and riscv64. That work shows up in the Dockerfile as the `qemu-emscripten-dev-*` stages (`Dockerfile:861` onward).

Directory mapping arrived in v0.4.0: the WASI filesystem API exposes a host directory, and the emulator mounts it into the guest Linux over virtio-9p. The project was accepted into the CNCF Sandbox in the January 2025 intake (onboarding issue cncf/sandbox#332, proposal cncf/sandbox#123). The canonical repository later moved from `ktock/container2wasm` to the `container2wasm/container2wasm` organization, though the Go module path is still `github.com/ktock/container2wasm` (`go.mod:1`).

## Where it stands now

container2wasm is a CNCF Sandbox project and is explicitly experimental, a status both the README and the CNCF project page state. The latest release is v0.8.4 (2026-03-16), one of 24 releases since v0.1.0. Development is effectively led by a single maintainer: the GitHub contributors API reports about 9 contributors, centered on `ktock`. The stated direction is broader browser support through QEMU Wasm and continued work on the conversion pipeline.

## Sources

1. [Kohei Tokunaga, "container2wasm Converter" (nttlabs/Medium)](https://medium.com/nttlabs/container2wasm-2dd90a18cc9a), accessed 2026-06-26.
2. [CNCF project page: container2wasm](https://www.cncf.io/projects/container2wasm/), accessed 2026-06-26.
3. [cncf/sandbox onboarding issue #332](https://github.com/cncf/sandbox/issues/332), accessed 2026-06-26.
4. [cncf/sandbox proposal issue #123](https://github.com/cncf/sandbox/issues/123), accessed 2026-06-26.
5. [TinyEMU (Fabrice Bellard)](https://bellard.org/tinyemu/), accessed 2026-06-26.
6. container2wasm source at commit [`74662a2`](https://github.com/container2wasm/container2wasm/commit/74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd), accessed 2026-06-26.
