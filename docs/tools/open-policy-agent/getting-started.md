# Getting Started

> Verified against the v1.x line (pinned commit `f75131f`). Commands assume a Unix shell.

## Prerequisites

- A shell on macOS or Linux.
- Homebrew (for the macOS install) or `curl` (for the direct binary).

## Install

```bash
# macOS (Homebrew)
brew install opa

# or the static binary directly (Linux amd64)
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64_static
chmod +x opa
```

## A first working setup

The shortest path to a real decision is a policy file, an input file, and one `opa eval`.

1. Write a policy. Save this as `policy.rego`.

   ```text
   package example

   default allow := false

   allow if input.user == "admin"
   ```

2. Write the input. Save this as `input.json`.

   ```json
   { "user": "admin" }
   ```

3. Evaluate the policy against the input.

   ```bash
   opa eval -d policy.rego -i input.json "data.example.allow"
   ```

   The result set reports `true` for `data.example.allow`. Change `user` to anything else and it reports `false`.

## Verify it works

Run OPA as a server and ask it the same question over HTTP.

```bash
opa run --server
```

In another terminal, post the input to the decision path:

```bash
curl localhost:8181/v1/data/example/allow -d @input.json
```

Note that since OPA 1.0 the server binds to localhost by default. Exposing it externally requires an explicit `--addr` flag ([openpolicyagent.org docs](https://www.openpolicyagent.org/docs), [OPA 1.0 blog](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368)).

## Where to go next

The [official documentation](https://www.openpolicyagent.org/docs) covers production concerns this page does not: bundle distribution over HTTP or OCI, decision logging, the status plugin, signing and verification, and embedding OPA through the Go SDK.
