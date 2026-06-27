# Getting Started

> Verified against v0.6.0. Commands assume a Linux host with root access and a recent kernel that supports eBPF and XDP. The build needs Rust 1.85.0 or newer (edition 2024).

## Prerequisites

- A Linux host (eBPF and XDP are Linux kernel features; bpfman does not run on macOS or Windows).
- Rust toolchain 1.85.0 or newer, from [rustup](https://rustup.rs).
- `sudo` or root, since loading eBPF programs touches the kernel.
- A network interface name to attach to (for example `eth0`); check yours with `ip link`.

## Install

Clone the repository, build the workspace, and install the binaries and systemd unit with the bundled script.

```bash
git clone https://github.com/bpfman/bpfman.git
cd bpfman
cargo build
sudo ./scripts/setup.sh install
```

`cargo build` compiles the `bpfman` CLI and the `bpfman-rpc` server. `setup.sh install` copies the binaries to `/usr/sbin/` and installs the systemd service files (it prints the full list of steps when run).

## A first working setup

This loads the prebuilt `xdp_pass` program from its OCI (Open Container Initiative) image, attaches it to an interface, and then removes it. Loading and attaching are two separate steps in v0.6.0: `load` returns a program id, and you pass that id to `attach`.

1. Load the bytecode image. This places the program in the kernel but does not attach it yet.

    ```bash
    sudo bpfman load image --image-url quay.io/bpfman-bytecode/xdp_pass:latest \
        --programs xdp:pass --application XdpPassProgram
    ```

2. Note the program id printed by the previous command, then attach it to an interface. Replace `<PROGRAM_ID>` with that id and `eth0` with your interface.

    ```bash
    sudo bpfman attach <PROGRAM_ID> xdp --iface eth0 --priority 35
    ```

3. When finished, unload the program. This detaches it and removes it from the kernel.

    ```bash
    sudo bpfman unload <PROGRAM_ID>
    ```

## Verify it works

List the programs bpfman is managing and confirm yours appears under the application name you set.

```bash
sudo bpfman list programs --application XdpPassProgram
```

You should see a row for the loaded program with its id, type (`xdp`), and name. After `unload`, the same command should no longer list it.

## Where to go next

For the gRPC server, Kubernetes operator and CRDs (Custom Resource Definitions), socket-activated privilege separation, and building your own bytecode images, see the official documentation at [bpfman.io](https://bpfman.io/main/) and the launch guide at [Launching bpfman](https://bpfman.io/v0.6.0/getting-started/launching-bpfman/).
