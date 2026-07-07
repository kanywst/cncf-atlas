# Internals

> Read from the source at commit `298edd6`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/libcomposefs/lcfs-writer.c` | Build the in-memory node tree, compute the tree, dispatch writing |
| `src/libcomposefs/lcfs-writer-erofs.c` | Serialize the tree into an EROFS image (the largest source file) |
| `src/libcomposefs/lcfs-mount.c` | Mount the EROFS image and stack overlayfs on top |
| `src/libcomposefs/lcfs-fsverity.c` | Compute the sha256 fs-verity Merkle digest |
| `src/libcomposefs/lcfs-internal.h` | In-memory structs: node, inode, xattr, write context |
| `src/libcomposefs/lcfs-erofs.h` | composefs image header and magic |
| `src/tools/mkcomposefs.c` | CLI to create an image from a directory or dump |
| `src/tools/mountcomposefs.c` | The `mount.composefs` helper |

## Core data structures

`struct lcfs_node_s` is one node of the in-memory build tree: a file, directory, or symlink (`src/libcomposefs/lcfs-internal.h:113`). It holds children via `children` and `children_size`, hard links via `link_to`, the backing file name or symlink target in `payload`, inline content in `content`, and the fs-verity digest in `digest` (`src/libcomposefs/lcfs-internal.h:118`, `src/libcomposefs/lcfs-internal.h:123`, `src/libcomposefs/lcfs-internal.h:127`, `src/libcomposefs/lcfs-internal.h:129`, `src/libcomposefs/lcfs-internal.h:139`). The later fields (`erofs_nid`, `erofs_isize`, `inode_num`) are filled during serialization (`src/libcomposefs/lcfs-internal.h:146`, `src/libcomposefs/lcfs-internal.h:152`, `src/libcomposefs/lcfs-internal.h:153`).

`struct lcfs_inode_s` is the POSIX inode metadata (`st_mode`, `st_nlink`, `st_uid`, `st_gid`, `st_rdev`, `st_size`, `st_mtim_sec`/`st_mtim_nsec`), embedded into each node as `inode` (`src/libcomposefs/lcfs-internal.h:102`, embedded at `src/libcomposefs/lcfs-internal.h:141`).

`struct lcfs_xattr_s` is a single extended attribute, with `erofs_shared_xattr_offset` set to `-1` unless the attribute is shared across inodes to cut duplication (`src/libcomposefs/lcfs-internal.h:93`, `src/libcomposefs/lcfs-internal.h:99`).

`struct lcfs_ctx_s` is the write context: the root, the BFS queue tail `queue_end`, `num_inodes`, the reproducibility fields `min_mtim_sec`/`min_mtim_nsec`, `has_acl`, and the output callback `write_cb` with `bytes_written` (`src/libcomposefs/lcfs-internal.h:158`). The EROFS serializer casts this to its own extended `lcfs_ctx_erofs_s`.

`struct lcfs_erofs_header_s` is the composefs header written before the EROFS superblock (`src/libcomposefs/lcfs-erofs.h:18`):

```c
struct lcfs_erofs_header_s {
    uint32_t magic;
    uint32_t version;
    uint32_t flags;
    uint32_t composefs_version;
    uint32_t unused[4];
} __attribute__((__packed__));
```

The magic is `LCFS_EROFS_MAGIC`, defined as `0xd078629aU` (`src/libcomposefs/lcfs-erofs.h:12`). The mount path reads this header and compares the magic before doing anything else (`src/libcomposefs/lcfs-mount.c:653`).

## A path worth tracing

`lcfs_write_erofs_to` is where a node tree becomes an image (`src/libcomposefs/lcfs-writer-erofs.c:1385`). It initializes the header in place, with the magic and version converted to little-endian for the on-disk format:

```c
struct lcfs_erofs_header_s header = {
    .magic = lcfs_u32_to_file(((uint32_t)LCFS_EROFS_MAGIC)),
    .version = lcfs_u32_to_file(((uint32_t)LCFS_EROFS_VERSION)),
    .composefs_version = lcfs_u32_to_file(ctx->options->version),
};
```

It then clones the input tree, rewrites it for overlayfs, and computes the tree (`src/libcomposefs/lcfs-writer-erofs.c:1403`, `src/libcomposefs/lcfs-writer-erofs.c:1410`, `src/libcomposefs/lcfs-writer-erofs.c:1414`). After computing shared xattrs and inode layout (`src/libcomposefs/lcfs-writer-erofs.c:1418`, `src/libcomposefs/lcfs-writer-erofs.c:1422`), it writes the header, pads up to `EROFS_SUPER_OFFSET`, fills in the superblock fields, and writes inodes:

```text
lcfs_write(header)                 // :1431
lcfs_write_pad to EROFS_SUPER_OFFSET  // :1435
set superblock meta_blkaddr/root_nid/xattr_blkaddr/blocks  // :1448-1463
lcfs_write(superblock)             // :1470
write_erofs_inodes(ctx)            // :1476
```

`write_erofs_inodes` walks the tree and writes each inode body through `write_erofs_inode_data` (`src/libcomposefs/lcfs-writer-erofs.c:1045`, per-inode at `src/libcomposefs/lcfs-writer-erofs.c:822`). Back in `lcfs_write_to`, once the format-specific write returns, the fs-verity digest of the whole image is extracted when the caller asked for it (`src/libcomposefs/lcfs-writer.c:432`).

## Things that surprised me

`lcfs_compute_tree` is a single breadth-first pass that does several unrelated jobs at once (`src/libcomposefs/lcfs-writer.c:176`). In the same loop it fixes directory link counts to `2 + number of subdirectories` (`src/libcomposefs/lcfs-writer.c:199`), rejects directory hard links (`src/libcomposefs/lcfs-writer.c:212`), sorts each node's xattrs into canonical order with `qsort` (`src/libcomposefs/lcfs-writer.c:221`), and tracks the minimum mtime across the whole tree (`src/libcomposefs/lcfs-writer.c:225`). The queue is the tree itself: children are appended through the `next` pointer as the walk advances (`src/libcomposefs/lcfs-writer.c:253`).

The mount path is defensive about how the kernel will accept the EROFS image. `lcfs_mount_erofs_ovl` first tries to mount via `/proc/self/fd/N`, and only if that returns `ENOTBLK` does it set up a loop device and retry (`src/libcomposefs/lcfs-mount.c:599`, `src/libcomposefs/lcfs-mount.c:603`). For the overlay on top it falls back to the legacy mount API (`lcfs_mount_ovl_legacy`) when the new API returns `ENOSYS`, because the new API cannot pass escaped directory names (`src/libcomposefs/lcfs-mount.c:625`). The lower-directory string is built by escaping the image mount point and each object directory, joined with `::` or `:` depending on whether data-lower mode is in effect (`src/libcomposefs/lcfs-mount.c:286`).
