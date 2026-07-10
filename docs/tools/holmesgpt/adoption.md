# Adoption & Ecosystem

## Who uses it

The two named adopters below come from the project's `ADOPTERS.md`. Microsoft is also a co-maintainer, so its entry reflects both use and development.

| Organisation | Use case | Source |
| --- | --- | --- |
| Microsoft Azure Kubernetes Service (AKS) Team | Troubleshooting cluster issues including node readiness, pod scheduling, DNS configuration, and upgrades | [ADOPTERS.md](https://github.com/HolmesGPT/holmesgpt/blob/main/ADOPTERS.md) |
| Innovaccer (Cloud Infrastructure Team) | RCA and investigation of P0/P1 incidents inside their in-house Infrainsights solution, plus APM and log analysis | [ADOPTERS.md](https://github.com/HolmesGPT/holmesgpt/blob/main/ADOPTERS.md) |

## Adoption signals

As of 2026-07-08 (repository metadata via `gh repo view`): 2,814 stars and 403 forks. The repository was created on 2024-05-30, the latest release is `0.35.0` (2026-07-01), and the primary language is Python. Governance is shared across two vendors: `MAINTAINERS.md` lists ten maintainers from Robusta and one from Microsoft, so the maintainer base is not single-vendor, though it is concentrated in the two organizations that built and adopted the project. HolmesGPT was accepted to CNCF at the Sandbox level on 2025-10-08 (CNCF project page).

## Ecosystem

HolmesGPT sits on top of LiteLLM, which is what lets one code path target OpenAI, Anthropic, Azure, Bedrock, and Gemini. Its data-source reach comes from 46 toolsets plus Model Context Protocol integrations, so tools such as GitHub, GitLab, and cloud providers connect through MCP rather than bespoke code (README). It ingests alerts from Prometheus AlertManager, PagerDuty, OpsGenie, and Jira, and can write findings back to some of them. Robusta, the founding company, offers a SaaS platform that pairs its UI, multi-cluster view, and historical data with HolmesGPT through a `robusta` toolset (README).

## Alternatives

HolmesGPT's distinction is that the reasoning is the model's: it drives arbitrary read-only toolsets in an agentic loop across any infrastructure, rather than running a fixed set of checks. The nearest CNCF Sandbox alternatives cover overlapping ground differently.

| Alternative | Differs by |
| --- | --- |
| K8sGPT | Kubernetes-scoped analyzer plus LLM explanation: fixed analyzers scan cluster resources and the model summarizes their output, so the model does less driving. HolmesGPT is not tied to one platform and lets the model call any toolset agentically |
| kagent | A framework and runtime for running AI agents on Kubernetes. HolmesGPT is a finished incident-investigation agent with data-source integrations, not a platform for building arbitrary agents |
