# Getting Started

> Verified against the source at commit `0f6f0ab` (near tag `v0.14.1`). Commands assume a working Docker or BuildKit, and Trivy for the report-driven flow.

## Prerequisites

- Docker (with BuildKit) or a standalone BuildKit instance, since Copa solves the patch as a BuildKit build.
- Trivy, if you want the report-driven flow that patches only flagged packages.
- A container image you can pull and re-tag.

## Install

With Homebrew:

```bash
brew install copa
```

From source (requires Go 1.25):

```bash
git clone https://github.com/project-copacetic/copacetic
make -C copacetic build
```

## A first working setup

This scans an image with Trivy, patches only the flagged OS packages, and re-scans to confirm.

1. Scan the image and write a JSON report of fixable OS vulnerabilities.

   ```bash
   export IMAGE=docker.io/library/nginx:1.21.6
   trivy image --vuln-type os --ignore-unfixed -f json -o nginx-report.json "$IMAGE"
   ```

1. Patch the image using the report. Copa produces a new tag and loads it into the local runtime.

   ```bash
   copa patch -i "$IMAGE" -r nginx-report.json -t 1.21.6-patched
   ```

1. Re-scan the patched tag to confirm the flagged CVEs are gone.

   ```bash
   trivy image --vuln-type os --ignore-unfixed "${IMAGE%:*}:1.21.6-patched"
   ```

To patch every outdated package without a report, omit `-r`; Copa updates all outdated OS packages:

```bash
copa patch -i docker.io/library/nginx:1.21.6
```

## Verify it works

By default Copa writes a new tag with a `-patched` suffix into the local runtime, so `docker images` shows the patched tag next to the original. The re-scan in step 3 is the real check: the CVEs fixed by the update should no longer appear. If the report yields no applicable updates, Copa exits 0 and prints that no updates were found rather than failing (`src/main.go:58-61`).

## Where to go next

For multi-platform images, batch patching via a config file, writing to a local OCI layout with `--oci-dir`, end-of-life checks with `--exit-on-eol`, and the experimental `COPA_EXPERIMENTAL` language-package patching, see the official docs at <https://project-copacetic.github.io/copacetic/website/>. The [quick start](https://project-copacetic.github.io/copacetic/website/quick-start) and [installation](https://project-copacetic.github.io/copacetic/website/installation) pages cover platform-specific setup, and [copa-action](https://github.com/project-copacetic/copa-action) wires the same flow into GitHub Actions.
