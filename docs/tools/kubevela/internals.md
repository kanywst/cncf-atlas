# Internals

> Read from the source at commit `a10dba6`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/apis/core.oam.dev/` | OAM API types: `Application`, `ApplicationComponent`, `ResourceTracker` |
| `src/cmd/core/main.go` | Controller-manager entry point (`:25`) |
| `src/pkg/controller/core.oam.dev/v1beta1/application/` | The `Application` reconciler and step generator |
| `src/pkg/appfile/` | Parses an `Application` into the `Appfile` form and renders components from CUE |
| `src/pkg/resourcekeeper/` | Dispatches rendered resources and owns garbage collection |
| `src/pkg/multicluster/` | Cross-cluster delivery |

## Core data structures

- **`Application`** (`src/apis/core.oam.dev/v1beta1/application_types.go:81`): the single user-facing input CR, marked as the storage version. Its spec holds `Components`, `Policies`, and `Workflow` (`:51-65`).
- **`ApplicationComponent`** (`src/apis/core.oam.dev/common/types.go:351`): the OAM composition unit, carrying `Name`, `Type`, `Properties` (a `RawExtension`), `DependsOn`, `Inputs`, `Outputs`, and `Traits`.
- **`Appfile`** (`src/pkg/appfile/appfile.go:160`): the in-reconcile intermediate representation. It holds `ParsedComponents`, `ParsedPolicies`, the resolved related definitions, and the rendered artifacts.
- **`ComponentManifest`** (`src/apis/types/componentmanifest.go:24`): the render result for one component, the workload plus its traits as unstructured objects.
- **`ResourceTracker`** (`src/apis/core.oam.dev/v1beta1/resourcetracker_types.go:51`): the ledger of applied resources. Its `Type` is `root`, `versioned`, or `component-revision` (`:61-68`), and the type decides the garbage-collection lifetime.

## A path worth tracing

Rendering one component from its CUE definition into a real Kubernetes object is the heart of the system. The entry is `Appfile.GenerateComponentManifest` (`src/pkg/appfile/appfile.go:332`). It branches on capability category: a Terraform component becomes a Terraform module, everything else goes through `generateComponentFromCUEModule` (`:346`).

The CUE path lands in `baseGenerateComponent` (`src/pkg/appfile/appfile.go:553`). For each trait it calls `EvalContext(pCtx)` (`:556-560`). If the component carries a patch, the patch is merged onto the workload with CUE unification:

```go
if p := patcher.LookupPath(cue.ParsePath("workload")); p.Exists() {
    if err := workload.Unify(p); err != nil {
        return nil, errors.WithMessage(err, "patch workload")
    }
}
```

That snippet is `src/pkg/appfile/appfile.go:563-566`. Traits are unified the same way (`:570`). Finally the CUE value is turned into a Kubernetes object: `base.Unstructured()` (`src/pkg/appfile/appfile.go:599`). When that conversion fails, the error is run through `FormatCUEError` before being returned (`:604`).

The full call chain from reconcile to cluster:

```text
Reconcile (application_controller.go:109)
  -> GenerateAppFile (parser.go:87)
  -> GenerateApplicationSteps (application_controller.go:222)
  -> ExecuteRunners (application_controller.go:236)
       -> resourceKeeper.Dispatch (generator.go:104 -> dispatch.go:61)
```

## Things that surprised me

The abstraction layer is data, not code. Trait-to-workload composition is a CUE `Unify` call (`src/pkg/appfile/appfile.go:564`), so adding a component or trait type means adding a CUE definition, not changing Go. The trade-off shows up immediately in error handling: because failures surface as raw CUE evaluation errors, the project carries a dedicated `FormatCUEError` formatter to make them readable (`:604`).

The `ResourceTracker` ledger has a non-obvious storage trick. `ResourceTrackerSpec.MarshalJSON` is overridden so that when compression is enabled it nulls out `ManagedResources` and encodes them into a compressed field instead (`src/apis/core.oam.dev/v1beta1/resourcetracker_types.go:86-103`). The comment in the code is explicit that this is not the standard JSON marshal process but a reuse of the framework's compression helper. This keeps the tracker CR small even when it lists many applied resources.
