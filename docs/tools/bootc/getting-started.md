# Getting Started

> Verified against bootc v1.16.2. Commands assume a Linux host with `podman` installed and root or `sudo` access.

## Prerequisites

- A Linux host with `podman` (or `docker`/`buildah`) to build images.
- Root or `sudo` for `bootc install`, which needs `--privileged`.
- A spare block device or a virtual machine disk to install onto. Installing overwrites the target device.

## Install

You do not install the bootc binary onto a normal host and point it at an image. bootc ships inside bootc-compatible base images, and you run it from that image. Start from an existing base image such as Fedora bootc:

```bash
podman pull quay.io/fedora/fedora-bootc:42
```

## A first working setup

The core job is: build a bootable OS image, confirm it is bootc-compatible, then install it.

1. Create a derived image. Put this in a file named `Containerfile`:

   ```dockerfile
   FROM quay.io/fedora/fedora-bootc:42
   RUN dnf -y install vim && dnf clean all
   ```

2. Build it with `podman`, tagging it for your registry:

   ```bash
   podman build -t quay.io/examplecorp/exampleos:latest .
   ```

3. Confirm the image is bootc-compatible. The `lint` check enforces requirements such as the `containers.bootc=1` label and the kernel layout:

   ```bash
   podman run --rm quay.io/examplecorp/exampleos:latest bootc container lint
   ```

4. Install the image to a disk. Run bootc from inside the image itself, with `--privileged`, targeting your block device (here `/dev/vda` in a VM):

   ```bash
   sudo podman run --rm --privileged --pid=host --ipc=host \
     -v /var/lib/containers:/var/lib/containers -v /dev:/dev \
     --security-opt label=type:unconfined_t \
     quay.io/examplecorp/exampleos:latest \
     bootc install to-disk /dev/vda
   ```

The installed system records the pull specification used for the `podman run` invocation and uses it for later updates, so a host installed from `quay.io/examplecorp/exampleos:latest` will fetch updates from that same reference.

## Verify it works

After booting the installed system, check bootc's view of host state:

```bash
sudo bootc status
```

The output is a `BootcHost` object showing the `booted` image and any `staged` or `rollback` entries. To fetch and queue a newer image without rebooting:

```bash
sudo bootc upgrade
```

The new version appears as `staged` in `bootc status` and applies at the next shutdown. Use `sudo bootc upgrade --apply` to reboot into it immediately, and `sudo bootc rollback` to queue the previous deployment for the next boot.

## Where to go next

- Installation methods, including `install to-filesystem` for external installers: [bootc installation docs](https://bootc.dev/bootc/bootc-install.html).
- Building bootc-compatible base images and the requirements `lint` enforces: [bootc image docs](https://bootc.dev/bootc/bootc-images.html).
- Full reference and upgrade model: [bootc website and documentation](https://bootc.dev/bootc/).

## Sources

1. [bootc website and documentation](https://bootc.dev/bootc/)
2. [bootc source at commit a7f95e7](https://github.com/bootc-dev/bootc/tree/a7f95e743aa54a2f966edc1a0417ef6d509df9af)
