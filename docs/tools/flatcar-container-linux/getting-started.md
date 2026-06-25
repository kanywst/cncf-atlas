# Getting Started

> Two paths: run a published Flatcar image, or build one yourself from `flatcar/scripts` at commit `d2c217c`. Commands assume Docker and a Linux host.

## Prerequisites

- For running: an account on a supported cloud (AWS, Azure, GCP) or a QEMU/bare-metal host for the raw image.
- For building: Docker, a Linux host, and the ability to run a privileged container (the build uses loop devices, `README.md:89`).
- An Ignition config for first-boot setup (transpiled from a YAML Butane config).

## Install

Most users do not build Flatcar; they boot a published image and configure it with Ignition. To build from source instead, clone the scripts repository:

```bash
git clone https://github.com/flatcar/scripts.git
cd scripts
```

## A first working setup

The shortest real path is booting a published image with an Ignition config. To exercise the build system itself, follow these steps in the SDK container.

1. Start the SDK container with privileged access to `/dev`, required for the loop devices used during image builds (`README.md:89`).

```bash
docker run -ti --privileged -v /dev:/dev \
    ghcr.io/flatcar/flatcar-sdk-all:3033.0.0
```

1. Inside the container, build the binary packages for a board.

```bash
./build_packages --board=amd64-usr
```

1. Build the production image. This runs the `create_prod_image` flow described in [Architecture](./architecture) (`src/build_image:189`).

```bash
./build_image --board=amd64-usr prod
```

1. Convert the generic image into a runnable VM image.

```bash
./image_to_vm.sh --from=<image-dir> --board=amd64-usr
```

## Verify it works

The build writes a `version.txt` alongside the image (`src/build_image:211-221`). Confirm it contains the expected `FLATCAR_VERSION` and `FLATCAR_BUILD_ID`. On a booted Flatcar host, `/usr` is mounted read-only and protected by dm-verity, so attempting to write to it should fail; container workloads run via the shipped containerd/docker runtimes.

## Where to go next

- The official docs at [`flatcar.org/docs`](https://www.flatcar.org/docs/latest/) cover production concerns: update channels, Ignition reference, and cloud-specific provisioning.
- For modifying packages, read the `coreos-overlay` versus `portage-stable` split (`README.md:41-44`) before changing any ebuild.
