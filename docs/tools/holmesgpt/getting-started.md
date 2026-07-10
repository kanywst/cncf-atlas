# Getting Started

> Verified against release `0.35.0` (commit `84cb39c`). Commands assume a shell with a model provider API key.

## Prerequisites

- A model provider API key. The examples use Anthropic (`ANTHROPIC_API_KEY`); OpenAI (`OPENAI_API_KEY`) and others work the same way through LiteLLM.
- One data source HolmesGPT can read. The Kubernetes toolset uses your kubeconfig, so a reachable cluster is the quickest start, though HolmesGPT can also investigate non-Kubernetes systems.
- Homebrew, `pipx`, or Poetry to install the CLI (installation docs).

## Install

Install the CLI with Homebrew:

```bash
brew tap robusta-dev/homebrew-holmesgpt
brew install holmesgpt
```

Or with `pipx`:

```bash
pipx install holmesgpt
```

Confirm the binary is present:

```bash
holmes ask --help
```

## A first working setup

The shortest working run is a single `ask` against a cluster. The model picks the tools; you only supply the question and the API key.

1. Set your provider API key.

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

1. Ask HolmesGPT to investigate, naming the model. Point the question at whatever your data source can see.

```bash
holmes ask "what pods are unhealthy in my cluster and why?" \
  --model="anthropic/claude-sonnet-4-5-20250929"
```

1. Watch the run. HolmesGPT calls tools (for example, listing pods and fetching logs), feeds the results back to the model, and prints a root cause analysis once the model stops calling tools.

If you do not run Kubernetes, ask about a source you do have, such as `holmes ask "what Prometheus alerts are currently firing and why?"`.

## Verify it works

A healthy run prints the tools it invoked as it goes and ends with a written analysis rather than an error. If it exits before analyzing, the usual causes are a missing or wrong API key, a model name the provider does not recognize, or no reachable data source. `holmes ask --help` confirms the CLI is installed, and re-running with a known-good source (a cluster with a deliberately broken pod) confirms the loop reaches data and concludes.

## Where to go next

For running HolmesGPT in a cluster, the always-on Operator Mode, alert-source integrations (AlertManager, PagerDuty, OpsGenie, Jira), the full toolset catalog, and provider configuration, follow the official documentation at <https://holmesgpt.dev/>. The repository's `docs/installation/` directory covers the Kubernetes, Docker Compose, and Python SDK paths not shown here.
