# Adoption & Ecosystem

## Who uses it

The clearest adoption is the public instance at `artifacthub.io`, run by the CNCF, which indexes artifacts from many CNCF projects. The repository's `ADOPTERS.md` lists only that instance and invites organizations running their own internal instance to add themselves. No third-party adopter is named there, so this deep-dive does not list any. The README mentions Consul (HashiCorp) and Google, but only as examples of the "official" status flag, not as adopters.

| Organisation | Use case | Source |
| --- | --- | --- |
| CNCF | Runs the public `artifacthub.io` index | [ADOPTERS.md](https://github.com/artifacthub/hub/blob/master/ADOPTERS.md), [CNCF project page](https://www.cncf.io/projects/artifact-hub/) |

## Adoption signals

Because named adopters are scarce, GitHub and CNCF signals are the measurable proxy (observed 2026-06-24):

- Stars: 2,048; forks: 302.
- Named contributors: 48.
- Repository created 2020-01-14; recent activity through 2026-06-23.
- The CNCF announcement cites a community of 41 volunteers at the time of Incubating.

## Ecosystem

Artifact Hub integrates directly with more than twenty artifact kinds, defined as `RepositoryKind` values (`internal/hub/repo.go:50`) and implemented under `internal/tracker/source/`. These include Helm, OLM, Tekton, Krew, Kyverno, OPA, Gatekeeper, KEDA, Falco, Backstage, Meshery, Keptn, Radius, and KCL. It uses Trivy for vulnerability scanning (`internal/scanner/alerts.go:10`), cosign and OCI signatures for signature verification, and OPA for authorization (`cmd/hub/main.go:56`). Self-hosting is done with the official Helm chart under `charts/artifact-hub`.

## Alternatives

Artifact Hub indexes artifacts; it does not host them. That is the dividing line against registries.

| Alternative | Differs by |
| --- | --- |
| Helm Hub (deprecated) | The predecessor; Helm-only, while Artifact Hub spans many kinds |
| OperatorHub.io | OLM operators only; Artifact Hub includes OLM as one of many kinds |
| Harbor / OCI registries / Docker Hub | Host and serve artifact bytes; Artifact Hub only indexes and links back |
