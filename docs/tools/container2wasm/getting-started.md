# Getting Started

> Based on container2wasm v0.8.x. Commands assume a Linux or macOS host with Docker Buildx and a WASI runtime available.

## Prerequisites

- Docker with Buildx (the conversion runs through BuildKit).
- A WASI runtime to execute the output, for example wasmtime.
- To build `c2w` from source, a Go toolchain and `make`. Prebuilt binaries are also published on the releases page.

## Install

```bash
make
sudo make install
```

`make` builds the `c2w` and `c2w-net` binaries (`Makefile:16`, `Makefile:19`); `sudo make install` places them on your `PATH`. Alternatively, download a release binary from the project's releases page.

## A first working setup

1. Convert a container image to a `.wasm` file. This drives Docker Buildx and can take a while on the first run.

   ```bash
   c2w ubuntu:22.04 out.wasm
   ```

1. Run the output on a WASI runtime. The `.wasm` boots an emulated Linux and runs the command in the container.

   ```bash
   wasmtime out.wasm uname -a
   ```

1. Map a host directory into the guest. The WASI filesystem exposes it and the emulator mounts it over 9p.

   ```bash
   wasmtime --mapdir /mnt/share::/tmp/share out.wasm cat /mnt/share/from-host
   ```

To target riscv64 instead of the default amd64, pass `--target-arch`:

```bash
c2w --target-arch=riscv64 riscv64/ubuntu:22.04 out.wasm
```

For a browser build, use `--to-js` to emit JavaScript and Wasm assets:

```bash
c2w --to-js alpine:3.20 /tmp/out-js/htdocs/
```

## Verify it works

If `wasmtime out.wasm uname -a` prints a Linux kernel string, the emulator booted, runc started the container, and the command ran inside it. Because the default optimization mode uses a wizer pre-boot snapshot (`Dockerfile:29`), startup skips the kernel boot and resumes from the snapshot, so the first line of output should appear quickly. Networking needs the host-side `c2w-net` helper, since WASI has no sockets.

## Where to go next

- The [README](https://github.com/container2wasm/container2wasm/blob/main/README.md) documents supported runtimes, browser output, and networking with `c2w-net`.
- Note the license caveat before redistributing: the generated `.wasm` bundles emulator code under LGPL-2.1 and other licenses.
- The project is experimental and CNCF Sandbox stage; treat performance and stability accordingly.

## Sources

1. [container2wasm README](https://github.com/container2wasm/container2wasm/blob/main/README.md), accessed 2026-06-26.
2. container2wasm source at commit [`74662a2`](https://github.com/container2wasm/container2wasm/commit/74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd), accessed 2026-06-26.
