# 内部実装

> コミット `368ea4e` (`devfile/api`、タグ `v2.3.0` 近傍) のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `pkg/apis/workspaces/v1alpha2/` | 手書きの API 型と生成された `zz_generated.*.go`。フォーマットの単一の真実 |
| `pkg/apis/workspaces/v1alpha1/` | 旧 API バージョン。手書きの `*_conversion.go` が `v1alpha2` へ写像する |
| `generator/` | 独立した Go モジュール。overrides・crds・schemas・deepcopy・getters・interfaces・validation の独自 controller-tools ジェネレータ |
| `pkg/utils/overriding/` | 親と plugin の override を適用し、平坦化された内容をマージする |
| `pkg/utils/unions/` | discriminated union をツリー全体で正規化・単純化する |
| `pkg/validation/` | devfile の内部参照と id 重複の意味検証 |
| `pkg/attributes/` | 自由形式の `Attributes` マップと、その上の型付き getter |
| `schemas/`, `crds/`, `samples/` | 生成された JSON スキーマ・CRD YAML・サンプル devfile |

## 中核データ構造

- `DevWorkspaceTemplateSpecContent` (`devworkspacetemplate_spec.go:31`) は devfile 本体である。`Variables`・`Attributes`・`Components`・`Projects`・`StarterProjects`・`DependentProjects`・`Commands`・`Events` を持つ (`devworkspacetemplate_spec.go:31-107`)。各リストフィールドは生成とマージの双方を駆動する marker を帯びる。`+devfile:toplevellist` はマージ対象を示し、`+patchMergeKey=name` または `+patchMergeKey=id` が strategic merge のキーを与え、`+devfile:overrides:include:...` が parent / plugin の override 型に現れるかを決める。
- `Component` と `ComponentUnion` (`components.go:45`、`components.go:61`) は discriminated union を成す。`Component` は `Name` を持ち `ComponentUnion` をインライン化し、その `ComponentType` フィールドが `Container`・`Kubernetes`・`Openshift`・`Volume`・`Image`・`Plugin`・`Custom` を分ける discriminator になる。
- `Union` (`union.go:24-36`) はすべての union 型が実装するインターフェースである。private な `discriminator()`・`Normalize()`・`Simplify()` を持つ。コメントは設計を Kubernetes の union-types KEP に紐づけている (`union.go:22-23`)。
- `Attributes` (`attributes.go:30`) は `map[string]apiext.JSON` で、自由形式 YAML マップである。CRD 側ではフィールドが `+kubebuilder:pruning:PreserveUnknownFields` と `Schemaless` を帯び、任意の内容を保持する (`devworkspacetemplate_spec.go:52-55`)。型付き getter (`GetString`・`GetNumber`・`GetBoolean`) が error holder 付きで値を取り出す (`attributes.go:99`、`attributes.go:126`、`attributes.go:163`)。

## 追う価値のあるパス

ある devfile の override を別の devfile に適用する処理。`pkg/utils/overriding/overriding.go` にある。`OverrideDevWorkspaceTemplateSpec` が本体で、マージ自体を委譲するため短い。

```text
OverrideDevWorkspaceTemplateSpec(original, patch)   overriding.go:75
  ensureOnlyExistingElementsAreOverridden(...)      overriding.go:76  (定義 :133)
  unions.Normalize(&original) / Normalize(&patch)   overriding.go:80 / :83
  json.Marshal(original) -> originalMap             overriding.go:92
  json.Marshal(patch)    -> patchMap                overriding.go:101
  strategicpatch.NewPatchMetaFromStruct(original)   overriding.go:106
  strategicpatch.StrategicMergeMapPatchUsingLookupPatchMeta(...)  overriding.go:111
  json.Unmarshal(patchedBytes, &patched)            overriding.go:122
  unions.Simplify(&patched)                         overriding.go:127
```

マージ前の 2 つのチェックが唯一の独自ロジックである。`ensureOnlyExistingElementsAreOverridden` は override を歩き、基底が持たない要素を名指ししていればエラーにする。override は既存項目を編集するもので、新規追加はしない (`overriding.go:76`、`overriding.go:133`)。`unions.Normalize` は各 union の discriminator を確定させ、半端に指定された union が曖昧なままマージに入らないようにする (`overriding.go:80`、`overriding.go:83`)。その後、基底と patch を JSON にマーシャルし、`NewPatchMetaFromStruct` が struct タグから patch メタを読み、`StrategicMergeMapPatchUsingLookupPatchMeta` が Kubernetes 自身の strategic merge patch で実際のマージを行う (`overriding.go:106`、`overriding.go:111`)。結果を戻し、`Simplify` が discriminator を剥がす (`overriding.go:127`)。

複数の平坦化内容のマージは隣の `MergeDevWorkspaceTemplateSpec` (`merging.go:40`) である。`GetToplevelLists` でトップレベルリストのフィールド名を読み、reflection で各リストを全内容にわたって 1 つの結果へ連結する (`merging.go:76-108`)。main 内容の `plugin` component に到達するとそれをスキップする。plugin は既に平坦化された形で渡り、別途マージされるためである (`merging.go:100-106`)。

## 読んで驚いた点

- **パーサはここにない。** `devfile/api` は型と、override・merge・union・validation のヘルパを与えるが、`devfile.yaml` を読み `parent` を解決しレジストリから取得する処理は `devfile/library` にある。README がフォーマットをリポジトリ全体の話であるかのように語るため、この境界は見落としやすい。
- **override マージは Kubernetes strategic merge patch そのものである。** ライブラリは JSON にマーシャルして `StrategicMergeMapPatchUsingLookupPatchMeta` を呼ぶ (`overriding.go:111`)。merge キーと strategy はマージコードに埋め込まれておらず、ジェネレータも使う同じ `+patchMergeKey` と `+patchStrategy` の struct タグから実行時に読まれる。タグを変えれば生成とマージが同時に変わる。
- **getter は nil とデフォルトの区別を保つために存在する。** optional な bool フィールドに対し、`getters` ジェネレータは `+devfile:default:value` marker で宣言したデフォルトを返す `GetXxx()` を吐く (`component_container.go:104`、`commands.go:55`)。例えば `GetDedicatedPod` (`zz_generated.getters.go:19`) と `GetAutoBuild` (`zz_generated.getters.go:24`) である。格納フィールドはポインタのままなので未設定と false を区別でき、呼び出し側にはデフォルト適用済みの値が渡る。
- **`v1alpha1` はまだ出荷される。** 手書きの変換コードが旧バージョンを `v1alpha2` へ写像し、その結果 CRD は複数の格納バージョンを帯びる。単一の真実という話はおおむね正しいが、変換層はそれに対する手書きの例外である。
