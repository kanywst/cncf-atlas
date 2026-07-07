# History

## Origin

composefs came out of Red Hat, driven by Alexander Larsson (the author of Flatpak) and Giuseppe Scrivano. The goal was per-file sharing plus runtime verification for two existing systems: the container layers used by podman and the OSTree (libostree) object store used for bootable hosts. The repository on GitHub was created on 2021-10-07 ([source 2](https://api.github.com/repos/containers/composefs)). The first public proposal was a kernel mailing-list RFC on 2022-11-28, covered by LWN as "an opportunistically sharing verified image filesystem" and by Phoronix ([source 5](https://lwn.net/Articles/919931/), [source 10](https://www.phoronix.com/news/Composefs)).

The original RFC proposed composefs as a standalone read-only kernel filesystem module. The kernel community pushed back: rather than a new filesystem, the same result could be had by combining the overlayfs, EROFS, and fs-verity features that already existed. composefs pivoted to that composition design ([source 6](https://lwn.net/Articles/933616/), [source 8](https://blogs.gnome.org/alexl/2023/07/11/composefs-state-of-the-union/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Repository created on GitHub (2021-10-07) ([source 2](https://api.github.com/repos/containers/composefs)). |
| 2022 | First public kernel RFC for a standalone composefs filesystem (2022-11-28) ([source 5](https://lwn.net/Articles/919931/)). |
| 2023 | Pivot to overlayfs + EROFS + fs-verity composition; the required overlayfs fs-verity support landed in Linux 6.6-rc1, and composefs 1.0 shipped on 2023-09-26 ([source 6](https://lwn.net/Articles/933616/), [source 7](https://blogs.gnome.org/alexl/2023/09/26/announcing-composefs-1-0/)). |
| 2025 | Accepted as a CNCF Sandbox project on 2025-01-21 ([source 3](https://www.cncf.io/projects/composefs/), [source 4](https://github.com/cncf/sandbox/issues/311)). |

## How it evolved

The defining shift was abandoning the standalone-filesystem approach. Once the maintainers accepted the kernel community's verdict, the work moved into two places: getting the missing piece (fs-verity support in overlayfs) merged upstream, and stabilizing the on-disk image format on the composefs side. With overlayfs fs-verity support in Linux 6.6-rc1, every kernel change composefs needed was upstream, so the project froze its image format and cut 1.0 ([source 7](https://blogs.gnome.org/alexl/2023/09/26/announcing-composefs-1-0/)).

The earlier exploration is visible in the OSTree integration writeup, which described mounting a composefs image that points into the OSTree object store instead of checking files out into a regular directory ([source 9](https://blogs.gnome.org/alexl/2022/06/02/using-composefs-in-ostree/), tracked in [source 11](https://github.com/ostreedev/ostree/issues/2867)).

## Where it stands now

composefs is a CNCF Sandbox project as of 2025-01-21 ([source 3](https://www.cncf.io/projects/composefs/)). At the commit documented here (`298edd6`, 2026-06-12) the `meson.build` version is `1.0.8` (`src/meson.build:4`), and the documented commit sits on `main` after that tag. The codebase is a focused C library (`liblcfs`) plus a handful of command-line tools, and Alexander Larsson remains the dominant contributor (609 commits per the GitHub contributors API, [source 2](https://api.github.com/repos/containers/composefs)). The stated direction is to serve as a backing format for container and bootable-host systems rather than to grow into a general-purpose filesystem.
