# 内部実装

> コミット `558f788` の `cdk8s-team/cdk8s-core` のソースを読んだもの。ここでの主張はすべてファイルと行を指します。

## コードマップ

公開面は 1 つのバレルエクスポートです。`src/index.ts:1` が全モジュールを re-export します。合成ロジックを担うファイルは次のとおりです。

| パス | 責務 |
| --- | --- |
| `src/app.ts` | `App` ルート construct、`synth()`、依存解決、chart 命名 |
| `src/chart.ts` | `Chart` construct、chart 単位の名前生成 |
| `src/api-object.ts` | `ApiObject`、リソース JSON 描画、JSON パッチとキー順序 |
| `src/resolve.ts` | resolver チェーン (`IResolver`、`ResolutionContext`、`resolve`) |
| `src/dependency.ts` | `DependencyGraph` と `DependencyVertex` のトポロジカルソート |
| `src/names.ts` | `Names` の DNS 互換名生成とハッシュ |
| `src/yaml.ts` | `Yaml` の複数ドキュメント直列化と同期 URL 取得 |

## 中核データ構造

- **construct ツリー。** `App` (`src/app.ts:87`)、`Chart` (`src/chart.ts:36`)、`ApiObject` (`src/api-object.ts:52`) はすべて `Construct` を継承し、`constructs` ライブラリの `node.scope`・`node.children`・`node.dependencies` を共有します。
- **`DependencyGraph` と `DependencyVertex`** (`src/dependency.ts:17` と `src/dependency.ts:98`)。グラフは construct の依存から構築され、`topology()` がトポロジカルソート済みリストを返します (`src/dependency.ts:134`)。`addChild` はサイクルを検出して throw します (`src/dependency.ts:163`、エラーメッセージは `src/dependency.ts:168`)。
- **resolver チェーン。** `IResolver` (`src/resolve.ts:49`) と `ResolutionContext` (`src/resolve.ts:8`) が、合成中に全プロパティへ適用されるプラグイン可能な値書き換え層を成します。
- **`ApiObject` のメタデータとパッチ。** メタデータは `src/api-object.ts:128` が保持する `ApiObjectMetadataDefinition` にあり、キューされた JSON パッチは `src/api-object.ts:133` の private な `patches` 配列にあります。
- **`SynthRequestCache`** (`src/app.ts:70`) は `node.findAll()` の結果を `Map` にメモ化します。合成は construct ツリー全体を何度も走査するためです。

## 追う価値のあるパス

`ApiObject.toJson()` (`src/api-object.ts:200`) を追います。1 リソースを最終 JSON に描画する処理です。本体はデータオブジェクトを組み、トークンを解決し、サニタイズし、パッチを適用し、キーを並べ替えます。

```text
const data: any = {
  ...this.props,
  metadata: this.metadata.toJson(),
};

const sortKeys = process.env.CDK8S_DISABLE_SORT ? false : true;
const json = sanitizeValue(resolve([], data, this), { sortKeys });
const patched = JsonPatch.apply(json, ...this.patches);
```

操作順序が重要です。`resolve([], data, this)` (`src/api-object.ts:209`) がオブジェクトを歩いて resolver チェーンを適用します。続いて `sanitizeValue` が `CDK8S_DISABLE_SORT` が未設定ならキーをソートします。`JsonPatch.apply` がキューされた RFC-6902 (JSON Patch) 操作を適用します (`src/api-object.ts:210`)。最後にトップレベルのキーを並べ替え、`apiVersion`・`kind`・`metadata` を先頭にします (`src/api-object.ts:215`)。

```text
const orderedKeys = ['apiVersion', 'kind', 'metadata', ...Object.keys(patched)];
```

resolver チェーン本体は `resolve` (`src/resolve.ts:116`) にあります。値ごとに `ResolutionContext` を組み、resolver を順に呼びます。最初に `context.replaceValue` を呼んだ resolver が勝ち、置換後の値を再帰的に解決し直します (`src/resolve.ts:126`)。

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

resolver 配列は `App` の constructor で組み立てられます。ユーザ指定の resolver が先頭に来て、続いて 3 つの組み込みが並びます (`src/app.ts:174`)。

```text
this.resolvers = [...(props.resolvers ?? []), new LazyResolver(), new ImplicitTokenResolver(), new NumberStringUnionResolver()];
```

`LazyResolver` は `Lazy` 値を `produce()` で評価し (`src/resolve.ts:64`)、`ImplicitTokenResolver` は `resolve` メソッドを持つ任意のオブジェクトを解決します (`src/resolve.ts:78`)。

## 読んで驚いた点

**`instanceof` を信用しない。** `Chart.isChart` はプロトタイプチェーンではなくマーカー Symbol を見ます (`src/chart.ts:42`)。

```text
public static isChart(x: any): x is Chart {
  return x !== null && typeof(x) === 'object' && CHART_SYMBOL in x;
}
```

マーカーは constructor で `Object.defineProperty(this, CHART_SYMBOL, { value: true })` により設定され (`src/chart.ts:94`)、`CHART_SYMBOL` は `Symbol.for('cdk8s.Chart')` です (`src/chart.ts:6`)。さらにクラスは `static [Symbol.hasInstance]` を override し、`x instanceof Chart` 自体も `isChart` を経由させます (`src/chart.ts:52`)。`ApiObject` も `Symbol.for('cdk8s.ApiObject')` で同じことをします (`src/api-object.ts:50`、検出は `src/api-object.ts:61`、`Symbol.hasInstance` の override は `src/api-object.ts:71`)。理由は `src/chart.ts:40` のコメントにあるとおり、`instanceof` を確実には使えないためです。jsii が言語境界をまたぎ、依存解決が同一ライブラリの複数コピーをディスク上に置くことがあり、プロトタイプ同一性が崩れます。マーカー属性ならコピー間でも一致します。

**HTTP は子プロセスで同期的に行う。** `Yaml.load` は URL を読みますが、cdk8s は API を同期的に保ちます。`loadurl` は `execFileSync` で `_loadurl.mjs` を実行する子プロセスを起動します (`src/yaml.ts:107`)。

```text
function loadurl(url: string): string {
  const script = path.join(__dirname, '_loadurl.mjs');
  return execFileSync(process.execPath, [script, url], {
    encoding: 'utf-8',
    maxBuffer: MAX_DOWNLOAD_BUFFER,
  }).toString();
}
```

**名前ハッシュにはレガシースイッチがある。** `Names.toDnsLabel` (`src/names.ts:68`) は DNS_LABEL (RFC-1123、最大 63 文字) 互換の名前を生成し、8 文字のハッシュを末尾に付けます (`HASH_LEN` は `src/names.ts:7`)。既定ではハッシュは construct のアドレス `node.addr` の先頭 8 文字で、`CDK8S_LEGACY_HASH` を立てると construct パスの sha256 へ切り替わります (`src/names.ts:196`)。

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

**API グループは保存せず解析する。** `parseApiGroup` は `apiVersion` を `/` で分割します。要素が 1 個なら `core` グループ、2 個なら先頭をグループとし、それ以外は throw します (`src/api-object.ts:229`)。
