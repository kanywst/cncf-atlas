# History

## Origin

Lima started in 2021 as a VM launcher to bring containerd and nerdctl to macOS, where there was no native way to run Linux containers. The repository was created on 2021-05-14. It was authored by Akihiro Suda, a maintainer of containerd and nerdctl. The selling point was that a Linux VM should feel local: host directories are mounted automatically and guest ports are forwarded back to the host, which is why the project is often described as "WSL2 for macOS".

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Repository created on 2021-05-14, focused on containerd and nerdctl on macOS. |
| 2022 | Accepted into the CNCF Sandbox on 2022-09-14. |
| 2025 | Promoted to CNCF Incubating by TOC vote on 2025-10-14, announced 2025-11-11. v2.0 shipped 2025-11-06 with a focus on secure AI workflows. |
| 2026 | v2.1 added macOS guest support and stronger AI agent safety. v2.1.3 released 2026-06-19. |

## How it evolved

The scope widened from containerd-centric tooling to a general VM manager: Docker, Podman, Kubernetes, and arbitrary Linux distributions, with host support extending to macOS, Linux, NetBSD, and Windows. Templates under `templates/` ship ready-to-run images for Ubuntu, Debian, Fedora, Alpine, and others.

The v2.0 release reframed Lima around secure AI workflows. The stated use case is isolating an AI coding agent inside a VM so it cannot reach host files or commands directly. v2.1 continued in that direction with macOS guests and additional agent safety controls. These shifts are documented in the CNCF release blog posts.

## Where it stands now

Lima is a CNCF Incubating project. The latest release at the time of writing is v2.1.3 (2026-06-19). The repository carries about 215 contributors and the codebase is roughly 50,000 lines of Go across `pkg` and `cmd`. Governance and community process are documented at the project site, and a user-stories discussion (#2390) was opened to collect adoption evidence for CNCF due diligence.

## Sources

1. [lima-vm/lima README](https://github.com/lima-vm/lima), accessed 2026-06-24.
2. [Lima becomes a CNCF incubating project](https://www.cncf.io/blog/2025/11/11/lima-becomes-a-cncf-incubating-project/), CNCF, 2025-11-11.
3. [CNCF project page: Lima](https://www.cncf.io/projects/lima/), accessed 2026-06-24.
4. [Lima v2.0: New features for secure AI workflows](https://www.cncf.io/blog/2025/12/11/lima-v2-0-new-features-for-secure-ai-workflows/), CNCF, 2025-12-11.
5. [Lima v2.1: macOS guests and enhanced AI agent safety](https://www.cncf.io/blog/2026/03/25/lima-v2-1-macos-guests-and-enhanced-ai-agent-safety/), CNCF, 2026-03-25.
6. [Discussion #2390: user stories for CNCF due diligence](https://github.com/lima-vm/lima/discussions/2390), accessed 2026-06-24.
7. [GitHub REST API: repos/lima-vm/lima](https://api.github.com/repos/lima-vm/lima), accessed 2026-06-24.
