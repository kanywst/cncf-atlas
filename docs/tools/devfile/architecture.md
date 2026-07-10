# Architecture

## Big picture

`devfile/api` has two layers. The first is a code-generation pipeline: Go types annotated with marker comments are read by a set of generators that emit CRDs, JSON schemas, deepcopy code, getters, override types, and a validation schema. The second is a runtime library that operates on those types at run time: applying a parent or plugin as an override, merging inherited content, normalizing discriminated unions, and validating internal references. The Go types are the shared center both layers turn on.

```text
Go types (pkg/apis/workspaces/v1alpha2/*.go)  +markers
        |
        |  generator/ reads markers
        v
  CRDs (crds/)   JSON schemas (schemas/)   deepcopy/getters (zz_generated.*)
  override types (ParentOverrides, PluginOverrides)   TS model (build/typescript-model)
        ^
        |  runtime library consumes the same types
        |
  pkg/utils/overriding   pkg/utils/unions   pkg/validation   pkg/attributes
```

## Components

### API types

The type definitions live in `pkg/apis/workspaces/v1alpha2/`. The top type is `DevWorkspace`, the CRD (`devworkspace_types.go:95`). The reusable content sits in `DevWorkspaceTemplateSpecContent` (`devworkspacetemplate_spec.go:31`), which carries the fields a devfile author actually writes: `Variables`, `Attributes`, `Components`, `Projects`, `StarterProjects`, `DependentProjects`, `Commands`, and `Events` (`devworkspacetemplate_spec.go:31-107`). Generated code (deepcopy, getters, union definitions, override types) lives beside it in `zz_generated.*.go` files and is never edited by hand.

### The generator

`generator/` is a separate Go module holding a custom code generator built on controller-tools. Its `main.go` registers seven generators by name: `overrides`, `interfaces`, `crds`, `deepcopy`, `schemas`, `validate`, and `getters` (`generator/main.go:46-54`). Each reads marker comments on the types (for example `+devfile:jsonschema:generate` on `DevWorkspace` at `devworkspace_types.go:93`) and writes one artifact. Because CRD generation extends controller-tools rather than calling `controller-gen` unchanged, the pipeline can add devfile-specific behavior such as the override types.

### The override and merge library

`pkg/utils/overriding/` applies a parent devfile or a plugin on top of a base devfile. It does not implement its own merge algorithm; it hands the work to Kubernetes strategic merge patch (see the flow below). `pkg/utils/unions/` normalizes and simplifies discriminated unions. `pkg/validation/` checks a devfile's internal consistency (duplicate ids, references that point at a component that exists), split by element type across `commands.go`, `components.go`, `projects.go`, `endpoints.go`, and `events.go`. `pkg/attributes/` handles the free-form YAML attribute map.

## How a request flows

Trace applying a parent's overrides onto a base devfile, the most interesting path in the library.

1. Entry: `OverrideDevWorkspaceTemplateSpecBytes(originalBytes, patchBytes)` converts the two YAML documents to JSON, unmarshals the base into `DevWorkspaceTemplateSpecContent` and the patch into a generated override type (`overriding.go:40`).
2. Core: `OverrideDevWorkspaceTemplateSpec(original, patch)` (`overriding.go:75`) does the work in order:
   - `ensureOnlyExistingElementsAreOverridden` rejects a patch that introduces a key not present in the base; an override may change existing elements, it cannot add new ones (`overriding.go:76`, defined at `overriding.go:133`).
   - `unions.Normalize` is called on both base and patch, fixing each union's discriminator and erroring on an ambiguous one (`overriding.go:80` and `overriding.go:83`).
   - Both sides are marshaled back to JSON, and `strategicpatch.NewPatchMetaFromStruct(original)` builds patch metadata (merge keys and strategies) from the struct tags (`overriding.go:106`).
   - `strategicpatch.StrategicMergeMapPatchUsingLookupPatchMeta` runs the Kubernetes strategic merge (`overriding.go:111`). This is the key decision: the merge rules come from Kubernetes, driven by the `+patchMergeKey` and `+patchStrategy` tags left on the fields.
   - The result is unmarshaled back to `DevWorkspaceTemplateSpecContent` and `unions.Simplify` drops the discriminators before returning (`overriding.go:127`).
3. After each inheritance level is flattened, `MergeDevWorkspaceTemplateSpec(main, parentFlattened, plugins...)` combines them (`merging.go:40`). It reads the top-level list field names, then uses reflection to append each list across all contents (`merging.go:76-108`), skipping any `plugin` component from the main content because plugins arrive already flattened (`merging.go:100-106`). Duplicate keys across main, parent, and plugins are rejected by `ensureNoConflictWithParent` (`merging.go:209`) and `ensureNoConflictsWithPlugins` (`merging.go:225`).

## Key design decisions

- **Go types as the single source of truth.** Every consumable artifact (CRDs, JSON schemas, TypeScript model, deepcopy, getters, override types, validation schema) is generated from the same Go types by the seven generators (`generator/main.go:46-54`, `README.md:11-24`). A change to the format is a change to one Go struct, and the rest follows.
- **Reuse Kubernetes strategic merge patch instead of a custom merge.** The override logic marshals to JSON and calls `strategicpatch.StrategicMergeMapPatchUsingLookupPatchMeta` (`overriding.go:111`), so the merge semantics (merge by key, replace, delete directives) are exactly Kubernetes semantics, driven by struct tags rather than bespoke code.
- **Discriminated unions follow the Kubernetes union KEP.** The `Union` interface points at the KEP for union types (`union.go:22-36`) and defines `Normalize` and `Simplify`, applied across the whole tree with `reflectwalk` (`normalize.go:71`, `normalize.go:78`).
- **Override types are generated, not hand-written.** `ParentOverrides` and `PluginOverrides` are produced by the `overrides` generator, and the `+devfile:overrides:include:omitInPlugin=true` marker excludes fields a plugin must not override (variables, projects) at the type level (`devworkspacetemplate_spec.go:45`, `devworkspacetemplate_spec.go:70`).

## Extension points

- **The CRDs.** `DevWorkspace` and `DevWorkspaceTemplate` are Kubernetes custom resources (`devworkspace_types.go:88-94`), so a controller such as `devfile/devworkspace-operator` reconciles them into running workspaces.
- **`parent` and `plugin`.** A devfile can inherit from a `parent` devfile and pull in a `plugin`, resolved through the override and merge library above. This is the main way one devfile is composed from others.
- **Free-form attributes.** The `Attributes` map is schemaless and preserves unknown fields (`devworkspacetemplate_spec.go:52-55`), giving implementations a place to attach tool-specific metadata without changing the schema.
- **The generated TypeScript model.** `build/typescript-model/` produces the `@devfile/api` npm package, so JavaScript and TypeScript tools consume the same format from the same schema.
