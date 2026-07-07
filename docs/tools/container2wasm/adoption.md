# Adoption & Ecosystem

## Who uses it

container2wasm is experimental and CNCF Sandbox stage. It has no ADOPTERS file and no citable production-user organizations. The one named downstream that builds on it is vscode-container-wasm, an extension that runs containers inside a browser-based VSCode, for example on `github.dev`. It is documented by NTT, the same group that authors container2wasm, so it is a first-party downstream rather than independent production adoption.

| Project | Use case | Source |
| --- | --- | --- |
| vscode-container-wasm | Runs containers in a browser VSCode using container2wasm as the engine | [nttlabs/Medium](https://medium.com/nttlabs/vscode-container-wasm-57d17dda7caa) |

Do not read more into adoption than the sources support. Beyond the above, adoption is best described through GitHub signals rather than named production users.

## Adoption signals

Measured with the GitHub CLI on 2026-06-26:

- Stars: 2,713
- Forks: 145
- Contributors (GitHub contributors API): about 9, effectively led by a single maintainer
- Latest release: v0.8.4 (2026-03-16), the 24th release since v0.1.0

The CNCF project page aggregates a much larger "436 contributors / 175 contributing organizations" figure, but that is CNCF's own wide-net metric and is orders of magnitude above the GitHub contributor count, so the GitHub-measured numbers are used here. CNCF Sandbox acceptance in January 2025 is itself a maturity signal, though Sandbox is the earliest CNCF stage.

## Ecosystem

container2wasm sits between the container world and the Wasm world and leans on tools from both. The output runs on WASI runtimes: wasmtime, WasmEdge, wamr, wasmer, and wazero. The build requires Docker Buildx and BuildKit, and pulls in a cross-language toolchain: wasi-sdk and Emscripten to compile the emulators, wizer to pre-boot, and wasi-vfs to pack the filesystem. The emulators themselves are third-party: Bochs for x86_64, TinyEMU for riscv64, and QEMU (compiled with Emscripten) for the `--to-js` browser path.

## Alternatives

The key distinction is what gets moved into Wasm. container2wasm moves the CPU and runs an unmodified Linux container inside it. The Wasm-native runtimes below move the application: they run programs already compiled to Wasm, which is far faster but requires the workload to target Wasm in the first place.

| Alternative | Differs by |
| --- | --- |
| runwasi / containerd-shim-wasm (CNCF) | Runs Wasm modules through a container runtime. It expects Wasm-native apps; container2wasm runs existing Linux containers that were never built for Wasm. |
| Kuasar / Spin (SpinKube) | Run Wasm applications on WasmEdge or Spin. Also Wasm-native; no CPU emulation, so much faster, but the app must be a Wasm module. |
| WebVM / v86 | Run Linux in a browser x86 emulator. Similar emulation idea, but without the OCI-image-to-wasm pipeline, WASI runtime support, or wizer pre-boot that shape container2wasm's output. |

## Sources

1. ["vscode-container-wasm" (nttlabs/Medium)](https://medium.com/nttlabs/vscode-container-wasm-57d17dda7caa), accessed 2026-06-26.
2. [container2wasm README](https://github.com/container2wasm/container2wasm/blob/main/README.md), accessed 2026-06-26.
3. [CNCF project page: container2wasm](https://www.cncf.io/projects/container2wasm/), accessed 2026-06-26.
4. GitHub CLI measurements against [container2wasm/container2wasm](https://github.com/container2wasm/container2wasm), accessed 2026-06-26.
