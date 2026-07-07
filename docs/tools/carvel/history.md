# History

## Origin

Carvel began as a reaction to monolithic Kubernetes deployment tooling. Dmitriy Kalinin and Nima Kaviani found the existing tools hard to debug because each one bundled fetching, templating, and applying into a single opaque flow. They applied the UNIX philosophy instead: build small tools that each do one thing well and compose them with pipes. That design is described in the project's own [Introduction to Carvel](https://carvel.dev/blog/introduction-to-carvel-blog-post/).

The name reflects the same idea. "Carvel" is a shipbuilding technique where hull planks are laid edge to edge to form a smooth hull, used here as a metaphor for joining focused tools into a smooth whole. The naming and sponsorship history is recorded in [Carvel Sets Sail for the CNCF Sandbox](https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/).

## Timeline

| Year | Milestone |
| --- | --- |
| 2018-2019 | The individual tools (`ytt`, `kapp`, `kbld`, `imgpkg`, `vendir`) are published in stages, under the "k14s" name. |
| 2019 | The `kapp-controller` repository is created (2019-11-06), adding an in-cluster reconciler to the tool suite. |
| 2020 | The project is rebranded from "k14s" to "Carvel"; VMware (Tanzu) sponsors it. |
| 2022 | Carvel is accepted into the CNCF Sandbox on 2022-09-14. |

## How it evolved

The suite started life as "Kubernetes Tools", shortened to "k14s", and was rebranded to "Carvel" in August 2020. The organisation home moved with it: from `github.com/k14s`, to `vmware-tanzu/carvel`, and now to `carvel-dev`. A visible trace of that history remains in the generated resources, whose API group and annotations still carry the `k14s.io` suffix; for example the `App` custom resource is served under `kappctrl.k14s.io/v1alpha1`. This history is documented in the [VMware OSS blog](https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/).

The donation to CNCF in 2022 is recorded both on the [CNCF project page](https://www.cncf.io/projects/carvel/) and in the project's own [Project Carvel has joined the CNCF](https://carvel.dev/blog/carvel-cncf-sandbox/) announcement.

## Where it stands now

Carvel is a CNCF Sandbox project. The umbrella repository `carvel-dev/carvel` holds documentation and community material, while implementation lives in the individual tool repositories. `kapp-controller` is the most architecturally substantial of them and is the subject of this deep-dive. This deep-dive is pinned to release v0.60.3 (commit `be1faef`). The repository remained active through 2026, with its last push on 2026-06-22 as observed via the GitHub API on 2026-06-26.
