# Internals

> Read from the source at commit `f75131f`. Every claim here points at a file and line.

## Code map

The implementation lives under `v1/`. The root packages are thin shims (see the last section).

| Path | Responsibility |
| --- | --- |
| `cmd/` | CLI subcommands on the cobra root (`cmd/commands.go:14`). |
| `v1/ast/` | Rego parser, compiler, type checker, and the AST types. |
| `v1/topdown/` | Top-down evaluation engine, unification, and built-in functions. |
| `v1/rego/` | High-level compile-then-evaluate API (`rego.New().Eval()`). |
| `v1/server/` | REST PDP serving `/v1/data/<path>`. |
| `v1/storage/` | `Store` abstraction over base documents. |
| `v1/bundle/` | Bundle load, sign, and verify. |
| `v1/sdk/`, `v1/plugins/` | Embeddable SDK and decision-log / bundle / status plugins. |

## Core data structures

- `Term` is the smallest AST unit: `type Term struct` at `v1/ast/term.go:315`, carrying a `Value` and a `*Location`.
- `Value` is the interface every AST value implements (`v1/ast/term.go:61`), requiring `Compare`, `Find`, `Hash`, `IsGround`, and `String`. Concrete values include `Var` (`v1/ast/term.go:1148`), `Ref` (`v1/ast/term.go:1215`), and `Object` (`v1/ast/term.go:2130`).
- `Module`, `Rule`, `Head`, and `Body` are the policy structure (`v1/ast/policy.go:193`, `:227`, `:245`, `:263`). A `Module` holds package, imports, rules, and annotations; a `Rule` carries a default flag, head, body, and else branch.
- `bindings` holds variable bindings during evaluation (`v1/topdown/bindings.go:32`). It uses an adaptive representation: an array for few bindings, switching to a map past a threshold.
- `Store` is the transactional read/write boundary for base documents (`v1/storage/interface.go:20`), keeping external data separate from policy evaluation.

## A path worth tracing

Evaluating a Rego policy once runs through these hops.

1. `rego.New(opts...)` (`v1/rego/rego.go:1414`) builds the evaluator from query, modules, store, and input options.
2. `(*Rego).Eval` (`v1/rego/rego.go:1502`) opens a transaction and prepares the query.

   ```go
   pq, err := r.PrepareForEval(ctx)
   // ...
   rs, err := pq.Eval(ctx, evalArgs...)
   ```

3. `PrepareForEval` (`v1/rego/rego.go:1788`) parses and compiles Rego once, caching it in `compiledQueries[evalQueryType]` so re-evaluation reuses the compiled form.
4. `PreparedEvalQuery.Eval` (`v1/rego/rego.go:559`) sets the compiled query on the eval context and delegates to the engine.

   ```go
   ectx.compiledQuery = pq.r.compiledQueries[evalQueryType]
   return pq.r.eval(ctx, ectx)
   ```

5. `(*Rego).eval` (`v1/rego/rego.go:2309`) branches on target (rego, wasm, plugin). The default rego target builds a `topdown.NewQuery(...)` and injects compiler, store, transaction, built-ins, and caches.
6. `(*Query).Iter` (`v1/topdown/query.go:565`) initializes the `eval` struct and runs the loop in `(*eval).eval` (`v1/topdown/eval.go:404`), which drives `evalExpr` (`v1/topdown/eval.go:408`) and `evalStep` (`v1/topdown/eval.go:461`). When all expressions are consumed it yields a solution.
7. Variable binding is resolved by `(*eval).biunify` (`v1/topdown/eval.go:1134`), the bi-directional unification step.

## Things that surprised me

`evalStep` (`v1/topdown/eval.go:461`) carries two nearly identical branches: one for when tracing is enabled and one for when it is not. The comment explains why this duplication is deliberate.

```text
// NOTE(æ): the reason why there's one branch for the tracing case and one almost
// identical branch below for when tracing is disabled is that the tracing case
// allocates wildly. These allocations are cause by the "defined" boolean variable
// escaping to the heap as its value is set from inside of closures.
```

The non-tracing common path is kept allocation-free; without the split, a `defined` boolean would escape to the heap from inside closures and cost several million allocations on some workloads.

The other surprise is structural: the packages you import at the repository root, such as `rego/rego.go`, contain no logic. They are type aliases onto `v1/*` (for example `type Rego = v1.Rego`). The whole engine moved under `v1/` for the 1.0 default-language switch, and the root packages exist only to keep old import paths working.
