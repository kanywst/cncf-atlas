# composefs

> A read-only mountable filesystem that stores only metadata and shares file content from an external content-addressed store, with optional fs-verity sealing.

- **Category**: Storage & Database
- **CNCF maturity**: Sandbox
- **Language**: C (C11)
- **License**: GPL-2.0-only OR Apache-2.0
- **Repository**: [containers/composefs](https://github.com/containers/composefs)
- **Documented at commit**: `298edd6` (2026-06-12, post-v1.0.8 main)

## What it is

composefs builds a mountable filesystem tree out of three features that already ship in the mainline Linux kernel: overlayfs (a stacking filesystem that layers an upper directory over a lower one), EROFS (Enhanced Read-Only File System, a compact read-only on-disk format), and fs-verity (a kernel mechanism that verifies a file's content against a Merkle-tree digest). The core idea is that composefs stores no persistent data of its own. It writes an EROFS image that holds only metadata (names, permissions, timestamps, directory structure), while the actual non-empty regular files live separately in a content-addressed backing store (`src/README.md:14-49`).

Each metadata inode carries overlayfs extended attributes that point at the real file: `trusted.overlay.redirect` gives the location in the backing store, and `trusted.overlay.metacopy` carries the file's fs-verity digest (`src/README.md:45-49`, `src/README.md:78-87`). At mount time the EROFS image becomes the overlay lower layer, and overlayfs resolves each file through those attributes.

Because content is content-addressed, two images whose metadata differs (different timestamps or ownership) but whose file content is identical will reference the same backing file. That file is then shared on disk and in the page cache across every mount that uses it (`src/README.md:70-77`). The project targets versioned, immutable executable trees: container images and bootable host systems.

## When to use it

- You ship many immutable filesystem trees (container images, operating system images) that share large amounts of identical file content and want that content stored and page-cached once.
- You need runtime integrity for a root filesystem and want overlayfs to verify each file's fs-verity digest as it is used, plus an option to seal the metadata image itself.
- You build on bootc, OSTree, or containers/storage, which already integrate composefs as a backing format.
- Not a fit when you need a writable general-purpose filesystem: the composefs image is read-only metadata, and writes belong to a separate overlay upper layer.
- Not a fit on kernels without overlayfs, EROFS, and (for verification) fs-verity support, since composefs is a composition of those features rather than a standalone driver.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [containers/composefs README](https://github.com/containers/composefs)
2. [GitHub REST API: repos/containers/composefs](https://api.github.com/repos/containers/composefs)
3. [composefs CNCF project page](https://www.cncf.io/projects/composefs/)
4. [Sandbox application issue #311](https://github.com/cncf/sandbox/issues/311)
5. [Composefs: an opportunistically sharing verified image filesystem (LWN)](https://lwn.net/Articles/919931/)
6. [A decision on composefs (LWN)](https://lwn.net/Articles/933616/)
7. [Announcing composefs 1.0](https://blogs.gnome.org/alexl/2023/09/26/announcing-composefs-1-0/)
8. [Composefs state of the union](https://blogs.gnome.org/alexl/2023/07/11/composefs-state-of-the-union/)
9. [Using Composefs in OSTree](https://blogs.gnome.org/alexl/2022/06/02/using-composefs-in-ostree/)
10. [Red Hat Developers Announce Work On New "Composefs" File-System (Phoronix)](https://www.phoronix.com/news/Composefs)
11. [ostree composefs tracking issue #2867](https://github.com/ostreedev/ostree/issues/2867)
12. [composefs-rs (Rust bindings)](https://github.com/containers/composefs-rs)
