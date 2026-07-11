# Eraser

> Eraser removes a list of non-running container images from every node in a Kubernetes cluster, and can scan with Trivy to delete vulnerable images automatically, without ever touching an image a running container depends on.

- **Category**: Security & Compliance
- **CNCF maturity**: Sandbox (accepted 2023-06-30)
- **Language**: Go (`go 1.24.0`)
- **License**: Apache-2.0
- **Repository**: [eraser-dev/eraser](https://github.com/eraser-dev/eraser)
- **Documented at commit**: `20576a24` (`git describe` = `v1.5.0-beta.0-57-g20576a24`)

## What it is

Eraser is a Kubernetes controller that deletes container images from cluster nodes. The kubelet caches every image it pulls, and its built-in image garbage collection only fires on disk-usage thresholds. It never looks at whether a cached image is vulnerable or unwanted. Old images with known CVEs stay on nodes, taking up space and enlarging the attack surface. Eraser closes that gap by deleting images on a policy rather than on disk pressure (`src/README.md:11`).

It works in two modes. In manual mode an administrator lists images to delete in an `ImageList` custom resource, and Eraser removes each one from every node where no container is using it. In scan mode Eraser periodically collects the images on all nodes, scans them with Trivy, and deletes any non-running image whose vulnerabilities cross a threshold. Turning scanning off leaves a plain scheduled image cleaner (`src/README.md:11`). Both modes share one rule: an image that a running container references is never deleted, and that guarantee is built from live CRI (Container Runtime Interface) data rather than trust in the kubelet.

Eraser is for platform and security teams that need node image hygiene as a cluster-wide policy: removing a compromised tag everywhere at once, or continuously pruning vulnerable layers that the kubelet would otherwise keep. It runs as a controller plus short-lived per-node worker Pods, not as a resident agent on every node.

## When to use it

- You need to delete a specific image (a compromised tag, a leaked build) from every node in the cluster and confirm it is gone where nothing is running it.
- You want vulnerable images pruned continuously based on a scanner verdict, not just when the disk fills up.
- You want a plain scheduled cleanup of unused images across nodes, with scanning disabled.
- You need the removal to be safe: images in use by running containers must be left alone.
- Not the right fit if you only need to reclaim disk space, since the kubelet's own image garbage collection already does that on a threshold.
- Not a scanner or a runtime admission gate. Eraser deletes images that already exist on nodes; it does not stop a vulnerable image from being pulled or scheduled.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a cleanup flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working cleanup.

## Sources

1. [eraser-dev/eraser (GitHub)](https://github.com/eraser-dev/eraser) (accessed 2026-07-08)
2. [CNCF project page: Eraser](https://www.cncf.io/projects/eraser/) (accessed 2026-07-08)
3. [Eraser source at pinned commit 20576a24](https://github.com/eraser-dev/eraser/tree/20576a24c512feb83c26ed867353d4143717d798) (accessed 2026-07-08)
4. [CNCF Sandbox application: Eraser (cncf/sandbox issue #24)](https://github.com/cncf/sandbox/issues/24) (accessed 2026-07-08)
5. [KubeCon NA 2023: Eraser: Cleaning up Vulnerable Images from Kubernetes Nodes](https://kccncna2023.sched.com/event/1R2q9/) (accessed 2026-07-08)
6. [Talk archive: Eraser (Peter Engelbert & Ashna Mehrotra)](https://talks.container-security.site/kubecon%20+%20cloudnative%20north%20america%202023/Eraser-Cleaning-up-Vulnerable-Images-from-Kuberne/) (accessed 2026-07-08)
7. [Open at Microsoft: Cleaning Your Kubernetes Clusters](https://learn.microsoft.com/en-us/shows/open-at-microsoft/cleaning-your-kubernetes-clusters) (accessed 2026-07-08)
8. [Use Image Cleaner on Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/image-cleaner) (accessed 2026-07-08)
