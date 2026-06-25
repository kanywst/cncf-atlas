# History

## Origin

KubeVirt began at Red Hat in late 2016 from a single question: could a virtual machine run inside a container and be deployed by Kubernetes? The repository was created on 2016-12-16, and the project was formally launched and open-sourced in January 2017 ([Red Hat: What is KubeVirt?](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt), [InfoQ](https://www.infoq.com/news/2022/06/cncf-kubevirt-incubating-project/)). The goal was to give teams already invested in Kubernetes a way to keep VM-bound workloads without running a second platform.

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Repository created (2016-12-16); prototyping at Red Hat |
| 2017 | Formal launch and open-sourcing |
| 2019 | Accepted to the CNCF Sandbox (2019-09-06) |
| 2020 | Red Hat OpenShift Virtualization (KubeVirt + KVM) reaches GA |
| 2022 | Promoted to CNCF Incubating (2022-04-19) |
| 2023 | v1.0 released; release cadence moved to three times per year |

## How it evolved

The early project tracked Kubernetes closely and shipped frequently. With the v1.0 release in July 2023, the maintainers changed the release model: instead of monthly releases, KubeVirt moved to three releases per year aligned with the Kubernetes release model, signalling a shift toward stability for production users ([CNCF: KubeVirt v1.0 has landed!](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/)).

The architectural through-line has been consistency with Kubernetes. The project states its guiding rule as "if in conflict, then prefer Kubernetes over Virtualization," which is why VMs run inside Pods and reuse the standard scheduler, networking, and storage rather than a parallel control plane ([CNCF v1.0 blog](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/)).

## Where it stands now

KubeVirt is a CNCF Incubating project (promoted 2022-04-19) and releases roughly three times per year. As of 2026-06-24 the latest release was `v1.8.4` (2026-06-16). As of November 2025 the project was reported to be in the CNCF Graduation process with 41 listed adopters ([CNCF projects: KubeVirt](https://www.cncf.io/projects/kubevirt/)). The codebase is Go (`go.mod:1`, `go 1.24.0`) under Apache-2.0 (`LICENSE:1`).
