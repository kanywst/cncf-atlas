# Adoption & Ecosystem

## Who uses it

The repository has no ADOPTERS file, and the CNCF project page lists no named adopters, so this deep-dive names no organizations. Claiming a company runs DevSpace without a citable source would be fabrication, and none of the usual sources (an ADOPTERS file, a CNCF case study, a KubeCon talk, an engineering blog tied to a named org) turned one up.

There is one documented user account worth its honest weight: an independent practitioner blog by Ugur Elveren describes using KIND, DevSpace, and DevContainers together as a Kubernetes development environment for large teams (Ugur Elveren). That is a personal usage write-up, not an organizational adoption, and it is cited here as exactly that.

## Adoption signals

Because named adopters are not citable, the measurable signals carry the weight. As of 2026-07-08, from the GitHub repository: 5,080 stars, 412 forks, roughly 124 contributors (the last page of the contributors API), and 312 releases, with `v6.4.0-rc.1` the latest tag (GitHub repository and API).

The CNCF project page reports different, larger numbers because they come from DevStats with a different counting method: all-time contributors around 647 and contributing organizations around 207 (both up year over year), observed 2026-07-08 (CNCF project page). These are not comparable to the GitHub contributor count above; DevStats counts contribution activity across a wider surface than the repository's author list. The project also carries an OpenSSF Best Practices badge (project #6945, linked from the README).

## Ecosystem

DevSpace is client-only and leans on backends the user already runs. For image builds it selects among Docker, BuildKit, kaniko, or a custom builder (`pkg/devspace/build/builder/`). For deploys it drives Helm, kubectl manifests, or kustomize (`pkg/devspace/deploy/`). Its own steward, Loft Labs, also maintains vcluster (virtual clusters), and promotes pairing the two so each developer gets an isolated virtual cluster to develop in with DevSpace (Loft Labs). The `devspace.yaml` imports feature lets teams share base configuration across repositories, which is the project's answer to standardizing dev workflows across many services.

## Alternatives

DevSpace competes in the Kubernetes inner-loop development category. The dividing line is how far a tool goes toward developing inside the cluster (pod replacement plus two-way sync plus terminal/SSH) versus standardizing a build and deploy pipeline. All of the main alternatives are outside the CNCF.

| Alternative | Differs by |
| --- | --- |
| Skaffold (Google) | Standardizes a build/deploy/dev pipeline from a declarative config, with file sync and a continuous dev mode; leans toward pipeline standardization rather than replacing the pod to develop in-cluster |
| Tilt | Describes multi-service dev loops in a Starlark `Tiltfile` with strong live-update and a UI; DevSpace uses shell pipelines and `devspace.yaml` instead |
| Garden | Organizes build, test, and deploy as a stack graph, leaning toward CI and test integration more than in-cluster editing |
| Okteto | Also syncs code into a development container to develop in-cluster, the closest direct match; Okteto pairs its CLI with a managed platform, while DevSpace is client-only |
