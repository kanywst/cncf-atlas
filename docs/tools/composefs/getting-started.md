# Getting Started

> Verified against the source at commit `298edd6` (meson version `1.0.8`, `src/meson.build:4`). Commands assume a Linux host with a C toolchain. Mounting requires root and a kernel with overlayfs and EROFS.

## Prerequisites

- A Linux machine. composefs is a composition of Linux kernel features (overlayfs, EROFS, optionally fs-verity) and does not run elsewhere.
- Build tooling: `meson`, `ninja`, a C compiler, plus `libcrypto` (OpenSSL) headers and `pkg-config`. fs-verity headers (`libfsverity-dev`) and `libfuse3-dev` are optional. On Debian/Ubuntu the package set is in `hacking/installdeps.sh`; on Fedora, `dnf builddep composefs` covers it.
- Root privileges to mount an image. Creating an image with `mkcomposefs` needs no privileges.

## Install

Build from source with meson and ninja:

```bash
git clone https://github.com/containers/composefs
cd composefs
meson setup build
ninja -C build
```

The tools land in `build/tools/`: `mkcomposefs`, `mount.composefs`, `composefs-info`, and `composefs-dump`. Install them system-wide with `meson install -C build` if you want `mount -t composefs` to find the helper on `PATH`.

## A first working setup

This creates a content-addressed backing store and an EROFS metadata image from a directory, then inspects it. None of these steps require root.

1. Create a sample source tree.

    ```bash
    mkdir -p /tmp/cfs-src/dir
    echo hello > /tmp/cfs-src/file.txt
    echo world > /tmp/cfs-src/dir/other.txt
    ```

2. Build the image and fill a backing store in one step. `--digest-store` copies each regular file larger than 64 bytes into the store, named after its fs-verity digest, and inlines smaller files.

    ```bash
    ./build/tools/mkcomposefs --digest-store=/tmp/cfs-store \
      /tmp/cfs-src /tmp/image.cfs
    ```

3. Print the image's fs-verity digest, which is what you would pin for verification.

    ```bash
    ./build/tools/mkcomposefs --print-digest-only /tmp/cfs-src
    ```

4. Mount the image, pointing `basedir` at the backing store (requires root). Use the helper directly:

    ```bash
    sudo ./build/tools/mount.composefs -o basedir=/tmp/cfs-store \
      /tmp/image.cfs /mnt
    ```

## Verify it works

List the contents of the image without mounting, which shows each path and its backing object or symlink target:

```bash
./build/tools/composefs-info ls /tmp/image.cfs
```

To confirm the backing store is complete, check for any referenced objects that are missing from it:

```bash
./build/tools/composefs-info missing-objects --basedir=/tmp/cfs-store /tmp/image.cfs
```

If you mounted in step 4, reading a file under `/mnt` should return the original content, served from the backing store through overlayfs.

## Where to go next

- The `man/` pages (`mkcomposefs.md`, `mount.composefs.md`, `composefs-info.md`, `composefs-dump.md`) document every flag, including the `verity`, `noverity`, and `digest` mount options used for integrity enforcement.
- The [README](https://github.com/containers/composefs) explains format versioning and the reproducibility guarantees that let you re-create an image and get the same digest.
- For higher-level use, see the Rust crate [composefs-rs](https://github.com/containers/composefs-rs) or the Go wrappers in containers/storage.
