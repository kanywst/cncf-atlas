# Getting Started

> Verified against the `v4.0.9` release line. Commands assume macOS or Linux with a shell and, for the cluster scan, a working `kubectl` context.

## Prerequisites

- A shell on macOS or Linux (the install script and Homebrew formula target these).
- For scanning manifests or Helm charts: a local directory of YAML files. No cluster needed.
- For scanning a live cluster: a kubeconfig with read access to the target cluster.
- Network access on the first run so the engine can download policy content from GitHub releases. For air-gapped use, cache policies and pass `--use-from` / `--keep-local`.

## Install

The official install script puts the `kubescape` binary on the path:

```bash
curl -s https://raw.githubusercontent.com/kubescape/kubescape/master/install.sh | /bin/bash
```

Homebrew works too:

```bash
brew install kubescape
```

Confirm the binary runs:

```bash
kubescape version
```

## A first working setup

The core job is a framework scan. The steps below scan local manifests against the NSA framework, then gate on a compliance score.

1. Create a manifest to scan.

   ```bash
   cat > deployment.yaml <<'EOF'
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: demo
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: demo
     template:
       metadata:
         labels:
           app: demo
       spec:
         containers:
           - name: demo
             image: nginx:1.27
   EOF
   ```

1. Scan it against the NSA framework.

   ```bash
   kubescape scan framework nsa deployment.yaml
   ```

The output prints per-control pass/fail rows, a resource summary, and a risk score and compliance score at the end.

1. Scan a live cluster instead of a file.

   ```bash
   kubescape scan framework nsa
   ```

With no path argument the engine collects objects from the current kubeconfig context.

1. Turn the scan into a CI gate. This fails the command when compliance drops below 80.

   ```bash
   kubescape scan framework nsa deployment.yaml --compliance-threshold 80
   ```

## Verify it works

A healthy run ends with a summary table and a non-empty compliance score. The process exit code reflects the gates: with `--compliance-threshold` set, the command exits non-zero when the compliance score is below the threshold, which is the signal CI keys on. Running `kubescape list frameworks` confirms the engine downloaded policy content and can see the available frameworks.

## Where to go next

- The in-cluster operator, vulnerability scanner, and node-agent install through the project's Helm charts; see the [Kubescape repository](https://github.com/kubescape/kubescape) and its docs for continuous, in-cluster scanning, runtime detection, and production hardening.
- For air-gapped operation, the CLI flags `--use-from` and `--keep-local` (see [Architecture](./architecture)) point the engine at locally cached policy content instead of GitHub releases.
