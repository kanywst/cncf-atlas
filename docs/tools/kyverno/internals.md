# Internals

> Read from the source at commit `989e001`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/kyverno` | Admission controller entry point; wires the CEL engines and clients (`cmd/kyverno/main.go`). |
| `pkg/webhooks` | Webhook HTTP server and route registration (`pkg/webhooks/server.go`). |
| `pkg/webhooks/resource` | Admission handlers that categorize policies and call the engine (`pkg/webhooks/resource/handlers.go`). |
| `pkg/engine` | The policy evaluator behind the `Engine` interface (`pkg/engine/engine.go`). |
| `pkg/engine/api` | The shared types: `Engine`, `EngineResponse`, `RuleResponse`. |
| `pkg/cel` | CEL-based policy engines (`vpol`, `mpol`, `ivpol`, `gpol`). |
| `pkg/autogen` | Rule auto-generation for Pod controllers; `v1` and `v2` implementations. |
| `api/kyverno/v1` | Go types for `ClusterPolicy` / `Policy`, including `Rule` and `Spec`. |
| `pkg/controllers` | Reconcile loops: policy cache, status, cert manager, webhook registration. |
| `pkg/background` | Async generate and mutate-existing via the `UpdateRequest` CRD. |

## Core data structures

`Rule` (`api/kyverno/v1/rule_types.go:45`) is the unit a policy author writes. One rule carries exactly one action: `Mutation`, `Validation`, `Generation`, or `VerifyImages`. It also holds `Context` for variables and data sources (`rule_types.go:51`), `MatchResources` (`rule_types.go:61`) and `ExcludeResources` (`rule_types.go:67`) for applicability, and two flavours of preconditions: the JMESPath `RawAnyAllConditions` (`rule_types.go:82`) and the CEL `CELPreconditions` (`rule_types.go:87`). The engine branches on predicate methods like `HasValidate`, `HasValidatePodSecurity`, and `HasValidateCEL`, so the rule type drives which handler runs.

`Spec` (`api/kyverno/v1/spec_types.go:51`) is the body of a `ClusterPolicy` or `Policy`. It exposes `GetApplyRules()` (`spec_types.go:307`), which can stop at the first matching rule, and `GetFailurePolicy()` (`spec_types.go:277`), which returns `Fail` or `Ignore`.

`EngineResponse` (`pkg/engine/api/engineresponse.go:15`) is the result for one policy: the original `Resource`, the `PatchedResource` after mutation, a `PolicyResponse`, and `stats`. It is created by `NewEngineResponseFromPolicyContext` (`engineresponse.go:38`).

`RuleResponse` (`pkg/engine/api/ruleresponse.go:25`) is the result for one rule: `status`, `ruleType`, `message`, `generatedResources`, `patchedTarget`, `podSecurityChecks`, `exceptions`, the native `vapBinding` (`ruleresponse.go:48`) and `mapBinding` (`ruleresponse.go:50`), and `emitWarning` (`ruleresponse.go:52`) which routes a rule message to the API server warning header.

## A path worth tracing

Follow `engine.validate` for one resource. The loop over rules is the heart of evaluation:

```go
// pkg/engine/validation.go:26
policyContext.JSONContext().Checkpoint()
defer policyContext.JSONContext().Restore()

gvk, _ := policyContext.ResourceKind()
for _, rule := range autogen.Default.ComputeRules(policy, gvk.Kind) {
    // handlerFactory picks a handler from the rule type
    // ...
    resource, ruleResp := e.invokeRuleHandler(ctx, logger, handlerFactory, ...)
}
```

Two things matter here. First, the rules iterated are not always the rules the author wrote: `autogen.Default.ComputeRules` (`validation.go:30`) can expand a Pod rule into rules for Deployment, DaemonSet, and the rest before the loop ever runs. Second, the `handlerFactory` (`validation.go:33`) resolves the handler lazily from predicates: `NewValidateAssertHandler`, `NewValidateManifestHandler`, `NewValidatePssHandler`, `NewValidateCELHandler`, or the default `NewValidateResourceHandler` (`validation.go:58`). The actual check runs in `e.invokeRuleHandler` (`validation.go:72`).

## Things that surprised me

Autogen is more than a convenience. `pkg/autogen/v1/autogen.go:207` `ComputeRules` derives pod-controller rules at evaluation time. `CanAutoGen(spec)` decides the candidate set of controllers (`autogen.go:213`), and the annotation `pod-policies.kyverno.io/autogen-controllers` can override which controllers are actually targeted (`autogen.go:220`). So a rule written for Pods quietly governs Deployments and CronJobs without the author writing those cases. There are two implementations: `v1` and `v2`, and `v2`'s `ComputeRules` returns an extra `ExtractPodFunc` (`pkg/autogen/v2/autogen.go:303`), a different signature for the same idea.

The audit path is intentionally fire-and-forget. After the deny decision is made, `handlers.go:159` submits report creation to a pool with a fresh `context.WithTimeout(context.Background(), 30*time.Second)`. The comment is explicit that this is independent of the HTTP request lifecycle, so a slow or failing report write cannot block or fail the admission response.

An empty engine response is a deliberate signal, not an error. In `HandleValidationEnforce`, `engineResponse.IsNil()` short-circuits the loop with a comment that old and new resources produced the same response, so an update that does not change the policy evaluation is allowed through (`validation.go:108`).
