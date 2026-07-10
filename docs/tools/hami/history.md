# History

## Origin

HAMi began as `k8s-vGPU-scheduler`, a GPU-sharing project from the Chinese AI company 4Paradigm. The GitHub repository was created on 2021-09-14, and the README still records the former name (`README.md:23`). The problem it addressed is the one every GPU cluster hits: a single training or inference pod often uses a fraction of a card's memory and compute, but Kubernetes hands out GPUs whole, so the rest of the card sits idle. The project set out to let several pods share one card with real per-pod limits, without asking applications to change.

The in-container isolation library, HAMi-core, has a separate lineage. It was designed by engineers from Dynamia AI and NVIDIA, and later gathered maintainers from 4Paradigm and others, which turned it into a multi-vendor effort rather than a single company's tool (Dynamia AI blog). It ships as `libvgpu.so` and lives in its own repository, referenced from the main tree as the `libvgpu` submodule (`.gitmodules`).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Repository created as `k8s-vGPU-scheduler` at 4Paradigm (2021-09-14) |
| 2024 | First tagged releases (`v1.0.0.0`, 2024-07-25); CNCF Sandbox application filed (cncf/sandbox #97, 2024-04-15); accepted as a Sandbox project (2024-08-21) |
| 2026 | Active `v2.x` release line (`v2.9.0`, 2026-05-19); promoted to CNCF Incubating (2026-07-02); documented here at `2487a24` |

## How it evolved

Two shifts stand out. The first is the release-numbering reset. Early tags used a four-part scheme (`v1.0.0.0` through `v1.0.0.3`, plus an old `hami-2.3` tag), and the project later moved to standard `v2.x.y` semantic versioning, with `v2.9.0` cut on 2026-05-19. The change matches the move from a single-company tool to a project with a broader contributor base.

The second is governance. HAMi applied to the CNCF Sandbox on 2024-04-15, with the application recording 4Paradigm as the original owner (cncf/sandbox #97), and was accepted on 2024-08-21 as one of the 2024 H2 sandbox arrivals (CNCF blog). On 2026-07-02 it was promoted to Incubating (CNCF project page; Dynamia AI blog). Note a discrepancy at the pinned commit: the README still describes HAMi as a CNCF Sandbox project (`README.md:25`), because that text was written before the Incubating vote and had not been updated when this commit was cut. The current maturity is Incubating; this deep-dive follows the CNCF project page rather than the stale README line.

## Where it stands now

HAMi is an active CNCF Incubating project with a steady release cadence on the `v2.x` line. Its scope has widened well past NVIDIA: the `pkg/device` tree carries implementations for Ascend, Cambricon, Hygon, Metax, Mthreads, Iluvatar, Enflame, Kunlun, AWS Neuron, Biren, VastAI, and AMD, each satisfying the same `Devices` interface (`pkg/device/devices.go:36`). The stated direction is a vendor-neutral, in-cluster layer for fractional accelerator sharing that plugs into the default scheduler and integrates with batch systems such as Volcano and Koordinator (HAMi documentation; Koordinator docs).
