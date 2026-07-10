# HolmesGPT

> HolmesGPT is an open-source AI agent that investigates production incidents by letting a large language model pull live observability data through a controlled tool-calling loop and write the root cause analysis.

- **Category**: Observability
- **CNCF maturity**: Sandbox (accepted 2025-10-08)
- **Language**: Python
- **License**: Apache-2.0
- **Repository**: [HolmesGPT/holmesgpt](https://github.com/HolmesGPT/holmesgpt)
- **Documented at commit**: `84cb39c` (near tag `0.35.0`, 2026-07-06)

## What it is

HolmesGPT is an agent that answers "why is this alert firing?" by reading the same data a human on-call engineer would. You give it an alert or a question, and it runs a loop: the language model picks a tool (fetch pod logs, query Prometheus, describe a node), the tool returns real data, and the model decides what to look at next until it can write a root cause analysis. The tools are grouped into toolsets for data sources such as Kubernetes, Prometheus, Grafana, Datadog, and AWS, with more reached through the Model Context Protocol (README).

The split that defines the project is between the deterministic Python and the model. Python owns the control: it runs the loop and enforces `max_steps`, dispatches tool calls, blocks duplicate calls, gates tools that need approval, compacts the conversation when it outgrows the context window, and records tracing. The model owns the judgment: which tool to call, with which arguments, when to stop, and how to word the analysis. There is no hardcoded decision tree for diagnosis. Runbooks are text injected into the prompt, so even guided investigations leave the reasoning to the model (recon; source at `84cb39c`).

It is built by Robusta.Dev, which runs a Kubernetes monitoring SaaS, with major contributions from Microsoft (README, `MAINTAINERS.md`). Kubernetes is a common target but not a requirement: the same loop works against VMs, cloud APIs, databases, and SaaS tools, because a toolset is just a set of read-only commands the model can call.

## When to use it

- You want alert triage or root cause analysis automated against your own observability stack, and you already run a data source HolmesGPT has a toolset for (Kubernetes, Prometheus, Grafana, Datadog, and more).
- You want the agent's data access to stay read-only and auditable: the loop refuses duplicate calls and can require human approval before a sensitive tool runs.
- You want to embed incident investigation in your own tooling or connect it to an alert source such as Prometheus AlertManager, PagerDuty, OpsGenie, or Jira.
- Not the right fit if you want deterministic, repeatable diagnostics: the reasoning is the model's, so runs vary with the model and its context.
- Not a general agent framework. It is a finished incident-investigation agent with data-source integrations, not a platform for building arbitrary agents.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how an investigation flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working investigation.

## Sources

1. [HolmesGPT/holmesgpt README](https://github.com/HolmesGPT/holmesgpt/blob/main/README.md) (accessed 2026-07-08)
2. [HolmesGPT repository metadata (`gh repo view`)](https://github.com/HolmesGPT/holmesgpt) (accessed 2026-07-08)
3. [HolmesGPT developer guide (CLAUDE.md)](https://github.com/HolmesGPT/holmesgpt/blob/main/CLAUDE.md) (accessed 2026-07-08)
4. [HolmesGPT project page (CNCF)](https://www.cncf.io/projects/holmesgpt/) (accessed 2026-07-09)
5. [cncf/sandbox application issue #392 and onboarding issue #411](https://github.com/cncf/sandbox/issues/392) (accessed 2026-07-09)
6. [HolmesGPT MAINTAINERS.md](https://github.com/HolmesGPT/holmesgpt/blob/main/MAINTAINERS.md) (accessed 2026-07-08)
7. [CNCF blog: HolmesGPT, Agentic troubleshooting built for the cloud native era](https://www.cncf.io/blog/2026/01/07/holmesgpt-agentic-troubleshooting-built-for-the-cloud-native-era/) (accessed 2026-07-09)
8. [HolmesGPT ADOPTERS.md](https://github.com/HolmesGPT/holmesgpt/blob/main/ADOPTERS.md) (accessed 2026-07-08)
