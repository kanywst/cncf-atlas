# Getting Started

> Verified against the main branch at commit `b7cea53` (just after release `v0.44.0`). Commands assume a Linux or macOS shell with Docker and Git installed, and a GitHub account with a repository that holds Terraform.

## Prerequisites

- Docker, or a Go 1.26 toolchain if you want to build from source.
- A GitHub personal access token for the user Atlantis will act as.
- A repository containing Terraform or OpenTofu configuration.
- A way to expose the server to GitHub webhooks (for a quick trial, the built-in `testdrive` uses ngrok automatically).

## Install

Pull the official container image:

```bash
docker pull ghcr.io/runatlantis/atlantis:latest
```

Or build the binary from a checkout of the repository:

```bash
git clone https://github.com/runatlantis/atlantis.git
make -C atlantis build-service
./atlantis/atlantis version
```

`make build-service` runs `CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o atlantis .` and writes the `atlantis` binary into the repository root (`Makefile:25-26`).

## A first working setup

The fastest way to a real run is the interactive `testdrive` subcommand, registered in `main.go:54`. It walks you through forking a demo repo, exposing your machine with ngrok, and wiring up the webhook.

1. Start the guided trial and follow the prompts:

   ```bash
   ./atlantis/atlantis testdrive
   ```

2. To run the real server instead, set the minimum flags. `--repo-allowlist` is required for security; the server refuses to start without it (`cmd/server.go:1077`):

   ```bash
   docker run -p 4141:4141 ghcr.io/runatlantis/atlantis:latest server \
     --gh-user="$GITHUB_USER" \
     --gh-token="$GITHUB_TOKEN" \
     --gh-webhook-secret="$GITHUB_WEBHOOK_SECRET" \
     --repo-allowlist="github.com/your-org/*" \
     --atlantis-url="https://your-atlantis.example.com"
   ```

3. In the GitHub repository settings, add a webhook pointing at `https://your-atlantis.example.com/events` (the URL is shown as inline code; substitute your `--atlantis-url`). Set the content type to `application/json`, use the same secret you passed to `--gh-webhook-secret`, and subscribe to pull request and issue comment events.

4. Open a pull request that changes a Terraform file. Atlantis autoplans on the new pull request, then comment `atlantis apply` to apply the change before merge.

## Verify it works

Confirm the server is up and reachable. The list of every flag is printed by:

```bash
docker run --rm ghcr.io/runatlantis/atlantis:latest server --help
```

Once the server is running and the webhook is delivering, opening a pull request should produce an Atlantis plan comment within a few seconds, and the pull request's commit status should show an Atlantis check. If nothing happens, check the GitHub webhook's "Recent Deliveries" tab for the response code and the server logs for the routed event.

## Where to go next

The official documentation at <https://www.runatlantis.io> covers production concerns this page skips: server-side repository configuration and `atlantis.yaml`, custom workflows, the team allowlist, policy checks with Conftest, Redis-backed locking for high availability, and the GitHub App installation flow as an alternative to a user token.
