# Internals

> Read from the source at commit `558f788`. Every claim here points at a file and line in `cdk8s-team/cdk8s-core`.

## Code map

The public surface is one barrel export: `src/index.ts:1` re-exports every module. The files that carry the synthesis logic are:

| Path | Responsibility |
| --- | --- |
| `src/app.ts` | `App` root construct, `synth()`, dependency resolution, chart naming |
| `src/chart.ts` | `Chart` construct, per chart name generation |
| `src/api-object.ts` | `ApiObject`, resource JSON rendering, JSON patch and key ordering |
| `src/resolve.ts` | resolver chain (`IResolver`, `ResolutionContext`, `resolve`) |
| `src/dependency.ts` | `DependencyGraph` and `DependencyVertex` topological sort |
| `src/names.ts` | `Names` DNS compatible name generation and hashing |
| `src/yaml.ts` | `Yaml` multi document serialization and synchronous URL loading |

## Core data structures

- **The construct tree.** `App` (`src/app.ts:87`), `Chart` (`src/chart.ts:36`), and `ApiObject` (`src/api-object.ts:52`) all extend `Construct`, so they share `node.scope`, `node.children`, and `node.dependencies` from the `constructs` library.
- **`DependencyGraph` and `DependencyVertex`** (`src/dependency.ts:17` and `src/dependency.ts:98`). The graph is built from construct dependencies; `topology()` returns a topologically sorted list (`src/dependency.ts:134`). `addChild` detects cycles and throws (`src/dependency.ts:163`, error message at `src/dependency.ts:168`).
- **The resolver chain.** `IResolver` (`src/resolve.ts:49`) and `ResolutionContext` (`src/resolve.ts:8`) form the pluggable value rewriting layer applied to every property during synthesis.
- **`ApiObject` metadata and patches.** The metadata lives in `ApiObjectMetadataDefinition` held at `src/api-object.ts:128`, and queued JSON patches live in the private `patches` array at `src/api-object.ts:133`.
- **`SynthRequestCache`** (`src/app.ts:70`) memoizes `node.findAll()` results in a `Map`, because synthesis walks the full construct tree many times.

## A path worth tracing

Follow `ApiObject.toJson()` (`src/api-object.ts:200`), which renders one resource into its final JSON. The body builds the data object, resolves tokens, sanitizes, applies patches, and reorders keys:

```text
const data: any = {
  ...this.props,
  metadata: this.metadata.toJson(),
};

const sortKeys = process.env.CDK8S_DISABLE_SORT ? false : true;
const json = sanitizeValue(resolve([], data, this), { sortKeys });
const patched = JsonPatch.apply(json, ...this.patches);
```

The order of operations matters. `resolve([], data, this)` (`src/api-object.ts:209`) walks the object and applies the resolver chain. `sanitizeValue` then sorts keys unless `CDK8S_DISABLE_SORT` is set. `JsonPatch.apply` applies the queued RFC-6902 (JSON Patch) operations (`src/api-object.ts:210`). Finally the top level keys are reordered so `apiVersion`, `kind`, and `metadata` come first (`src/api-object.ts:215`):

```text
const orderedKeys = ['apiVersion', 'kind', 'metadata', ...Object.keys(patched)];
```

The resolver chain itself is in `resolve` (`src/resolve.ts:116`). For each value it builds a `ResolutionContext` and calls each resolver in order; the first resolver to call `context.replaceValue` wins, and the replaced value is resolved again recursively (`src/resolve.ts:126`):

```text
const context = new ResolutionContext(apiObject, key, value);
for (const resolver of resolvers) {
  resolver.resolve(context);
  if (context.replaced) {
    // stop when the first resolver replaces the value.
    return resolve(key, context.replacedValue, apiObject);
  }
}
```

The resolver array is assembled in the `App` constructor. User supplied resolvers come first, followed by the three built ins (`src/app.ts:174`):

```text
this.resolvers = [...(props.resolvers ?? []), new LazyResolver(), new ImplicitTokenResolver(), new NumberStringUnionResolver()];
```

`LazyResolver` evaluates a `Lazy` value through `produce()` (`src/resolve.ts:64`), and `ImplicitTokenResolver` resolves any object that exposes a `resolve` method (`src/resolve.ts:78`).

## Things that surprised me

**`instanceof` is not trusted.** `Chart.isChart` checks for a marker symbol rather than the prototype chain (`src/chart.ts:42`):

```text
public static isChart(x: any): x is Chart {
  return x !== null && typeof(x) === 'object' && CHART_SYMBOL in x;
}
```

The marker is set in the constructor with `Object.defineProperty(this, CHART_SYMBOL, { value: true })` (`src/chart.ts:94`), where `CHART_SYMBOL` is `Symbol.for('cdk8s.Chart')` (`src/chart.ts:6`). The class then overrides `static [Symbol.hasInstance]` so that even `x instanceof Chart` routes through `isChart` (`src/chart.ts:52`). `ApiObject` does the same with `Symbol.for('cdk8s.ApiObject')` (`src/api-object.ts:50`, detection at `src/api-object.ts:61`, `Symbol.hasInstance` override at `src/api-object.ts:71`). The reason, stated in the comment at `src/chart.ts:40`, is that `instanceof` cannot be relied on: jsii crosses language boundaries, and dependency resolution can place several copies of the same library on disk, breaking prototype identity. A marker attribute compares equal across copies.

**HTTP is done synchronously through a child process.** `Yaml.load` reads a URL, but cdk8s keeps the API synchronous. `loadurl` spawns a child process running `_loadurl.mjs` with `execFileSync` (`src/yaml.ts:107`):

```text
function loadurl(url: string): string {
  const script = path.join(__dirname, '_loadurl.mjs');
  return execFileSync(process.execPath, [script, url], {
    encoding: 'utf-8',
    maxBuffer: MAX_DOWNLOAD_BUFFER,
  }).toString();
}
```

**Name hashing has a legacy switch.** `Names.toDnsLabel` (`src/names.ts:68`) generates a DNS_LABEL (RFC-1123, at most 63 characters) compatible name and appends an 8 character hash (`HASH_LEN` at `src/names.ts:7`). By default the hash is the first 8 characters of `node.addr`, the construct address; setting `CDK8S_LEGACY_HASH` switches to a sha256 of the construct path (`src/names.ts:196`):

```text
function calcHash(node: Node, maxLen: number) {
  if (process.env.CDK8S_LEGACY_HASH) {
    const hash = crypto.createHash('sha256');
    hash.update(node.path);
    return hash.digest('hex').slice(0, maxLen);
  }

  return node.addr.substring(0, HASH_LEN);
}
```

**The API group is parsed, not stored.** `parseApiGroup` splits `apiVersion` on `/`; a single element means the `core` group, two elements take the first as the group, and anything else throws (`src/api-object.ts:229`).
