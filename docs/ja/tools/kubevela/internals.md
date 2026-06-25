# 内部実装

> コミット `a10dba6` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `src/apis/core.oam.dev/` | OAM の API 型: `Application` / `ApplicationComponent` / `ResourceTracker` |
| `src/cmd/core/main.go` | controller-manager のエントリポイント (`:25`) |
| `src/pkg/controller/core.oam.dev/v1beta1/application/` | `Application` reconciler とステップ生成 |
| `src/pkg/appfile/` | `Application` を `Appfile` 形式にパースし、コンポーネントを CUE からレンダリング |
| `src/pkg/resourcekeeper/` | レンダリング済みリソースの dispatch と GC |
| `src/pkg/multicluster/` | クラスタまたぎ配信 |

## 中核データ構造

- **`Application`** (`src/apis/core.oam.dev/v1beta1/application_types.go:81`): ユーザ向けの唯一の入力 CR。storage version 指定あり。spec は `Components` / `Policies` / `Workflow` を持つ (`:51-65`)。
- **`ApplicationComponent`** (`src/apis/core.oam.dev/common/types.go:351`): OAM の合成単位。`Name` / `Type` / `Properties` (`RawExtension`) / `DependsOn` / `Inputs` / `Outputs` / `Traits` を持つ。
- **`Appfile`** (`src/pkg/appfile/appfile.go:160`): reconcile 中の中間表現。`ParsedComponents` / `ParsedPolicies` / 解決済みの関連定義群 / レンダリング結果を束ねる。
- **`ComponentManifest`** (`src/apis/types/componentmanifest.go:24`): 1 コンポーネントのレンダリング結果。workload とその trait を unstructured で持つ。
- **`ResourceTracker`** (`src/apis/core.oam.dev/v1beta1/resourcetracker_types.go:51`): 適用済みリソースの台帳。`Type` は `root` / `versioned` / `component-revision` (`:61-68`) で、type が GC 寿命を決める。

## 追う価値のあるパス

1 コンポーネントを CUE 定義から実 Kubernetes オブジェクトへレンダリングする処理がシステムの核心だ。入口は `Appfile.GenerateComponentManifest` (`src/pkg/appfile/appfile.go:332`)。category で分岐し、Terraform コンポーネントは Terraform module へ、それ以外は `generateComponentFromCUEModule` へ進む (`:346`)。

CUE パスは `baseGenerateComponent` (`src/pkg/appfile/appfile.go:553`) に入る。各 trait に対し `EvalContext(pCtx)` を呼ぶ (`:556-560`)。コンポーネントが patch を持つ場合、patch は CUE 単一化で workload にマージされる:

```go
if p := patcher.LookupPath(cue.ParsePath("workload")); p.Exists() {
    if err := workload.Unify(p); err != nil {
        return nil, errors.WithMessage(err, "patch workload")
    }
}
```

このスニペットは `src/pkg/appfile/appfile.go:563-566`。trait も同じく単一化される (`:570`)。最後に CUE 値を Kubernetes オブジェクトへ変換する: `base.Unstructured()` (`src/pkg/appfile/appfile.go:599`)。この変換が失敗すると、エラーは返す前に `FormatCUEError` を通る (`:604`)。

reconcile からクラスタまでの呼び出しチェーン全体:

```text
Reconcile (application_controller.go:109)
  -> GenerateAppFile (parser.go:87)
  -> GenerateApplicationSteps (application_controller.go:222)
  -> ExecuteRunners (application_controller.go:236)
       -> resourceKeeper.Dispatch (generator.go:104 -> dispatch.go:61)
```

## 読んで驚いた点

抽象層はコードではなくデータだ。trait と workload の合成は CUE の `Unify` 呼び出し (`src/pkg/appfile/appfile.go:564`) なので、コンポーネント型・トレイト型の追加は Go の変更ではなく CUE 定義の追加になる。トレードオフはエラー処理にすぐ現れる: 失敗が生の CUE 評価エラーとして出るため、それを読めるようにする専用フォーマッタ `FormatCUEError` を持つ (`:604`)。

`ResourceTracker` 台帳には非自明な保存トリックがある。`ResourceTrackerSpec.MarshalJSON` がオーバーライドされていて、圧縮が有効なときは `ManagedResources` を null にして圧縮フィールドへエンコードする (`src/apis/core.oam.dev/v1beta1/resourcetracker_types.go:86-103`)。コード内のコメントも、これが標準の JSON marshal ではなくフレームワークの圧縮ヘルパの再利用だと明記している。これで多数の適用済みリソースを列挙しても tracker CR を小さく保てる。
