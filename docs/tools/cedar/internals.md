# Internals

> Read from the source at commit `991bacf`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cedar-policy/src/api.rs` | Public SDK surface, including `Authorizer::is_authorized` (`api.rs:1116`) |
| `cedar-policy-core/src/authorizer.rs` | Combines per-policy results into a decision (`authorizer.rs:95`) |
| `cedar-policy-core/src/authorizer/partial_response.rs` | Holds the deny-trumps-allow `decision` logic (`partial_response.rs:121`) |
| `cedar-policy-core/src/evaluator.rs` | Interprets a policy condition against a request (`evaluator.rs:397`) |
| `cedar-policy-core/src/ast/` | Core AST: `Request`, `Expr`, `Value`, `Policy`, `PolicySet`, entities |
| `cedar-policy-symcc/src/lib.rs` | Symbolic compiler and SMT-backed property checks (`lib.rs:267`) |
| `cedar-policy-cli/src/main.rs` | CLI entry point (`main.rs:28`) |

## Core data structures

`Request` is the input tuple. It is declared at `cedar-policy-core/src/ast/request.rs:38` with four fields (principal, action, resource, context), matching the request tuple `<P, A, R, C>` from the design doc noted just above it (`request.rs:36`). The `context` field is `Option<Context>`; when it is `None`, that variable produces a residual for partial evaluation (`request.rs:49-50`).

`Expr<T = ()>` (`cedar-policy-core/src/ast/expr.rs:53`) and its `ExprKind<T = ()>` (`expr.rs:64`) are the AST for a policy condition. The variants include `Lit`, `Var`, `Slot`, `Unknown`, `If`, `And`, `Or`, `UnaryApp`, `BinaryApp`, and `ExtensionFunctionApp` (`expr.rs:66`, `:68`, `:70`, `:72`, declarations following). `Slot` carries a template slot and `Unknown` marks a symbolic value for partial evaluation (`expr.rs:70`, `:72`).

`Value` (`cedar-policy-core/src/ast/value.rs:33`) and `ValueKind` (`value.rs:45`) are evaluation results. `ValueKind` has exactly four variants:

```rust
pub enum ValueKind {
    /// anything that is a Literal can also be the dynamic result of evaluating an `Expr`
    Lit(Literal),
    /// Evaluating an `Expr` can result in a first-class set
    Set(Set),
    /// Evaluating an `Expr` can result in a first-class anonymous record (keyed on String)
    Record(Arc<BTreeMap<SmolStr, Value>>),
    /// Evaluating an `Expr` can result in an extension value
    ExtensionValue(Arc<RepresentableExtensionValue>),
}
```

`Policy` (`cedar-policy-core/src/ast/policy.rs:511`) is a linked template instance: an `Arc<Template>`, an optional link id, and a slot binding map `values: HashMap<SlotId, EntityUID>` (`policy.rs:524`). Even a static policy is an instance of a template, and the type carries an invariant, "values total map", requiring every slot in the template to be bound by `values` (`policy.rs:518-519`). `PolicySet` (`cedar-policy-core/src/ast/policy_set.rs:32`) is the collection the authorizer walks with `policies()`. Entities are identified by `EntityUIDImpl` (`cedar-policy-core/src/ast/entity.rs:211`), a pair of an entity type and an id; principals, actions, and resources are all entities.

## A path worth tracing

The whole engine turns on how per-policy results become one decision. The authorizer evaluates each policy and sorts it into one of six buckets by effect and truth value (`authorizer.rs:112-129`):

```rust
        for p in pset.policies() {
            let (id, annotations) = (p.id().clone(), p.annotations_arc().clone());
            match eval.partial_evaluate(p) {
                Ok(Either::Left(satisfied)) => match (satisfied, p.effect()) {
                    (true, Effect::Permit) => true_permits.push((id, annotations)),
                    (true, Effect::Forbid) => true_forbids.push((id, annotations)),
```

`partial_evaluate` (`evaluator.rs:397`) is where a policy condition becomes a boolean or a residual:

```rust
    pub fn partial_evaluate(&self, p: &Policy) -> Result<Either<bool, Expr>> {
        match self.partial_interpret(&p.condition(), p.env())? {
            PartialValue::Value(v) => v.get_as_bool().map(Either::Left),
            PartialValue::Residual(e) => Ok(Either::Right(e)),
        }
    }
```

The final answer is the match in `decision` (`partial_response.rs:121-138`). It looks at four booleans (any satisfied forbid, any satisfied permit, any residual permit, any residual forbid) and resolves them in priority order:

```rust
    pub fn decision(&self) -> Option<Decision> {
        match (
            !self.satisfied_forbids.is_empty(),
            !self.satisfied_permits.is_empty(),
            !self.residual_permits.is_empty(),
            !self.residual_forbids.is_empty(),
        ) {
            // Any true forbids means we will deny
            (true, _, _, _) => Some(Decision::Deny),
            // No potentially or trivially true permits, means we default deny
            (_, false, false, _) => Some(Decision::Deny),
```

A satisfied forbid wins immediately (`partial_response.rs:129`). With no permits at all the result defaults to `Deny` (`partial_response.rs:131`). An `Allow` requires a satisfied permit and no satisfied or residual forbid (`partial_response.rs:137`).

## Things that surprised me

`decision` returns `Option<Decision>`, not `Decision` (`partial_response.rs:121`). When unknowns remain it can return `None`: a request with residual forbids returns `None` because that forbid might still evaluate to true and override every permit (`partial_response.rs:131` and the residual arms that follow). Partial authorization is not bolted on. It is the native shape of the engine, and the fully-concrete path is the special case reached by `concretize` (`partial_response.rs:115`).

Errors never become a third outcome. The only error mode is `ErrorHandling::Skip` (`authorizer.rs:136`), which treats an erroring policy as not satisfied, and the `Decision` enum is two-valued with fatal errors folding into `Deny` (`authorizer.rs:701`, `:704-708`). A broken policy fails safe.

The symbolic compiler is the part that distinguishes Cedar from a generic engine. `CedarSymCompiler<S: Solver>` (`cedar-policy-symcc/src/lib.rs:267`) exposes async checks backed by an SMT solver: `check_unsat` (`lib.rs:294`), `check_sat` (`lib.rs:315`), `check_never_errors` (`lib.rs:334`), `check_always_matches` (`lib.rs:389`), `check_never_matches` (`lib.rs:444`), `check_matches_equivalent` (`lib.rs:508`), `check_matches_implies` (`lib.rs:599`), and `check_matches_disjoint` (`lib.rs:687`). Each has a `*_with_counterexample` variant that returns a concrete input witnessing the failure. Policies are first compiled with `compile` for a single `Policy` (`lib.rs:158`) or for a `PolicySet` (`lib.rs:225`). This lets you prove, rather than test, that one policy always implies another or that two policy sets are equivalent.
