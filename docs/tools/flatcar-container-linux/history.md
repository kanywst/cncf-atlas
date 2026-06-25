# History

## Origin

Flatcar descends from CoreOS Container Linux, which CoreOS introduced in 2013 as a Linux distribution dedicated to containers: a read-only root, automatic updates, and an A/B partition scheme for safe upgrades. The build system still carries that ancestry. The `LICENSE` file opens with "Copyright (c) 2006-2013 The Chromium OS Authors" followed by "Copyright (c) 2013-2015 CoreOS, Inc.", because the image tooling was forked from the Chromium OS build system and then carried forward by CoreOS.

In 2018 Red Hat acquired CoreOS, leaving the future of Container Linux uncertain. Kinvolk, a Berlin company founded in 2015, started Flatcar as a drop-in fork of Container Linux so that existing users would have a maintained path forward.

## Timeline

| Year | Milestone |
| --- | --- |
| 2013 | CoreOS introduces Container Linux (read-only root, auto-update, A/B partitions). |
| 2018 | Red Hat acquires CoreOS; Container Linux's future becomes uncertain. |
| 2018 | Kinvolk launches Flatcar as a drop-in fork of Container Linux. |
| 2020-05-26 | CoreOS Container Linux reaches end of life; Flatcar becomes the de facto continuation. |
| 2021-04-29 | Microsoft acquires Kinvolk; Flatcar continues as a community project under Microsoft. |
| 2024-08-02 | CNCF accepts Flatcar at Incubating level (publicly announced 2024-10-29). |

## How it evolved

The defining moment was CoreOS Container Linux's end of life on 26 May 2020. Flatcar had positioned itself as a drop-in replacement, and the EOL turned it into the practical continuation of the project for users who could not move to Fedora CoreOS.

In April 2021 Microsoft acquired Kinvolk. Flatcar continued as a community-driven project under Microsoft's stewardship rather than a closed product.

The codebase has kept its Gentoo/Portage foundation while modernising the OS image. Container runtimes are no longer baked into the base OS; they are composed as systemd-sysext images. The default sysext set in the build declares containerd and docker as the runtimes shipped alongside the OS (`src/build_image:42`).

## Where it stands now

Flatcar entered the CNCF Incubator in 2024 as the foundation's first operating-system distribution. The project ships stable, beta, and alpha channels; the stable line at the time of this deep-dive was `stable-4593.2.3` (June 2026), and the build tree's version manifest pinned `FLATCAR_VERSION=4734.0.0+nightly-20260617-2100` (`src/sdk_container/.repo/manifests/version.txt`). Releases are produced by the Gentoo-based SDK build system in [flatcar/scripts](https://github.com/flatcar/scripts), with governance, issues, and docs tracked in the umbrella [flatcar/Flatcar](https://github.com/flatcar/Flatcar) repository.
