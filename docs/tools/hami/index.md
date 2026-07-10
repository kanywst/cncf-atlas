# HAMi

> HAMi lets Kubernetes workloads share a physical GPU by device memory and compute percentage, with per-pod limits enforced at runtime, and no changes to the application.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating (accepted Sandbox 2024-08-21, promoted to Incubating 2026-07-02)
- **Language**: Go (`go 1.26.2`)
- **License**: Apache-2.0
- **Repository**: [Project-HAMi/HAMi](https://github.com/Project-HAMi/HAMi)
- **Documented at commit**: `2487a24` (master, 2026-07-07, near tag `v2.9.0`)

## What it is

HAMi (Heterogeneous AI Computing Virtualization Middleware, formerly `k8s-vGPU-scheduler`) is a Kubernetes add-on that carves a single physical GPU into shares. A pod can ask for one GPU plus a memory ceiling in megabytes and a fraction of the compute cores, and several pods can then run on the same card without stepping on each other. The application does not need CUDA changes or a special runtime: it requests resources like `nvidia.com/gpumem` and `nvidia.com/gpucores` and sees a device that looks limited to that budget (`README.md:71-79`).

The work is split across three layers. A scheduler decides which physical GPU a request lands on and records the choice in pod annotations. A device plugin on each node reads that choice, resolves it to a real device, and injects environment variables plus a mount into the container. A separate in-container library called HAMi-core (shipped as `libvgpu.so`) is preloaded into every process and enforces the memory ceiling and core limit at CUDA call time. The scheduler and device plugin are the Go code in this repository; HAMi-core is a C/CUDA library in the separate [Project-HAMi/HAMi-core](https://github.com/Project-HAMi/HAMi-core) repository, pulled in here as the `libvgpu` submodule.

HAMi is vendor-neutral. NVIDIA is the most complete path, but the same interfaces cover Ascend, Cambricon, Hygon, Metax, Mthreads, Iluvatar, and others, each implementing one `Devices` contract (`pkg/device/devices.go:36`). It sits between the Kubernetes scheduler and the kubelet device-plugin API, extending both rather than replacing either.

## When to use it

- You have expensive GPUs that individual workloads underuse, and you want several pods to share one card with real per-pod memory and compute limits.
- You need device sharing across more than one accelerator vendor under a single scheduling model.
- You want fractional GPU requests (memory in MB, compute in percent) without rewriting the application or installing a custom container runtime.
- You want to keep the default Kubernetes scheduler and add GPU-aware placement on top, or combine HAMi with Volcano for batch AI.
- Less of a fit if your cards support MIG and hardware-partition isolation is a hard requirement: HAMi can drive MIG, but its default mode is software isolation through a preloaded library, which is weaker than a hardware boundary.
- Not a training-job or pipeline orchestrator: it schedules and isolates devices, it does not manage job queues, gang scheduling, or workflow state on its own.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a GPU request flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [Project-HAMi/HAMi README](https://github.com/Project-HAMi/HAMi/blob/master/README.md) (accessed 2026-07-09)
2. [HAMi source at pinned commit `2487a24`](https://github.com/Project-HAMi/HAMi) (accessed 2026-07-09)
3. [HAMi project page (CNCF)](https://www.cncf.io/projects/hami/) (accessed 2026-07-10)
4. [\[Sandbox\] HAMi, cncf/sandbox Issue #97](https://github.com/cncf/sandbox/issues/97) (accessed 2026-07-10)
5. [Exploring cloud native projects in sandbox: 13 arrivals from 2024 H2 (CNCF)](https://www.cncf.io/blog/2025/08/11/exploring-cloud-native-projects-in-sandbox-13-arrivals-from-2024-h2/) (accessed 2026-07-10)
6. [HAMi Becomes a CNCF Incubating Project (Dynamia AI)](https://dynamia.ai/blog/hami-cncf-incubating) (accessed 2026-07-10)
7. [Project-HAMi/HAMi-core (libvgpu.so isolation library)](https://github.com/Project-HAMi/HAMi-core) (accessed 2026-07-10)
8. [SF Technology case study (CNCF)](https://www.cncf.io/case-studies/sf-technology/) (accessed 2026-07-10)
9. [KE Holdings Inc. case study (CNCF)](https://www.cncf.io/case-studies/ke-holdings-inc/) (accessed 2026-07-10)
10. [NIO case study (CNCF)](https://www.cncf.io/case-studies/nio/) (accessed 2026-07-10)
11. [How to use Volcano vGPU (HAMi documentation)](https://project-hami.io/docs/installation/how-to-use-volcano-vgpu) (accessed 2026-07-10)
12. [Koordinator: device scheduling GPU share with HAMi](https://koordinator.sh/docs/user-manuals/device-scheduling-gpu-share-with-hami) (accessed 2026-07-10)
13. [HAMi 2025 Year in Review (Dynamia AI)](https://dynamia.ai/blog/hami-2025-recap) (accessed 2026-07-10)
