# History

## Origin

OpenFeature exists to stop feature flag code from being locked to one vendor. Before it, each flag product (LaunchDarkly, Split, ConfigCat, and others) shipped its own SDK, so adopting or replacing a flag system meant rewriting evaluation calls across an application. OpenFeature defines a vendor-neutral evaluation API and a `provider` plug-in point, so the flag backend can change without touching application code (5)(7).

The project was submitted to the CNCF as a Sandbox project by Flagsmith in 2022, and it grew as a community standardisation effort with public support from several flag vendors. It did not emerge from a merger of two vendors (7)(4).

The flagd repository, the reference backend this deep-dive reads, was created on 2022-05-26 (11).

## Timeline

| Year | Milestone |
| --- | --- |
| 2022 | Flagsmith submits OpenFeature to the CNCF; flagd repository created 2022-05-26 (7)(11) |
| 2022 | Accepted into the CNCF Sandbox on 2022-06-17 (3) |
| 2023 | TOC votes to promote OpenFeature to Incubating on 2023-11-21; announced 2023-12-19 (3)(4) |
| 2023 | CNCF blog names eBay, Google, SAP, and Spotify as end users (4) |
| 2026 | flagd tag `flagd/v0.16.0` at the commit documented here (1) |

## How it evolved

OpenFeature started as the evaluation API plus language SDKs. Remote evaluation came later: OFREP (the OpenFeature Remote Evaluation Protocol) standardises the wire format for evaluating flags over the network, and flagd implements it (1)(12).

flagd itself is a monorepo that releases three artifacts independently: the `flagd` daemon, the reusable `core` library, and the `flagd-proxy` (1). The evaluation surface has grown without breaking older clients: flagd serves three protocol versions (a deprecated schema v1, evaluation v1, and evaluation v2 with optional value and variant) on the same HTTP handler, multiplexed at request time (`flagd/pkg/service/flag-evaluation/connect_service.go:177-181`).

## Where it stands now

OpenFeature is a CNCF Incubating project (3)(4). flagd is the actively developed reference backend (around 75 contributors observed via the GitHub API on 2026-06-24, with 934 stars and 119 forks at that date) (11). The monorepo continues to release `flagd`, `core`, and `flagd-proxy` on separate version tracks, with `flagd/v0.16.0` and `core/v0.16.0` at the documented commit (1). The project's stated direction is to keep the evaluation API stable and vendor-neutral while expanding sync sources and remote-evaluation support (5)(12).
