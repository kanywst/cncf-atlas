# 内部実装

> コミット `56aace77` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/crossplane/main.go` | エントリポイントと kong CLI。`main()` は `cmd/crossplane/main.go:87` |
| `cmd/crossplane/core/core.go` | コントローラを組み立てる。`(*startCommand).Run` は `cmd/crossplane/core/core.go:164` |
| `internal/controller/apiextensions/composite/` | XR reconciler と function composer |
| `internal/controller/pkg/` | Provider・Configuration・Function パッケージの package manager |
| `internal/controller/ops/` | Operations (v2): pipeline を Job のように一回完走させる |
| `internal/dag/` | パッケージ依存解決の DAG (`internal/dag/dag.go:17`) |
| `internal/engine/` | 動的なコントローラのライフサイクル (`internal/engine/engine.go:17`) |
| `apis/apiextensions/` | XRD・Composition・CompositionRevision の API 型 |
| `proto/fn/v1/run_function.proto` | Crossplane と function の gRPC 契約 |

## 中核データ構造

- **`PipelineStep`** (`apis/apiextensions/v1/composition_common.go:59`): function pipeline の 1 ステップ。`Step` 名、`FunctionRef`、任意の `Input`、`Credentials`、`Requirements` を持つ。Composition は `Pipeline []PipelineStep` を保持する (`apis/apiextensions/v1/composition_types.go:54`)。
- **`CompositeResourceDefinition`** (XRD) (`apis/apiextensions/v2/xrd_types.go:269`、Spec は `apis/apiextensions/v2/xrd_types.go:40`): 新しい XR 型を定義する。v2 で `Scope` (`apis/apiextensions/v2/xrd_types.go:60`、Namespaced か Cluster) を追加し、claim 名を deprecated とした (`apis/apiextensions/v2/xrd_types.go:114`)。
- **`CompositionRevision`** (`apis/apiextensions/v1/composition_revision_types.go:102`): Composition の immutable なスナップショット。XR は revision に固定してロールアウトを制御できる。
- **`RunFunctionRequest` / `State` / `Resource`** (`proto/fn/v1/run_function.proto:39`、`:281`、`:292`): protobuf 契約。`State` は XR (`composite`) と composed 用の `map<string, Resource> resources` を持つ。function は完全な desired state を返す。
- **`FunctionComposer`** (`internal/controller/apiextensions/composite/composition_functions.go:130`): pipeline 実行器。observe・pipeline 実行・garbage collect を orchestration する。

## 追う価値のあるパス

XR の reconcile を function pipeline まで追う。reconciler は Composition と CompositionRevision を解決してから `Compose` を呼ぶ (`internal/controller/apiextensions/composite/reconciler.go:745`)。composer は `(*FunctionComposer).Compose` (`composition_functions.go:288`):

```text
composition_functions.go:296  ObserveComposedResources   既存の composed を観測
composition_functions.go:307  FetchConnection            XR の connection details を取得
composition_functions.go:312  AsState                    observed state を protobuf へ符号化
composition_functions.go:323  desired は空の State から開始
composition_functions.go:344  Revision.Spec.Pipeline の各ステップでループ
composition_functions.go:347    fn.Input を structpb へ unmarshal
composition_functions.go:356    Credentials を Secret から注入
composition_functions.go:378    bootstrap の Requirements を事前取得
composition_functions.go:405    rsp = c.pipeline.RunFunction(...)   gRPC 呼び出し
composition_functions.go:418    desired を次ステップへ引き継ぐ
composition_functions.go:450    FATAL の結果は PipelineFatalError で中断
composition_functions.go:484  各 desired リソースから composed リソースを構築
composition_functions.go:528    RenderComposedResourceMetadata      XR 由来の metadata を付与
```

`FunctionRunner` インターフェースは `composition_functions.go:149`。その `RunFunction` メソッドを gRPC クライアントが実装する。各 function は observed と desired state を受け取り、新しい desired state を返し、それを次の function が見る。

## 読んで驚いた点

- **function は差分ではなく完全な desired state を返す。** `proto/fn/v1/run_function.proto:135` の `desired` フィールドのコメントは、以前 desired として返したフィールドを省くとクラスタ上のオブジェクトから削除されると述べている。あるフィールドを再度出力し忘れた function はそれを落としてしまうので、各ステップは保持したいものすべてを再生成しなければならない。
- **pipeline TTL は function が返す最小の非ゼロ値である** (`composition_functions.go:413`)。短命な function が 1 つあると、その pipeline 実行全体のキャッシュ寿命が縮む。
- **削除は pipeline をスキップする。** XR が削除中のとき、reconciler は finalizer を除去して早期 return するので (`reconciler.go:618`)、削除パスで function は走らない。composed リソースのクリーンアップは function ロジックではなく owner reference と garbage collector に依存する。
