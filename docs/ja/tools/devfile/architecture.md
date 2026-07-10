# アーキテクチャ

## 全体像

`devfile/api` は 2 層からなる。第 1 の層はコード生成パイプラインである。marker コメントを付けた Go 型を一連のジェネレータが読み、CRD・JSON スキーマ・deepcopy コード・getter・override 型・validation スキーマを吐き出す。第 2 の層はランタイムライブラリで、これらの型を実行時に操作する。親や plugin を override として適用し、継承内容をマージし、discriminated union を正規化し、内部参照を検証する。両層が回転する共有の中心が Go 型である。

```text
Go 型 (pkg/apis/workspaces/v1alpha2/*.go)  +markers
        |
        |  generator/ が marker を読む
        v
  CRD (crds/)   JSON スキーマ (schemas/)   deepcopy/getter (zz_generated.*)
  override 型 (ParentOverrides, PluginOverrides)   TS モデル (build/typescript-model)
        ^
        |  ランタイムライブラリが同じ型を消費
        |
  pkg/utils/overriding   pkg/utils/unions   pkg/validation   pkg/attributes
```

## コンポーネント

### API 型

型定義は `pkg/apis/workspaces/v1alpha2/` にある。トップ型は CRD である `DevWorkspace` (`devworkspace_types.go:95`)。再利用される内容は `DevWorkspaceTemplateSpecContent` (`devworkspacetemplate_spec.go:31`) に収まり、devfile 作者が実際に書くフィールド、すなわち `Variables`・`Attributes`・`Components`・`Projects`・`StarterProjects`・`DependentProjects`・`Commands`・`Events` を持つ (`devworkspacetemplate_spec.go:31-107`)。生成コード (deepcopy・getter・union 定義・override 型) は隣の `zz_generated.*.go` にあり、手書きされることはない。

### ジェネレータ

`generator/` は controller-tools の上に構築された独自コードジェネレータを持つ、独立した Go モジュールである。その `main.go` は 7 つのジェネレータを名前で登録する。`overrides`・`interfaces`・`crds`・`deepcopy`・`schemas`・`validate`・`getters` である (`generator/main.go:46-54`)。各々が型の marker コメント (例えば `DevWorkspace` の `+devfile:jsonschema:generate`、`devworkspace_types.go:93`) を読み、1 つの成果物を書き出す。CRD 生成は `controller-gen` をそのまま呼ばず controller-tools を拡張しているため、override 型のような devfile 固有の挙動をパイプラインに足せる。

### override / merge ライブラリ

`pkg/utils/overriding/` は親 devfile や plugin を基底 devfile の上に適用する。独自のマージアルゴリズムは実装せず、処理を Kubernetes の strategic merge patch に委ねる (下記の流れを参照)。`pkg/utils/unions/` は discriminated union を正規化・単純化する。`pkg/validation/` は devfile の内部整合性 (id の重複、存在するコンポーネントを指しているかの参照) を検査し、要素種別ごとに `commands.go`・`components.go`・`projects.go`・`endpoints.go`・`events.go` へ分かれる。`pkg/attributes/` は自由形式 YAML の属性マップを扱う。

## リクエストの流れ

親の override を基底 devfile に適用する経路を追う。ライブラリで最も面白いパスである。

1. 入口: `OverrideDevWorkspaceTemplateSpecBytes(originalBytes, patchBytes)` が 2 つの YAML を JSON へ変換し、基底を `DevWorkspaceTemplateSpecContent` に、patch を生成された override 型にアンマーシャルする (`overriding.go:40`)。
2. 本体: `OverrideDevWorkspaceTemplateSpec(original, patch)` (`overriding.go:75`) が順に処理する。
   - `ensureOnlyExistingElementsAreOverridden` は、基底に存在しないキーを導入する patch を拒否する。override は既存要素を変更できるが、新規追加はできない (`overriding.go:76`、定義は `overriding.go:133`)。
   - `unions.Normalize` を基底と patch の両方に呼び、各 union の discriminator を確定し、曖昧なものはエラーにする (`overriding.go:80` と `overriding.go:83`)。
   - 両者を JSON にマーシャルし直し、`strategicpatch.NewPatchMetaFromStruct(original)` が struct タグから patch メタ (merge キーと strategy) を構築する (`overriding.go:106`)。
   - `strategicpatch.StrategicMergeMapPatchUsingLookupPatchMeta` が Kubernetes の strategic merge を実行する (`overriding.go:111`)。ここが肝心な判断で、マージ規則は Kubernetes 由来であり、フィールドに残る `+patchMergeKey` と `+patchStrategy` タグが駆動する。
   - 結果を `DevWorkspaceTemplateSpecContent` に戻し、`unions.Simplify` が discriminator を落として返す (`overriding.go:127`)。
3. 各継承レベルを平坦化した後、`MergeDevWorkspaceTemplateSpec(main, parentFlattened, plugins...)` がそれらをまとめる (`merging.go:40`)。トップレベルリストのフィールド名を読み、reflection で各リストを全内容にわたって連結し (`merging.go:76-108`)、main 内容の `plugin` component は結果から除外する。plugin は既に平坦化された形で渡ってくるためである (`merging.go:100-106`)。main・parent・plugin をまたぐキー重複は `ensureNoConflictWithParent` (`merging.go:209`) と `ensureNoConflictsWithPlugins` (`merging.go:225`) が弾く。

## 主要な設計判断

- **Go 型を単一の真実とする。** 消費可能な成果物 (CRD・JSON スキーマ・TypeScript モデル・deepcopy・getter・override 型・validation スキーマ) はすべて、7 つのジェネレータが同じ Go 型から生成する (`generator/main.go:46-54`、`README.md:11-24`)。フォーマットの変更とは 1 つの Go struct の変更であり、残りは後から追随する。
- **独自マージではなく Kubernetes strategic merge patch を再利用する。** override ロジックは JSON にマーシャルして `strategicpatch.StrategicMergeMapPatchUsingLookupPatchMeta` を呼ぶ (`overriding.go:111`) ため、マージ意味論 (キーによる merge・replace・delete ディレクティブ) はまさに Kubernetes のそれであり、独自コードではなく struct タグが駆動する。
- **discriminated union は Kubernetes の union KEP に沿う。** `Union` インターフェースは union 型の KEP を指し (`union.go:22-36`)、`Normalize` と `Simplify` を定義して、`reflectwalk` でツリー全体に適用する (`normalize.go:71`、`normalize.go:78`)。
- **override 型は手書きではなく生成する。** `ParentOverrides` と `PluginOverrides` は `overrides` ジェネレータが作り、`+devfile:overrides:include:omitInPlugin=true` marker が plugin で override してはいけないフィールド (variables・projects) を型レベルで除外する (`devworkspacetemplate_spec.go:45`、`devworkspacetemplate_spec.go:70`)。

## 拡張ポイント

- **CRD。** `DevWorkspace` と `DevWorkspaceTemplate` は Kubernetes のカスタムリソースであり (`devworkspace_types.go:88-94`)、`devfile/devworkspace-operator` のようなコントローラがそれらを実行中のワークスペースへ reconcile する。
- **`parent` と `plugin`。** devfile は `parent` devfile を継承し `plugin` を取り込める。上記の override / merge ライブラリで解決される。1 つの devfile を他の devfile から組み立てる主要な手段である。
- **自由形式属性。** `Attributes` マップは schemaless で未知フィールドを保持する (`devworkspacetemplate_spec.go:52-55`)。実装がスキーマを変えずにツール固有のメタデータを付ける場所を与える。
- **生成された TypeScript モデル。** `build/typescript-model/` が `@devfile/api` npm パッケージを生成し、JavaScript / TypeScript ツールが同じスキーマから同じフォーマットを消費できる。
