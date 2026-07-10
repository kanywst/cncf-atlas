# Getting Started

> Based on Lima v2.1.x. Commands assume a macOS or Linux host with a hardware hypervisor available.

## Prerequisites

- A macOS, Linux, NetBSD, or Windows host with virtualization support.
- Homebrew on macOS/Linux, or a release binary, or a Go toolchain (`go 1.25.x`) to build from source.

## Install

```bash
brew install lima
```

On Linux you can use the release binaries, or build from source with `make`. From a clone, `make limactl` produces the `limactl` and `lima` binaries; `make native` also builds the plugins, guestagent, and drivers.

## A first working setup

1. Start the default instance. This downloads an image and boots a Linux VM, mounting your home directory read-only and forwarding ports automatically.

   ```bash
   limactl start
   ```

1. Open a shell inside the guest. The `lima` command is a wrapper around `limactl shell default`.

   ```bash
   lima uname -a
   ```

1. Run a container from the host using the bundled nerdctl wrapper.

   ```bash
   nerdctl.lima run --rm hello-world
   ```

## Verify it works

Check instance status from the host:

```bash
limactl list
```

A healthy instance shows `STATUS` as `Running` with an SSH port assigned. To pick a backend explicitly, pass `--vm-type`, for example `limactl start --vm-type=vz` on macOS.

## Where to go next

- Edit the per-instance config with `limactl edit`; the file is `~/.lima/<name>/lima.yaml` following the `LimaYAML` schema.
- See the [Lima documentation](https://lima-vm.io/docs/) for mounts, networking, drivers, and the YAML reference.
- Use templates under `templates/` for other distributions or preconfigured setups.

## Sources

1. [lima-vm/lima README](https://github.com/lima-vm/lima) (Homebrew install), accessed 2026-06-24.
2. [Lima documentation](https://lima-vm.io/docs/), accessed 2026-06-24.
3. Lima source at commit [`9a3f1c4`](https://github.com/lima-vm/lima/commit/9a3f1c443389c673eb619f7b1922b1a4d8e4fd16), accessed 2026-06-24.
