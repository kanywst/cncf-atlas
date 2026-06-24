# Adoption & Ecosystem

## Who uses it

The organisations below appear in the project's [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md). The two with external corroboration are cited to that source as well.

| Organisation | Use case | Source |
| --- | --- | --- |
| Red Hat | OpenShift Container Platform 4 ships CRI-O as the only supported CRI implementation | [Red Hat blog](https://www.redhat.com/en/blog/red-hat-openshift-container-platform-4-now-defaults-cri-o-underlying-container-engine) |
| Oracle | Linux Cloud Native Environment and Kubernetes Engine, valued for running both runc and Kata | [Oracle docs](https://docs.oracle.com/en/operating-systems/olcne/2/kubernetes/crio_concept.html) |
| SUSE | Default runtime in CaaS Platform v4; also openSUSE Kubic | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |
| Lyft | Production use since 2017 | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |
| Reddit, Adobe | Listed production adopters | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |
| Nestybox | Distributed with Sysbox | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |
| Digital Science, HERE Technologies, Particule, PITS Global Data Recovery Services | Listed adopters | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |

## Adoption signals

Measured from the GitHub API on 2026-06-22 for [cri-o/cri-o](https://github.com/cri-o/cri-o): 5,628 stars, 1,179 forks, 119 watchers, 133 open issues, and roughly 326 contributors enumerated through the API. The latest release at that time was `v1.36.1` (2026-06-03). Releases follow the Kubernetes minor cadence, with recent lines `1.36`, `1.35`, and `1.34` maintained in parallel.

The strongest adoption signal is structural: OpenShift 4 runs CRI-O as its only supported CRI implementation ([Red Hat blog](https://www.redhat.com/en/blog/red-hat-openshift-container-platform-4-now-defaults-cri-o-underlying-container-engine)), which puts CRI-O under every OpenShift 4 cluster.

## Ecosystem

CRI-O is built from shared container components rather than reimplementing them. It delegates execution to runc or crun, monitoring to conmon or conmonrs, images to containers/image, and storage to containers/storage, the same stack Podman and Buildah use (`README.md:113-119`). Networking is any CNI plugin. VM-isolated workloads run through Kata Containers, selected per pod by runtime handler. The Node Resource Interface plugin surface lives in `internal/nri/`.

## Alternatives

The dockershim path was removed from the kubelet in Kubernetes 1.24, leaving CRI-O and containerd as the practical choices for a CRI runtime. CRI-O is the right pick when you run Kubernetes and want a runtime scoped to exactly that, tracking your Kubernetes minor version. containerd fits when you also need a general-purpose runtime usable outside Kubernetes and a richer plugin and snapshotter model.

| Alternative | Differs by |
| --- | --- |
| [containerd](https://github.com/containerd/containerd) | CNCF Graduated, general-purpose; serves both Docker and Kubernetes with a plugin and snapshotter design, where CRI-O is Kubernetes-only and version-locked to it |
| [runc](https://github.com/opencontainers/runc) | An OCI runtime, not a CRI runtime; it is what CRI-O drives through conmon rather than a substitute for CRI-O |
