# History

## Origin

Kubernetes came out of Google. It builds on a decade and a half of running production workloads at scale with an internal system called Borg, plus its successor Omega, and folds in ideas from the wider community ([README.md:13](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/README.md#L13)). Google describes Kubernetes as its third generation of container management, carrying over the operational lessons from Borg ([Google Cloud origin story](https://cloud.google.com/blog/products/containers-kubernetes/from-google-to-the-world-the-kubernetes-origin-story)).

The project was proposed inside Google in 2013 by Craig McLuckie, Joe Beda, and Brendan Burns, with Brian Grant and Tim Hockin joining soon after. Its internal codename was "Project 7", a Star Trek reference (Seven of Nine) that explains the seven spokes in the logo. The name itself is Greek for "helmsman" ([Wikipedia: Kubernetes](https://en.wikipedia.org/wiki/Kubernetes)). The repository was opened as open source on 2014-06-06 ([IBM: History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2014 | Released as open source on 2014-06-06 |
| 2015 | 1.0 released at OSCON on 2015-07-21; Google and the Linux Foundation announce the CNCF and donate Kubernetes |
| 2016 | Accepted into the CNCF as an Incubating project on 2016-03-10 |
| 2018 | Promoted to Graduated on 2018-03-06, the CNCF's first graduation |

Release and graduation dates are from [IBM](https://www.ibm.com/think/topics/kubernetes-history) and [CNCF](https://www.cncf.io/projects/kubernetes/).

## How it evolved

Kubernetes moved from a Google project to a community-governed one through the CNCF. It was accepted as Incubating in March 2016 and graduated in March 2018, the first project to do so under the CNCF maturity model ([CNCF: Kubernetes](https://www.cncf.io/projects/kubernetes/)). The codebase is a monorepo: components live under `cmd/` and `pkg/`, while libraries that other projects consume are developed under `staging/src/k8s.io/*` and synced out to standalone repositories such as `k8s.io/client-go` and `k8s.io/apimachinery`.

## Where it stands now

Kubernetes ships on a regular minor-release cadence. At the pinned commit the master branch is in the v1.37 development cycle; the most recent alpha tag is `v1.37.0-alpha.1` and the latest stable release is `v1.36.2`, published on 2026-06-12. The project is governed through CNCF and SIG structure rather than a single vendor, and contributor counts have grown by nearly 1000% since 2016 ([IBM: History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history)).
