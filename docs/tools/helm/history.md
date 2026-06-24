# History

## Origin

Helm started at Deis, a startup, in October 2015. It was first shown at the inaugural KubeCon in San Francisco. The team took `deisctl`, their existing tool, and rewrote it for Kubernetes, modeling the result on package managers like Homebrew, apt, and yum. The goal was a package manager for Kubernetes. That first version is now called Helm Classic. See the [project history](https://helm.sh/community/history/) and [Helm 3 Preview pt1](https://helm.sh/blog/helm-3-preview-pt1/).

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | Deis builds Helm and presents it at the first KubeCon (Helm Classic). |
| 2016 | Deis and Google's Kubernetes Deployment Manager team merge efforts in Seattle and decide to build Helm 2; the project moves under Kubernetes. |
| 2017 | Microsoft acquires Deis. |
| 2018 | Helm becomes an independent project and joins CNCF as incubating. |
| 2019 | Helm 3 ships: Tiller is removed and the client talks to the Kubernetes API directly. |
| 2020 | CNCF graduates Helm (the 10th graduated project). |
| 2025 | Helm 4 ships at KubeCon NA with native server-side apply and a redesigned plugin model. |

## How it evolved

The 2016 merger with Google's Deployment Manager team produced Helm 2. The server-side parts of Deployment Manager became Tiller, an in-cluster component that held release state and applied changes on the client's behalf. See the [project history](https://helm.sh/community/history/).

In 2018 Helm separated from the Kubernetes subproject and entered CNCF as an incubating project, bringing related work such as Monocular, Chart Repo, and ChartMuseum into its orbit. See the [project history](https://helm.sh/community/history/).

Helm 3, released in late 2019, removed Tiller entirely. The client now talks to the Kubernetes API directly with the user's own credentials, which simplified the security and RBAC story because there was no longer a privileged in-cluster service to secure. See the [CNCF Helm 3 alpha announcement](https://www.cncf.io/blog/2019/05/16/helm-3-preview-helm-3-alpha-release-available-and-whats-next/). On 2020-04-30 Helm reached CNCF Graduated status. See the [CNCF graduation announcement](https://www.cncf.io/announcements/2020/04/30/cloud-native-computing-foundation-announces-helm-graduation/) and [Microsoft's note](https://opensource.microsoft.com/blog/2020/05/01/helm-package-manager-kubernetes-now-cncf-graduated-project).

## Where it stands now

Helm 4 shipped in November 2025 at KubeCon NA, the first major release in roughly six years. It added native server-side apply and reworked the plugin system around WASM. This deep-dive reads the v4 line: the pinned commit `74fa4fce` sits a few commits past tag `v4.2.2` on `main`, with `internal/version/version.go` reporting `version = "v4.2"` and the Go module path `helm.sh/helm/v4`.
