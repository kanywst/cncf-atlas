# Internals

> Read from the source at commit `10087e7`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `internal/eventstore/` | Event store core: `Push`, `Filter`, `FilterToReducer`, `Search`; the `events2` table is the source of truth |
| `internal/command/` | Write-side use cases; reduce a domain operation to a write model, check consistency, then push events |
| `internal/query/` | Read side; materialize projections into SQL tables and serve reads |
| `internal/api/` | API layer: `grpc/`, `http/`, `authz/`; three transports from one service definition |
| `internal/api/authz/` | Token verification and permission checks |
| `cmd/` | Cobra commands (`start`, `setup`, `initialise`, `mirror`, `key`); `cmd/zitadel.go` is the root |
| `backend/v3/` | In-progress next-generation backend (storage, api, instrumentation) |

## Core data structures

The `Command` interface is the intent to write an event (internal/eventstore/event.go:28). It embeds `action` (which requires `Aggregate()`, `Creator()`, `Type()`, `Revision()`, event.go:16) and adds `Payload() any` (nil, a struct, or JSON bytes), `UniqueConstraints()`, and `Fields()` for declaring values to index.

The `Event` interface is a stored activity (event.go:55). It carries `Sequence() uint64` (per-aggregate counter), `CreatedAt()`, `Position() decimal.Decimal` (global ordering), and `Unmarshal(ptr any)`.

The `Aggregate` struct forces tenant identity into the model (internal/eventstore/aggregate.go:79):

    type Aggregate struct {
        ID string `json:"id"`
        Type AggregateType `json:"type"`
        // ResourceOwner is the org this aggregates belongs to
        ResourceOwner string `json:"resourceOwner"`
        // InstanceID is the instance this aggregate belongs to
        InstanceID string `json:"instanceId"`
        Version Version `json:"version"`
    }

`ResourceOwner` and `InstanceID` are filled automatically from context in `NewAggregate` (aggregate.go:20), so no write can omit its tenant.

On the authorization side, `CtxData`, `Membership`, and `RoleMapping` carry the auth context: memberships (org/project roles) are translated into permission strings, and the entire `internal/api/authz/permissions.go` is that translation. `SystemUserPermissions` is the system-user variant, deduplicated with `slices.Sort` and `slices.Compact`.

## A path worth tracing

Permission resolution turns memberships into the permission strings the request is checked against. It starts in `getUserPermissions` (internal/api/authz/permissions.go:25). If the caller is a system user, its system memberships map directly (permissions.go:33). Otherwise it loads memberships, and if none are found, retries once with inheritance before giving up:

    memberships, err := resolver.SearchMyMemberships(ctx, orgID, false)
    if err != nil {
        return nil, nil, err
    }
    if len(memberships) == 0 {
        memberships, err = resolver.SearchMyMemberships(ctx, orgID, true)
        if len(memberships) == 0 {
            return nil, nil, zerrors.ThrowNotFound(nil, "AUTHZ-cdgFk", "membership not found")
        }

The roles on each membership are expanded into permissions by `mapMembershipToPerm` (permissions.go:98). For project and project-grant roles, the project's `ObjectID` is appended as a context, producing strings like `project.write:123` (permissions.go:120):

    func addRoleContextIDToPerm(perm, roleContextID string) string {
        if roleContextID != "" {
            perm = perm + ":" + roleContextID
        }
        return perm
    }

`checkUserPermissions` then decides (internal/api/authz/authorization.go:60). Zero permissions is a deny (`AUTH-5mWD2`). If the auth option has no `CheckParam`, any permission suffices (global). Otherwise it allows when the user holds a permission with no context ID (`HasGlobalPermission`, authorization.go:111) or when a request field matches a permission's context ID (`hasContextPermission`, authorization.go:88). The request field is pulled by reflection (`getFieldFromReq`, authorization.go:103).

The call chain:

    AuthorizationInterceptor (auth_interceptor.go:16)
      -> CheckUserAuthorization (authorization.go:24)
         -> VerifyTokenAndCreateCtxData (authorization.go:28)
         -> getUserPermissions (permissions.go:25)
            -> mapMembershipsToPermissions -> addRoleContextIDToPerm (permissions.go:120)
         -> checkUserPermissions (authorization.go:60)
            -> HasGlobalPermission / hasContextPermission

The permission model is just a list of `"<verb>:<resourceID>"` strings. RBAC is a role-to-permission mapping table, and resource scoping is a string match on the part after the colon. There is no policy DSL.

## Things that surprised me

`Push` does not lock at the application level. The event primary key is effectively `(instance, aggregate, sequence)`, so two concurrent writers that pick the same sequence cause a PostgreSQL `events2_pkey` violation (SQLSTATE `23505`), and the code retries the whole transaction up to `maxRetries` times (internal/eventstore/eventstore.go:133). The constraint name is hardcoded in the check:

    if pgErr.ConstraintName == "events2_pkey" && pgErr.SQLState() == "23505" {
        logging.WithError(ctx, err).Info("eventstore push retry")
        continue
    }
    if pgErr.SQLState() == "CR000" || pgErr.SQLState() == "40001" {
        logging.WithError(ctx, err).Info("eventstore push retry")
        continue
    }

The CockroachDB `CR000` and serialization-failure `40001` codes are still handled here (eventstore.go:148), a leftover from the pre-v3 CockroachDB era. The comment links issue #7202. Serialization is pushed entirely onto the database and a retry loop, not application coordination.

Two more non-obvious choices. Events can be looked up by field before any projection is built: values declared by `Command.Fields()` (event.go:39) are written to a dedicated field-index table and read through `Eventstore.Search` (eventstore.go:184). And global ordering uses `shopspring/decimal` for `Position` rather than a monotonic bigint (event.go:63), which keeps cross-transaction ordering stable while leaving room to insert positions between existing events.
