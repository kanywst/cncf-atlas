# Adoption & Ecosystem

## Who uses it

The following are listed in the project's ADOPTERS file as production users, and several are also named in the CNCF incubation announcement.

| Organisation | Use case | Source |
| --- | --- | --- |
| Alibaba Cloud | Powers ACK ONE, BizWorks, and SAE | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |
| China Merchants Bank | Application delivery platform | [CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/) |
| ByteDance | Containerized game platform | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |
| Baidu | MEG microservices | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |
| NetEase Games | Application delivery | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |
| Springer Nature | Application delivery | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |

The ADOPTERS file lists more production users, including JD Cloud, China Mobile Cloud, Li Auto, XPeng Motors, Geely Auto, Shein, OceanBase, wasmCloud, and Vortexa. A separate development and testing section names Intuit, Siemens Technology, HSBC, Mercedes-Benz Group China, Guidewire, Trendyol, DaoCloud, and Didi Chuxing ([ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md)).

## Adoption signals

Measured from the GitHub API on 2026-06-24:

- 7,833 stars
- 1,030 forks
- 253 contributors
- 214 open issues

The repository was created on 2020-07-03. The latest stable tag is `v1.10.8`, and the latest pre-release is `v1.11.0-alpha.3` (2026-04-13). At the CNCF incubation review, the project reported growth from 90+ to 290+ contributors and from 20+ to 70+ contributing organizations ([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/)).

## Ecosystem

KubeVela is built to wrap other tools rather than replace them. It can deliver Helm charts directly, and it treats Crossplane CRDs as native components ([KubeVela docs](https://kubevela.io/docs/)). A community Terraform controller renders Terraform modules as components, and there is an integration with KCL as an alternative configuration language ([KCL + KubeVela](https://www.kcl-lang.io/blog/2023-12-15-kubevela-integration)). The addon system under `src/pkg/addon` packages further extensions. A known pattern combines Argo CD, Crossplane, and KubeVela in one delivery stack ([KubeVela talk](https://kubevela.io/videos/talks/en/devops-toolkit-2/)).

## Alternatives

KubeVela's distinguishing trait is an OAM-based, application-centric abstraction that bundles workflow and multi-cluster delivery into a single control plane. The flexibility of its CUE module system is the strength; the trade-off is that complexity moves to the platform configuration side ([LibHunt comparison](https://www.libhunt.com/compare-kubevela-vs-crossplane)).

| Alternative | Differs by |
| --- | --- |
| Helm | Packages and templates raw Kubernetes manifests; KubeVela sits a layer above and can deliver a Helm chart as one component ([KubeVela docs](https://kubevela.io/docs/)) |
| Argo CD | Git-driven sync of manifests; a different layer, and the two are often combined rather than swapped ([KubeVela talk](https://kubevela.io/videos/talks/en/devops-toolkit-2/)) |
| Crossplane | Provisions cloud infrastructure via CRDs; KubeVela consumes Crossplane CRDs as native components ([KubeVela docs](https://kubevela.io/docs/)) |
