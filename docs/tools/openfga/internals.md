# Internals

> Read from the source at commit `9a556d8`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| [`cmd/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/cmd) | CLI: `run`, `migrate`, `validate-models`, `version` |
| [`pkg/server/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/server) | gRPC/HTTP handlers, one per API surface |
| [`pkg/server/commands/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/server/commands) | Transport-independent business logic |
| [`internal/graph/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/internal/graph) | Check resolution engine and resolver chain |
| [`internal/planner/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/internal/planner) | Thompson Sampling strategy planner |
| [`pkg/typesystem/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/typesystem) | Model parsing/validation and weighted graph |
| [`pkg/storage/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/storage) | Datastore interfaces and implementations |
| [`pkg/tuple/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/tuple) | Relationship tuple helpers |

## Core data structures

**`Tuple` / `TupleKey`** is the basic unit of relationship data: an (object, relation, user) triple such as `document:1 # viewer @ user:alice`. The type aliases the protobuf `TupleKey` ([`pkg/tuple/tuple.go:15`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/tuple/tuple.go#L15)):

    type Tuple openfgav1.TupleKey

**`ResolveCheckRequest` / `ResolveCheckResponse`** represent one node in the tree of subproblems a check decomposes into. The request carries the visited-paths set used for cycle detection and resolution metadata such as dispatch and datastore-query counts ([`internal/graph/resolve_check_request.go`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/resolve_check_request.go), [`resolve_check_response.go`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/resolve_check_response.go)).

**Userset rewrites** (protobuf) are how a relation's definition is expressed as a set-algebra tree: `Userset_This`, `ComputedUserset`, `TupleToUserset`, `Union`, `Intersection`, `Difference`. `CheckRewrite` evaluates this tree ([`internal/graph/check.go:1046-1063`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L1046-L1063)).

**`TypeSystem`** holds the validated model and a `WeightedAuthorizationModelGraph` built from it ([`pkg/typesystem/typesystem.go:184`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/typesystem/typesystem.go#L184), built at [`typesystem.go:242`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/typesystem/typesystem.go#L242)). The weighted graph is what makes the `PathExists` pruning possible.

**`ThompsonStats` / `PlanConfig`** model the engine's belief about each resolution strategy's latency as a Normal-gamma distribution ([`internal/planner/thompson.go:13-23`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/planner/thompson.go#L13-L23), [`internal/planner/config.go:5`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/planner/config.go#L5)).

## A path worth tracing

Follow `(*LocalChecker).ResolveCheck` ([`internal/graph/check.go:395`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L395)). It is, by its own contract, a recursive function that resolves one node out of a tree of problems ([`internal/graph/interface.go:13-31`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/interface.go#L13-L31)).

It guards depth first, then detects cycles and returns a non-error negative answer when one is found ([`check.go:415-427`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L415-L427)):

    if req.GetRequestMetadata().Depth == c.maxResolutionDepth {
        return nil, ErrResolutionDepthExceeded
    }

    cycle := c.hasCycle(req)
    if cycle {
        span.SetAttributes(attribute.Bool("cycle_detected", true))
        return &ResolveCheckResponse{
            Allowed: false,

A self-defining tuple is allowed immediately ([`check.go:434`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L434)). Then comes the pruning step: if the weighted model graph says there is no path from the user to the relation on this object type, the check returns false without touching the datastore ([`check.go:455-463`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L455-L463)):

    hasPath, err := typesys.PathExists(tupleKey.GetUser(), relation, objectType)
    if err != nil {
        return nil, err
    }
    if !hasPath {
        return &ResolveCheckResponse{
            Allowed: false,
        }, nil
    }

Otherwise it evaluates the relation's rewrite rule ([`check.go:465`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L465)). `CheckRewrite` switches on the rewrite kind ([`check.go:1046-1063`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L1046-L1063)): `Userset_This` to `checkDirect`, `ComputedUserset` to `checkComputedUserset`, `TupleToUserset` to `checkTTU`, and the set operators to `checkSetOperation`.

Set operations run concurrently. `union` runs every handler in a worker pool and short-circuits the moment one returns allowed, cancelling the rest ([`internal/graph/check.go:160`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L160), short-circuit at [`check.go:206-209`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L206-L209)):

    if outcome.resp.Allowed {
        // Short-circuit success. defer cancel() will clean up workers.
        return outcome.resp, nil
    }

`intersection` ([`check.go:222`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L222)) stops at the first negative; `exclusion` ([`check.go:295`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L295)) is true when the base handler is true and the subtract handler is false.

## Things that surprised me

**The resolver chain loops back on itself.** `Build` orders resolvers least-to-most expensive, then sets the last resolver's delegate to the first ([`internal/graph/builder.go:96-104`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/builder.go#L96-L104)):

    for i, resolver := range c.resolvers {
        if i == len(c.resolvers)-1 {
            resolver.SetDelegate(c.resolvers[0])
            continue
        }
        resolver.SetDelegate(c.resolvers[i+1])
    }

So when `LocalChecker` recurses into a subproblem, the recursion re-enters at the cache resolver rather than calling itself directly, letting every subproblem benefit from caching and throttling. The contract that this must not cause infinite recursion is spelled out on the interface ([`interface.go:38-40`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/interface.go#L38-L40)).

**Strategy selection is online learning, not a heuristic.** `(*keyPlan).Select` implements the Thompson Sampling decision rule: draw a latency sample from each strategy's learned distribution and pick the minimum ([`internal/planner/plan.go:46-69`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/planner/plan.go#L46-L69)):

    for k, plan := range resolvers {
        ts := kp.getOrCreateStats(plan)
        sampledTime := ts.Sample(rng)
        if bestResolver == "" || sampledTime < minSampledTime {
            minSampledTime = sampledTime
            bestResolver = k
        }
    }

Measured latencies feed back via `UpdateStats`, so each query path converges toward its lowest-latency strategy while still exploring. The intent (the meaning of `InitialGuess`, `Lambda`, `Alpha`, `Beta`, and the exploration/exploitation balance) is documented at length in the config comments ([`internal/planner/config.go:5-43`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/planner/config.go#L5-L43)).

**There is a second Check implementation hiding behind a flag.** The v2 weighted-graph Check is tried first when `ExperimentalWeightedGraphCheck` is on, and silently falls back to v1 for any model the weighted graph cannot represent ([`pkg/server/check.go:69-152`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/server/check.go#L69-L152)). A naive reading of the v1 path alone misses that production traffic may be taking an entirely different route.
