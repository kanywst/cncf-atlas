# Adoption & Ecosystem

## Who uses it

The CNCF Incubating announcement (2023-12-19) names four organisations as end users of OpenFeature. flagd has no `ADOPTERS` file in its repository, so these are the only named adopters this deep-dive cites; no others are asserted (4).

| Organisation | Use case | Source |
| --- | --- | --- |
| eBay | Named as an OpenFeature end user | [CNCF blog (2023-12-19)](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) |
| Google | Named as an OpenFeature end user | [CNCF blog (2023-12-19)](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) |
| SAP | Named as an OpenFeature end user | [CNCF blog (2023-12-19)](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) |
| Spotify | Named as an OpenFeature end user | [CNCF blog (2023-12-19)](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) |

Several flag vendors publicly back the standard rather than consume it as end users: LaunchDarkly, Split, CloudBees, and Flagsmith (4)(7).

## Adoption signals

Measured via the GitHub API on 2026-06-24 (11):

- flagd: 934 stars, 119 forks, 122 open issues, repository created 2022-05-26.
- open-feature/spec: 1,192 stars, 55 forks.
- flagd contributors: around 75 (from the GitHub contributors API pagination).

CNCF maturity is Incubating: Sandbox acceptance on 2022-06-17, Incubating promotion voted on 2023-11-21 (3)(4).

## Ecosystem

- `open-feature/spec`: the evaluation API specification that SDKs implement (2).
- Language SDKs: Go, Java, JavaScript, .NET, Python, PHP, Ruby, and others (1)(5).
- OpenFeature Operator: injects flagd as a sidecar on Kubernetes (2)(5).
- OFREP (OpenFeature Remote Evaluation Protocol): the remote-evaluation wire protocol that flagd implements (1)(12).
- Provider implementations connect each flag management system to the standard API (5).
- Integrations: OpenTelemetry trace and metrics emitted natively (`flagd/pkg/runtime/from_config.go:67-82`), Kubernetes CRD sync, and cloud blob storage (S3, GCS, Azure) (1)(12).

## Alternatives

OpenFeature is a standard, so its real "alternatives" are the individual flag products. Some of them also ship an OpenFeature provider, so the choice is often standard plus backend rather than either/or (5)(7).

| Alternative | Differs by |
| --- | --- |
| LaunchDarkly | Commercial SaaS with its own SDKs; offers an OpenFeature provider but is not vendor-neutral by itself |
| Split | Commercial SaaS focused on experimentation and feature delivery |
| CloudBees Feature Management | Commercial flag management, formerly Rollout |
| ConfigCat | Commercial hosted flag service |
| Unleash | Open-source, self-hosted flag platform with its own server and SDKs |
| Flagsmith | Open-source, self-hostable flag platform; submitted OpenFeature to the CNCF |
| GO Feature Flag | Open-source flag solution that integrates with OpenFeature and OFREP |
