# container2wasm

> container2wasm (c2w) converts a container image into a WebAssembly image that runs on a WASI runtime or in a browser, without recompiling the application.

- **Category**: Runtime
- **CNCF maturity**: Sandbox
- **Language**: Go (host CLI) plus a multi-stage Dockerfile that builds the C/C++/Rust emulators
- **License**: Apache-2.0 (the generated `.wasm` bundles third-party code under LGPL-2.1, MIT, and other licenses)
- **Repository**: [container2wasm/container2wasm](https://github.com/container2wasm/container2wasm)
- **Documented at commit**: `74662a2` (near tag v0.8.4, 2026-06-15)

## What it is

container2wasm takes a normal container image, for example `ubuntu:22.04`, and produces a single `.wasm` file that runs the container's workload on a WebAssembly runtime such as wasmtime, or inside a web page. It does not recompile your application to WebAssembly. Instead it compiles a CPU emulator to WebAssembly, boots a real Linux kernel inside that emulator, and starts the container with runc. From the application's point of view it is running on ordinary Linux, so no source changes are required.

That inversion is the whole idea. Most Wasm tooling asks you to write or rebuild your program for a Wasm target. container2wasm keeps the container as-is and moves the CPU itself into Wasm. The cost is emulation overhead: an emulated CPU is slower than native, so x86_64 and riscv64 images are the recommended targets, and images for other architectures run through a second layer of in-guest emulation that is slower still.

The project is experimental and sits at CNCF Sandbox stage. It is authored primarily by Kohei Tokunaga at NTT, who also maintains containerd, Stargz Snapshotter, and nerdctl. The host side is a thin Go CLI; the real converter is a 1064-line Dockerfile embedded in the binary that BuildKit executes (`embed.go:5-6`).

## When to use it

- You want to run an existing Linux container in a browser or on a WASI runtime with no access to Docker or a Linux host at run time, for demos, education, or sandboxed execution.
- You need the container to run unmodified, including software that was never built for a Wasm target.
- You want a single portable `.wasm` artifact that carries the workload, the Linux kernel, and the emulator together.
- It is a poor fit when you need native performance, because CPU emulation is slow. If your workload can be compiled to Wasm directly, a Wasm-native runtime path (runwasi, WasmEdge, Spin) will be far faster.
- Check the license implications before shipping, because the generated `.wasm` bundles emulator code under LGPL-2.1 and other licenses.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a conversion flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [container2wasm README](https://github.com/container2wasm/container2wasm/blob/main/README.md), accessed 2026-06-26.
2. [Dockerfile (the conversion pipeline)](https://github.com/container2wasm/container2wasm/blob/main/Dockerfile), accessed 2026-06-26.
3. [CNCF project page: container2wasm](https://www.cncf.io/projects/container2wasm/), accessed 2026-06-26.
4. [Kohei Tokunaga, "container2wasm Converter" (nttlabs/Medium)](https://medium.com/nttlabs/container2wasm-2dd90a18cc9a), accessed 2026-06-26.
5. [Pinned commit `74662a2`](https://github.com/container2wasm/container2wasm/commit/74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd), accessed 2026-06-26.
