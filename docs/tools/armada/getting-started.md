# Getting Started

> Verified against commit `85b582d` (near tag v0.21.5). Commands assume a local development stack with no real Kubernetes cluster.

## Prerequisites

- Go (the repository declares `go 1.26.1` in `go.mod`).
- Docker, used to bring up redis, postgres, and pulsar via Docker Compose (README:81).
- `mage`, the build tool used by the `magefiles/` tasks.

## Install

Clone the repository and install the `armadactl` command-line tool:

```bash
git clone https://github.com/armadaproject/armada.git
cd armada
scripts/get-armadactl.sh
```

The `scripts/get-armadactl.sh` script installs `armadactl` (README:61). You can also download a prebuilt binary from the GitHub Releases page (README:64).

## A first working setup

This brings up Armada locally with a fake executor, so no Kubernetes cluster is needed.

1. Start the local stack with a fake executor. Run this from the repository root:

    ```bash
    mage dev:up fake-executor
    ```

    This installs `goreman` to `./bin/` if missing, brings up redis, postgres, and pulsar, creates databases and applies migrations, then runs all components in the foreground (README:81). The `fake-executor` flavour needs no Kubernetes cluster (README:78). Leave this running; press Ctrl+C to stop it cleanly.

2. In a second terminal, create a queue called `example`:

    ```bash
    armadactl create queue example
    ```

3. Create a job specification file named `jobspec.yaml`. This job sleeps for 60 seconds (`docs/creating_and_submitting_jobs.md:24-46`):

    ```yaml
    queue: example
    jobSetId: set1
    jobs:
      - priority: 0
        podSpecs:
          - terminationGracePeriodSeconds: 0
            restartPolicy: Never
            containers:
              - name: sleep
                imagePullPolicy: IfNotPresent
                image: busybox:latest
                args:
                  - sleep
                  - 60s
                resources:
                  limits:
                    memory: 64Mi
                    cpu: 150m
                  requests:
                    memory: 64Mi
                    cpu: 150m
    ```

4. Submit the job (`docs/creating_and_submitting_jobs.md:56`):

    ```bash
    armadactl submit jobspec.yaml
    ```

## Verify it works

Watch the job set and confirm the job moves through its states:

```bash
armadactl watch example set1
```

The watch shows real-time updates as the job progresses from queued to running to completed. In the local dev stack the Lookout web UI is built separately with `mage ui` and served at `http://localhost:8089` (`docs/developer_guide.md:140`).

When you are done, stop the dependency containers:

```bash
mage dev:down
```

## Where to go next

- For authentication, `mage dev:up auth` adds Keycloak and OIDC (OpenID Connect) to the local stack (README:77, `:91`).
- For job options such as gang-scheduling, preemption, priority classes, and ingress, see `docs/creating_and_submitting_jobs.md`.
- For production installation, use the Armada Operator (README:47-50).
- For the system model and consistency guarantees, see `docs/system_overview.md`.
