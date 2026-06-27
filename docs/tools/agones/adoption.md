# Adoption & Ecosystem

## Who uses it

The repository does not contain an `ADOPTERS` file at the documented commit, so the public, citable adopter list is short. Ubisoft co-founded the project and runs Agones in production for live multiplayer games, per the CNCF announcement (source 2).

| Organisation | Use case | Source |
| --- | --- | --- |
| Ubisoft | Production multiplayer game servers; co-founder of the project | [CNCF blog](https://www.cncf.io/blog/2026/03/23/agones-moves-to-the-cncf-a-new-era-for-open-source-multiplayer-game-infrastructure/) |

Beyond Ubisoft, no other organisation could be attributed to a reliable first-party source at the documented commit, so none are listed here. Treat conference talks and vendor case studies as the place to look for more named users.

## Adoption signals

- GitHub stars: roughly 6.9k (about 6,879), forks about 925, observed 2026-06-26 (sources 1 and 6).
- Contributors: the CNCF announcement cites more than 250 contributors (source 2).
- Release cadence: frequent minor releases; the documented commit sits on the `1.59.0-dev` line (`install/helm/agones/Chart.yaml:18`).
- Governance: accepted into the CNCF Sandbox on 2025-12-21 (source 3), with the repository moved to the vendor-neutral `agones-dev` org and a shift to community governance announced 2026-03-23 (source 2).

## Ecosystem

- **Kubernetes distributions**: runs on any conformant cluster, including managed GKE, EKS, and AKS, and on-prem.
- **Matchmaking**: commonly paired with Open Match; the matchmaker claims a ready server through the `GameServerAllocation` CRD or the Allocator gRPC API (`pkg/apis/allocation/v1/gameserverallocation.go:52`).
- **Autoscaling**: `FleetAutoscaler` scales a `Fleet`, and the cluster's Cluster Autoscaler adds or removes Nodes underneath.
- **Game engines**: SDKs for Go, C++, C#, Rust, and Node.js under `sdks/`, used from Unity and Unreal to call `Ready`, `Allocate`, `Health`, and `Shutdown`.

## Alternatives

The main alternatives are cloud-proprietary managed game-server services. Agones differs by being Kubernetes-native, cloud-agnostic, and open source: game servers are declarative custom resources managed with standard Kubernetes tooling. The trade-off is that you operate a Kubernetes cluster yourself.

| Alternative | Differs by |
| --- | --- |
| Amazon GameLift | Managed AWS service; less infrastructure to run, but tied to AWS rather than portable Kubernetes resources. |
| Microsoft PlayFab Multiplayer Servers | Managed Azure service bundled with PlayFab backend features; not Kubernetes-native. |
| Edgegap | Managed edge orchestration for game servers; abstracts away the cluster you would run with Agones. |
| Plain Kubernetes (`Deployment` + `Service`) | No game-server lifecycle, no SDK readiness, no allocation or per-server HostPort model; you would rebuild those by hand. |
