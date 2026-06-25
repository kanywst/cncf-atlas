# Internals

> Read from the source at commit `8274975`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `main.go` | Entry point; `main()` (`main.go:21`) calls `cmd.Execute`, build vars filled by GoReleaser (`main.go:14-19`). |
| `cmd/` | Cobra command tree (`scan`, `fix`, `patch`, `download`, `list`, `config`, `diff`). |
| `core/core/` | Command implementations as methods on `Kubescape`; `scan.go:183` is the pipeline. |
| `core/pkg/opaprocessor/` | Rule evaluation: `processorhandler.go`, Cosign builtins, CEL dispatch. |
| `core/pkg/policyhandler/` | Policy collection into the session (`handlepullpolicies.go:51`). |
| `core/pkg/resourcehandler/` | Resource collection from cluster or files (`handlerpullresources.go:18`). |
| `core/cautils/` | Shared types: `OPASessionObj`, `ScanInfo`, and `getter/` for policy download. |
| `core/meta/` | `IKubescape` interface, the CLI-to-core boundary (`ksinterface.go:11`). |
| `pkg/imagescan/` | Grype/Syft wrapper for image vulnerability scanning. |

## Core data structures

`OPASessionObj` (`core/cautils/datastructures.go:49`) holds the entire state of one scan. It carries `K8SResources` (GVR to resource ID), `AllResources` (ID to the object), `ResourcesResult` (ID to evaluation result), `Policies` (the frameworks), `AllPolicies` (the flattened control map), the v2 `Report`, `ScanCoverage`, and the VAP policy and binding sets. `NewOPASessionObj` (`core/cautils/datastructures.go:80`) sizes its maps up front by estimating cluster size with `estimateClusterSize` (`core/cautils/datastructures.go:101`).

`K8SResources` and `ExternalResources` are type aliases for `map[string][]string`, keyed by `<api group>/<version>/<resource>` (`core/cautils/datastructures.go:22-24`). They are the index a rule uses to pull only the resources matching its target GVR.

`ScanInfo` (`core/cautils/scaninfo.go:102`) is the aggregate of CLI flags: output format, the threshold values, the policy / controls-inputs / exceptions / attack-tracks getters, scan type, and the air-gapped flags. It is the unit passed between the CLI layer and the core.

`OPAProcessor` (`core/pkg/opaprocessor/processorhandler.go:44`) embeds the session and adds the rule-compilation cache, a `ControlTimeout`, the timed-out-controls set, and a `sync.Once` used to register the Cosign builtins exactly once.

`ImageScanData` (`core/cautils/datastructures.go:26-35`) bundles the Grype/Syft output (`Matches`, `Packages`, `SBOM`, `VulnerabilityProvider`), so posture results and image results live in the same result handler.

## A path worth tracing

Rule evaluation runs through `ProcessRulesListener` (`core/pkg/opaprocessor/processorhandler.go:83`). It flattens frameworks into a control list with `convertFrameworksToPolicies`, calls `Process`, then rebuilds coverage and computes scores.

`Process` (`core/pkg/opaprocessor/processorhandler.go:117`) loops over `policies.Controls` one at a time. When `ControlTimeout > 0` it wraps each control in `context.WithTimeout`; on deadline it calls `markControlTimedOut`, clears the error, and continues so the whole scan does not stop:

```go
if opap.ControlTimeout > 0 {
    cctx, cancel := context.WithTimeout(ctx, opap.ControlTimeout)
    resourcesAssociatedControl, err = opap.processControl(cctx, &control)
    if cctx.Err() == context.DeadlineExceeded && ctx.Err() == nil {
        opap.markControlTimedOut(&control, opap.ControlTimeout)
        err = nil
        resourcesAssociatedControl = nil
    }
    cancel()
}
```

Each control fans out to `processControl` (`core/pkg/opaprocessor/processorhandler.go:200`) then `processRule` (`core/pkg/opaprocessor/processorhandler.go:242`). A rule is dispatched by language in `runOPAOnSingleRule` (`core/pkg/opaprocessor/processorhandler.go:494`): Rego goes to `runRegoOnK8s` (`:497`), CEL goes to `runCELOnK8s` (`:499`).

`runRegoOnK8s` (`core/pkg/opaprocessor/processorhandler.go:512`) registers the Cosign builtins once via `opaRegisterOnce`, fetches a compiled rule from the cache with `getCompiledRule` (`:520`), turns control inputs into an OPA store with `TOStorage()` (`:525`), and calls `regoEval` (`:530`).

`regoEval` (`core/pkg/opaprocessor/processorhandler.go:544`) is the leaf. It builds the query and runs it:

```go
rego := rego.New(
    rego.SetRegoVersion(ast.RegoV0),
    rego.Query("data.armo_builtins"),
    rego.Compiler(compiledRego),
    rego.Input(inputObj),
    rego.Store(*store),
)
resultSet, err := rego.Eval(ctx)
```

The result set is parsed by `reporthandling.ParseRegoResult` (`core/pkg/opaprocessor/processorhandler.go:560`).

## Things that surprised me

- The engine uses the OPA v1 library but pins evaluation to Rego v0 syntax with `rego.SetRegoVersion(ast.RegoV0)` (`core/pkg/opaprocessor/processorhandler.go:546`). OPA defaults to v1 syntax, so this line is what keeps the existing `regolibrary` rules compiling. Miss it and rules break.
- Cosign signature verification is exposed as Rego builtins. `runRegoOnK8s` registers `cosign_verify`, `cosign_has_signature`, and an image-name normalizer (`core/pkg/opaprocessor/processorhandler.go:513-517`), implemented in `cosign_verify.go` and `cosign_has_signature.go`. A policy can ask "is this image signed" inside the policy language itself.
- CEL is wired in but not done. `runCELOnK8s` is a stub that returns `CEL evaluation not yet implemented` and points at issue `kubescape/kubescape#2001` (`core/pkg/opaprocessor/processorhandler.go:507-509`). The CEL environment exists at `core/pkg/opaprocessor/cel/env.go`, so the migration is in progress, not shipped.
- A timed-out control is not a failure and not a pass. It is recorded as not-evaluated and folded into coverage, so a slow rule degrades the coverage number instead of silently dropping out of the report (`core/pkg/opaprocessor/processorhandler.go:143-151`, `:98`).
