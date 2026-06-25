# Flatcar Container Linux

> A minimal, immutable Linux distribution for running containers, with an A/B partition layout and automatic atomic updates.

- **Category**: Runtime
- **CNCF maturity**: Incubating
- **Language**: Shell and Python
- **License**: BSD-3-Clause (the `scripts` repository)
- **Repository**: [flatcar/scripts](https://github.com/flatcar/scripts)
- **Documented at commit**: `d2c217c` (branch `main`, June 2026)

## What it is

Flatcar Container Linux is an operating system built to do one job: run containers. There is no package manager on the running host. The `/usr` filesystem is mounted read-only and protected by dm-verity, and the OS ships as a whole image rather than a set of installable packages.

Updates are atomic. A new image is written to a second `/usr` partition while the system runs from the first, and a reboot swaps them. If the new image fails to boot, the bootloader falls back to the previous one. This is the same model CoreOS Container Linux introduced; Flatcar is the maintained continuation of that lineage.

The implementation lives in [flatcar/scripts](https://github.com/flatcar/scripts), a Gentoo/Portage-based build system that emerges pre-built binary packages into a root filesystem and bakes it into a GPT image. The umbrella repository [flatcar/Flatcar](https://github.com/flatcar/Flatcar) holds documentation, governance, and the issue tracker.

## When to use it

- You run Kubernetes or plain container workloads and want the host OS to be a managed, replaceable unit rather than a server you patch in place.
- You need the same OS across multiple clouds and bare metal, configured declaratively at first boot with Ignition.
- You want automatic updates with rollback, and a conservative release cadence that avoids breaking running containers.
- You want to keep SSH and Docker compatibility for debugging, rather than a fully API-only host.

It is a poor fit when you need to install arbitrary system packages on the running host, or when a single-cloud appliance OS already covers your whole fleet.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how an image is built.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [flatcar/scripts](https://github.com/flatcar/scripts), the image build and composition scripts (pinned commit `d2c217c`).
2. [Flatcar brings Container Linux to the CNCF Incubator](https://www.cncf.io/blog/2024/10/29/flatcar-brings-container-linux-to-the-cncf-incubator/), CNCF blog.
3. [Flatcar Container Linux project page](https://www.cncf.io/projects/flatcar-container-linux/), CNCF.
4. [Flatcar accepted into CNCF at incubating level](https://opensource.microsoft.com/blog/2024/10/29/flatcar-accepted-into-cncf-at-incubating-level/), Microsoft Open Source.
5. [Propose Flatcar for Incubation](https://github.com/cncf/toc/pull/991), cncf/toc PR #991.
6. [flatcar/Flatcar ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md).
7. [Flatcar Container Linux enters new era after CoreOS End-of-Life](https://kinvolk.io/blog/2020/02/flatcar-container-linux-enters-new-era-after-coreos-end-of-life-announcement), Kinvolk.
8. [Microsoft acquires Kinvolk](https://azure.microsoft.com/en-us/blog/microsoft-acquires-kinvolk-to-accelerate-containeroptimized-innovation/), Azure blog.
