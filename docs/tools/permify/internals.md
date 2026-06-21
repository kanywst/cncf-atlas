# Internals

> Read from the source at commit `aa3a7c6`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/permify/permify.go` | Binary entry point; registers CLI commands and the gRPC balancer/resolver |
| `internal/servers` | gRPC/REST handlers; validate and delegate to the invoker |
| `internal/invoke` | `DirectInvoker`; depth check, consistency defaults, dispatch to engines |
| `internal/engines` | Check/Expand/Lookup resolution; boolean combinators and concurrency |
| `internal/schema` | Resolve entity/permission/relation/rule definitions from the compiled schema |
| `internal/storage` | Persistence: `postgres/`, `memory/`, `proxies/`, request-scoped `context/` |
| `pkg/tuple` | Relation tuple and subject helpers |
| `pkg/database/postgres` | PostgreSQL types including `XID8` |

## Core data structures

- Relation tuple and `Subject` (`pkg/tuple/tuple.go`): the Zanzibar `entity#relation@subject` shape carried as a protobuf type. `ELLIPSIS = "..."` marks the wildcard relation (`pkg/tuple/tuple.go:19`), `IsDirectSubject` treats an empty relation as a direct user subject (`pkg/tuple/tuple.go:26-28`), and `AreSubjectsEqual` compares after normalizing the ellipsis (`pkg/tuple/tuple.go:39-41`).
- `EntityDefinition` / `Rewrite` / `Leaf` / `Child` (generated protobuf under `pkg/pb/base/v1`): the schema DSL compiles into this tree, and `check()` walks it.
- `CheckFunction` and `CheckCombiner` (`internal/engines/check.go:89-95`): a check is `func(ctx) (*PermissionCheckResponse, error)`, and a combiner composes several of them. Authorization evaluation is built as a tree of lazy closures.
- `Token` (`internal/storage/postgres/snapshot/token.go:16-26`): a PostgreSQL `XID8` value plus a snapshot string; the consistency anchor described below.

## A path worth tracing

A single `Check` from RPC to decision:

```text
PermissionServer.Check            internal/servers/permission_server.go:32
  DirectInvoker.Check             internal/invoke/invoke.go:105
    checkDepth                    internal/invoke/utils.go:10
    HeadSnapshot / HeadVersion    internal/invoke/invoke.go:135-167
  CheckEngine.Check               internal/engines/check.go:63
    check (branch by ref type)    internal/engines/check.go:108
      checkRewrite (UNION/...)    internal/engines/check.go:168
      checkDirectRelation         internal/engines/check.go:252
    checkUnion / checkRun         internal/engines/check.go:635 / 820
```

The invoker decrements depth on a clone so the original request is never mutated:

```go
nextRequest := request.CloneVT()
nextRequest.Metadata.Depth = request.GetMetadata().Depth - 1
```

That is `internal/invoke/invoke.go:170-171`. The engine's `check()` then chooses a branch from the reference type, and a permission with a rewrite is dispatched to the boolean combinator:

```go
case base.EntityDefinition_REFERENCE_PERMISSION:
    ...
    if child.GetRewrite() != nil {
        fn = engine.checkRewrite(ctx, request, child.GetRewrite())
    } else {
        fn = engine.checkLeaf(request, child.GetLeaf())
    }
```

That is `internal/engines/check.go:128-144`.

## Things that surprised me

The SnapToken is not a custom log position; it is a PostgreSQL transaction snapshot. `Token` holds an `XID8` and a snapshot string, and `Encode` produces a base64 of `xid:snapshot` while still decoding the legacy 8-byte binary xid for backward compatibility (`internal/storage/postgres/snapshot/token.go:38-123`). Ordering between tokens is integer comparison of the XID8 value in `Eg`, `Gt`, and `Lt` (`internal/storage/postgres/snapshot/token.go:60-77`). Because every check pins itself to `HeadSnapshot()` when no token is supplied (`internal/invoke/invoke.go:135-151`), consistency rides directly on PostgreSQL's MVCC visibility rather than a separate consistency service. This is the same role as SpiceDB's ZedToken, but implemented with the database's native snapshot instead of a dedicated store.

The second surprise is how aggressively `checkUnion` short-circuits. Children run concurrently under a cancellable context, and the first ALLOWED result returns immediately while a deferred `cancel()` stops the siblings (`internal/engines/check.go:635-685`). The fan-out is capped by a semaphore channel sized to `concurrencyLimit`, default 100 (`internal/engines/utils.go:18-20`), so a deeply nested schema cannot spawn unbounded goroutines.
