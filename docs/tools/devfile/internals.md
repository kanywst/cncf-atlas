# Internals

> Read from the source at commit `368ea4e` (`devfile/api`, near tag `v2.3.0`). Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `pkg/apis/workspaces/v1alpha2/` | Hand-written API types plus generated `zz_generated.*.go` code; the format's single source of truth |
| `pkg/apis/workspaces/v1alpha1/` | Older API version with hand-written `*_conversion.go` mapping it to `v1alpha2` |
| `generator/` | Separate Go module: the custom controller-tools generators for overrides, CRDs, schemas, deepcopy, getters, interfaces, and validation |
| `pkg/utils/overriding/` | Applies parent and plugin overrides and merges flattened content |
| `pkg/utils/unions/` | Normalizes and simplifies discriminated unions across the whole tree |
| `pkg/validation/` | Semantic validation of a devfile's internal references and duplicate ids |
| `pkg/attributes/` | The free-form `Attributes` map and typed getters over it |
| `schemas/`, `crds/`, `samples/` | Generated JSON schemas, CRD YAML, and example devfiles |

## Core data structures

- `DevWorkspaceTemplateSpecContent` (`devworkspacetemplate_spec.go:31`) is the devfile body: `Variables`, `Attributes`, `Components`, `Projects`, `StarterProjects`, `DependentProjects`, `Commands`, and `Events` (`devworkspacetemplate_spec.go:31-107`). Each list field carries the markers that drive both generation and merging: `+devfile:toplevellist` marks it as a merge target, `+patchMergeKey=name` or `+patchMergeKey=id` gives the strategic-merge key, and `+devfile:overrides:include:...` decides whether it appears in the parent or plugin override type.
- `Component` and `ComponentUnion` (`components.go:45`, `components.go:61`) form a discriminated union: `Component` holds a `Name` and inlines `ComponentUnion`, whose `ComponentType` field is the discriminator over `Container`, `Kubernetes`, `Openshift`, `Volume`, `Image`, `Plugin`, and `Custom`.
- `Union` (`union.go:24-36`) is the interface every union type implements: a private `discriminator()`, `Normalize()`, and `Simplify()`. The comment ties the design to the Kubernetes union-types KEP (`union.go:22-23`).
- `Attributes` (`attributes.go:30`) is `map[string]apiext.JSON`, a free-form YAML map. On the CRD side its field is marked `+kubebuilder:pruning:PreserveUnknownFields` and `Schemaless` so arbitrary content survives (`devworkspacetemplate_spec.go:52-55`). The typed getters (`GetString`, `GetNumber`, `GetBoolean`) read values out with an error holder (`attributes.go:99`, `attributes.go:126`, `attributes.go:163`).

## A path worth tracing

Applying one devfile's overrides onto another, in `pkg/utils/overriding/overriding.go`. `OverrideDevWorkspaceTemplateSpec` is the core, and it is short because the merge itself is delegated:

```text
OverrideDevWorkspaceTemplateSpec(original, patch)   overriding.go:75
  ensureOnlyExistingElementsAreOverridden(...)      overriding.go:76  (defined :133)
  unions.Normalize(&original) / Normalize(&patch)   overriding.go:80 / :83
  json.Marshal(original) -> originalMap             overriding.go:92
  json.Marshal(patch)    -> patchMap                overriding.go:101
  strategicpatch.NewPatchMetaFromStruct(original)   overriding.go:106
  strategicpatch.StrategicMergeMapPatchUsingLookupPatchMeta(...)  overriding.go:111
  json.Unmarshal(patchedBytes, &patched)            overriding.go:122
  unions.Simplify(&patched)                         overriding.go:127
```

The two checks before the merge are the only bespoke logic. `ensureOnlyExistingElementsAreOverridden` walks the override and errors if it names an element the base does not have, so an override edits existing entries rather than adding new ones (`overriding.go:76`, `overriding.go:133`). `unions.Normalize` fixes each union's discriminator so a half-specified union does not slip into the merge ambiguous (`overriding.go:80`, `overriding.go:83`). After that, the base and patch are marshaled to JSON, patch metadata is read from the struct tags with `NewPatchMetaFromStruct`, and `StrategicMergeMapPatchUsingLookupPatchMeta` does the actual merge using Kubernetes' own strategic merge patch (`overriding.go:106`, `overriding.go:111`). The result is unmarshaled back and `Simplify` strips the discriminators (`overriding.go:127`).

Merging several flattened contents is the neighboring `MergeDevWorkspaceTemplateSpec` (`merging.go:40`). It reads the top-level list field names with `GetToplevelLists`, then uses reflection to append every list across all contents into one result (`merging.go:76-108`). When it reaches the main content's `plugin` components it skips them, because plugins arrive already flattened and are merged separately (`merging.go:100-106`).

## Things that surprised me

- **The parser is not here.** `devfile/api` gives you the types and the override, merge, union, and validation helpers, but reading a `devfile.yaml`, resolving `parent`, and fetching from a registry live in `devfile/library`. The boundary is easy to miss because the README talks about the format as if the repository were the whole story.
- **The override merge is Kubernetes strategic merge patch, verbatim.** The library marshals to JSON and calls `StrategicMergeMapPatchUsingLookupPatchMeta` (`overriding.go:111`). The merge keys and strategies are not encoded in the merge code; they are read at run time from the same `+patchMergeKey` and `+patchStrategy` struct tags the generator also uses. Change a tag and both generation and merging change together.
- **Getters exist to preserve the nil-versus-default distinction.** For optional bool fields, the `getters` generator emits `GetXxx()` methods that return the default declared by a `+devfile:default:value` marker (`component_container.go:104`, `commands.go:55`), for example `GetDedicatedPod` (`zz_generated.getters.go:19`) and `GetAutoBuild` (`zz_generated.getters.go:24`). The stored field stays a pointer so unset and false are distinguishable, while callers get the default applied.
- **`v1alpha1` still ships.** Hand-written conversion code maps the old version to `v1alpha2`, and the CRDs carry more than one stored version as a result. The single-source-of-truth story is mostly true, but the conversion layer is a hand-written exception to it.
