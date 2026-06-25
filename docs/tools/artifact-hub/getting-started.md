# Getting Started

> Verified against the Helm chart under `charts/artifact-hub` at commit `0d8b1c0`. The managed option needs only a browser.

## Prerequisites

- For managed use: a web browser and, to publish, an account at `artifacthub.io`.
- For self-hosting: a Kubernetes cluster, Helm, and a PostgreSQL database (the chart can deploy one or use an external instance).

## Install

The fastest way to use Artifact Hub is the public instance at `artifacthub.io`; no install is needed. To run your own instance, deploy the official Helm chart:

```bash
helm repo add artifact-hub https://artifacthub.github.io/helm-charts
helm install artifact-hub artifact-hub/artifact-hub
```

The chart's `db-migrator` job applies the Tern migrations automatically on install (`charts/artifact-hub/templates/db_migrator_install_job.yaml`).

## A first working setup

The core job of Artifact Hub is indexing a repository so its packages become searchable. On a running instance:

1. Sign in to the instance and open the control panel.
2. Add a repository, choosing its kind (for example Helm) and URL, following the repositories guide.

```bash
helm repo add my-charts https://example.com/charts
```

The tracker then scans the repository on its next run and registers each package; unchanged repositories are skipped by digest comparison (`internal/tracker/tracker.go:41`).

## Verify it works

Before publishing, validate the repository metadata with the `ah` CLI:

```bash
ah lint
```

A clean `ah lint` run means the repository's metadata will be accepted by the tracker. On a self-hosted instance, the `hub` server exposes Prometheus metrics on a separate port (`cmd/hub/main.go:101`) that you can scrape to confirm it is healthy.

## Where to go next

For production concerns such as high availability, the database setup, and configuring the tracker and scanner, see the project's `docs/architecture.md` and the [repositories guide](https://artifacthub.io/docs/topics/repositories/). The Helm chart values cover deployment-level tuning.
