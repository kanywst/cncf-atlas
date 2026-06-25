# Internals

> Read from the source at commit `d2c217c`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/build_image` | Entrypoint: parse type, source helpers, dispatch to image builders. |
| `src/build_library/prod_image_util.sh` | `create_prod_image`, the production image flow. |
| `src/build_library/build_image_util.sh` | `start_image`, `emerge_to_image`, `finish_image`, verity injection. |
| `src/build_library/disk_layout.json` | GPT partition table: A/B `/usr`, state, OEM, EFI. |
| `src/build_library/disk_util` | Python tool for format, mount, and verity over the layout. |
| `src/sdk_container/src/third_party/` | `coreos-overlay` and `portage-stable` ebuilds. |
| `src/sdk_container/.repo/manifests/version.txt` | Version manifest. |

## Core data structures

**The partition layout (`src/build_library/disk_layout.json`).** The `base` layout defines the disk. Partition 3 is `USR-A` and partition 4 is `USR-B`, the A/B pair. `USR-A` is declared `btrfs` with `zstd` compression, mounted at `/usr`, with the `prioritize` and `verity` features (`src/build_library/disk_layout.json:25-37`). Note that the code, not older comparison articles, is authoritative here: the current `/usr` filesystem is btrfs+zstd.

**The partitions dict (`src/build_library/disk_util`).** `LoadPartitionConfig` reads the JSON and validates it against `valid_layout_keys` (`src/build_library/disk_util:38-46`). For each partition it computes derived sizes, injecting `bytes`, `fs_blocks`, and `fs_bytes` into the dict (`src/build_library/disk_util:135-138`). Every `format`, `mount`, and `verity` subcommand iterates this dict.

**The version manifest (`src/sdk_container/.repo/manifests/version.txt`).** Holds `FLATCAR_VERSION`, `FLATCAR_VERSION_ID`, `FLATCAR_BUILD_ID`, and `FLATCAR_SDK_VERSION` in `MAJOR.MINOR.PATCH+BUILD_ID` form. `set_version` resolves the latest nightly from the binhost and rewrites this file (`src/set_version:11`). To avoid mismatched build IDs across contexts, `build_image` exports a single `FLATCAR_BUILD_ID` for the whole build (`src/build_image:19`, addressing flatcar/Flatcar#2041).

## A path worth tracing

The non-obvious part is how `/usr` integrity is enforced at boot. After `/usr` is unmounted, `finish_image` runs `disk_util verity` (`src/build_library/build_image_util.sh:779-781`), which calls `veritysetup format --hash=sha256` over the partition and parses the resulting 64-hex root hash (`src/build_library/disk_util:802-810`).

That hash is not stored in a keystore. It is written directly into the kernel image at a fixed offset (`src/build_library/build_image_util.sh:788-790`):

```bash
printf %s "$(cat ${BUILD_DIR}/${image_name%.bin}_verity.txt)" | \
    sudo dd of="${root_fs_dir}/boot/flatcar/vmlinuz-a" conv=notrunc \
    seek=${verity_offset} count=64 bs=1 status=none
```

The offset depends on the board: 64 for amd64, 512 for arm64 (`src/build_library/build_image_util.sh:559-561`). A modified GRUB reads the hash from that location and adds it to the kernel command line, as the inline comment explains (`src/build_library/build_image_util.sh:783-787`).

## Things that surprised me

- **The verity root hash is physically bolted to the kernel.** Rather than carrying a separate signed hash, Flatcar embeds the 64-hex `/usr` root hash into an unused slot in the kernel image. Secure Boot signing then covers the kernel including that hash (`src/build_library/build_image_util.sh:796`), so tampering with `/usr` is caught by verity at boot.
- **Nothing is compiled into the image.** `emerge_to_image` always passes `--usepkgonly` (`src/build_library/build_image_util.sh:132-141`); image assembly is purely a binary-package unpack, with source builds done earlier in a separate stage.
- **The very first package is just `baselayout`.** `start_image` emerges only `sys-apps/baselayout --nodeps --oneshot` to bootstrap a working filesystem before anything else (`src/build_library/build_image_util.sh:519`), and `emerge_to_image` short-circuits for that case (`src/build_library/build_image_util.sh:143-144`).
