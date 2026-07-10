# Getting Started

> Based on the README quickstart at commit `0c6315b` (near v2.4.0). Commands assume a Unix shell on Linux or macOS.

## Prerequisites

- The [Rust toolchain](https://www.rust-lang.org/tools/install).
- The WASI Preview 2 target: `rustup target add wasm32-wasip2` (`README.md`).

## Install

Install the latest release binary (Linux/macOS):

```bash
curl -fsSL https://raw.githubusercontent.com/wasmcloud/wasmCloud/refs/heads/main/install.sh | bash
```

Then move `wash` somewhere on your `PATH`. To build from source instead:

```bash
git clone https://github.com/wasmcloud/wasmCloud.git
cargo install --path wasmCloud/crates/wash
```

## A first working setup

The shortest path to a running component is scaffold, build, then run the hot-reload dev loop.

1. Create a new component from the HTTP hello-world template.

   ```bash
   wash new https://github.com/wasmCloud/wasmCloud.git --subfolder templates/http-hello-world
   ```

1. Build the component.

   ```bash
   wash -C ./http-hello-world build
   ```

1. Start the development loop. `wash dev` builds the component, loads it into a local host, and reloads on file changes.

   ```bash
   wash -C ./http-hello-world dev
   ```

## Verify it works

`wash dev` starts a local HTTP server for the component (the dev HTTP router is `DevRouter` at `crates/wash/src/cli/dev.rs:141`, served by `HttpServer` at `crates/wash/src/cli/dev.rs:184`). Send a request to the printed local address to see the hello-world response, then edit the component source and watch `wash dev` rebuild and hot-reload it. Reload runs through `reload_component` (`crates/wash/src/cli/dev.rs:597`), which stops the old workload and starts the new one.

To keep `wash` current:

```bash
wash update
```

## Where to go next

For production deployment on Kubernetes, use the operator in `runtime-operator/` and the gateway in `runtime-gateway/`, which drive the same runtime over the gRPC `WorkloadService` (`proto/wasmcloud/runtime/v2/workload_service.proto`). For capability configuration, egress allowlists, and resource limits, see `LocalResources` (`crates/wash-runtime/src/types.rs:75`) and the official docs at [wasmcloud.com/docs](https://wasmcloud.com/docs/).
