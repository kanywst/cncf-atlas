# 内部実装

> コミット `8274975` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `main.go` | エントリポイント。`main()` (`main.go:21`) が `cmd.Execute` を呼ぶ。ビルド変数は GoReleaser が埋める (`main.go:14-19`)。 |
| `cmd/` | Cobra コマンドツリー (`scan`、`fix`、`patch`、`download`、`list`、`config`、`diff`)。 |
| `core/core/` | コマンド実装を `Kubescape` のメソッドとして持つ。`scan.go:183` がパイプライン。 |
| `core/pkg/opaprocessor/` | ルール評価: `processorhandler.go`、Cosign 組み込み、CEL ディスパッチ。 |
| `core/pkg/policyhandler/` | ポリシーをセッションに収集 (`handlepullpolicies.go:51`)。 |
| `core/pkg/resourcehandler/` | クラスタ / ファイルからリソース収集 (`handlerpullresources.go:18`)。 |
| `core/cautils/` | 共有型: `OPASessionObj`、`ScanInfo`、ポリシー DL の `getter/`。 |
| `core/meta/` | `IKubescape` インターフェース、CLI と core の境界 (`ksinterface.go:11`)。 |
| `pkg/imagescan/` | 画像脆弱性スキャンの Grype/Syft ラッパー。 |

## 中核データ構造

`OPASessionObj` (`core/cautils/datastructures.go:49`) はスキャン 1 回分の全状態を持つ。`K8SResources` (GVR → resource ID)、`AllResources` (ID → リソース実体)、`ResourcesResult` (ID → 評価結果)、`Policies` (framework 群)、`AllPolicies` (平坦化した control マップ)、v2 の `Report`、`ScanCoverage`、VAP のポリシー / バインディング集合を持つ。`NewOPASessionObj` (`core/cautils/datastructures.go:80`) は `estimateClusterSize` (`core/cautils/datastructures.go:101`) でクラスタ規模を見積もり、map を事前確保する。

`K8SResources` と `ExternalResources` は `map[string][]string` の型エイリアスで、キーは `<api group>/<version>/<resource>` (`core/cautils/datastructures.go:22-24`)。ルールが対象 GVR に該当するリソースだけを引くための索引。

`ScanInfo` (`core/cautils/scaninfo.go:102`) は CLI フラグの集約。出力フォーマット、各 threshold、policy / controls-inputs / exceptions / attack-tracks の getter、scan type、air-gapped フラグ。CLI 層と core 層の受け渡し単位。

`OPAProcessor` (`core/pkg/opaprocessor/processorhandler.go:44`) はセッションを埋め込み、ルールコンパイルのキャッシュ、`ControlTimeout`、timed-out controls 集合、Cosign 組み込みを 1 回だけ登録する `sync.Once` を持つ。

`ImageScanData` (`core/cautils/datastructures.go:26-35`) は Grype/Syft の出力 (`Matches`、`Packages`、`SBOM`、`VulnerabilityProvider`) を束ねる。posture 結果と画像結果が同じ結果ハンドラに同居する。

## 追う価値のあるパス

ルール評価は `ProcessRulesListener` (`core/pkg/opaprocessor/processorhandler.go:83`) を通る。`convertFrameworksToPolicies` で framework を control リストに平坦化し、`Process` を呼び、coverage を再構築してスコアを計算する。

`Process` (`core/pkg/opaprocessor/processorhandler.go:117`) は `policies.Controls` を 1 件ずつループする。`ControlTimeout > 0` のとき各 control を `context.WithTimeout` で囲み、deadline 到達時は `markControlTimedOut` を呼びエラーを消して継続する。スキャン全体は止めない:

```go
if opap.ControlTimeout > 0 {
    cctx, cancel := context.WithTimeout(ctx, opap.ControlTimeout)
    resourcesAssociatedControl, err = opap.processControl(cctx, &control)
    if cctx.Err() == context.DeadlineExceeded && ctx.Err() == nil {
        opap.markControlTimedOut(&control, opap.ControlTimeout)
        err = nil
        resourcesAssociatedControl = nil
    }
    cancel()
}
```

各 control は `processControl` (`core/pkg/opaprocessor/processorhandler.go:200`) から `processRule` (`core/pkg/opaprocessor/processorhandler.go:242`) へ展開する。ルールは `runOPAOnSingleRule` (`core/pkg/opaprocessor/processorhandler.go:494`) で言語ごとに分岐する。Rego は `runRegoOnK8s` (`:497`)、CEL は `runCELOnK8s` (`:499`)。

`runRegoOnK8s` (`core/pkg/opaprocessor/processorhandler.go:512`) は `opaRegisterOnce` で Cosign 組み込みを 1 回だけ登録し、`getCompiledRule` (`:520`) でキャッシュ済みコンパイル結果を取り、`TOStorage()` (`:525`) で control 入力を OPA store にし、`regoEval` (`:530`) を呼ぶ。

`regoEval` (`core/pkg/opaprocessor/processorhandler.go:544`) が leaf。クエリを組んで実行する:

```go
rego := rego.New(
    rego.SetRegoVersion(ast.RegoV0),
    rego.Query("data.armo_builtins"),
    rego.Compiler(compiledRego),
    rego.Input(inputObj),
    rego.Store(*store),
)
resultSet, err := rego.Eval(ctx)
```

result set は `reporthandling.ParseRegoResult` (`core/pkg/opaprocessor/processorhandler.go:560`) でパースする。

## 読んで驚いた点

- エンジンは OPA v1 ライブラリを使いつつ、`rego.SetRegoVersion(ast.RegoV0)` で評価を Rego v0 構文に固定している (`core/pkg/opaprocessor/processorhandler.go:546`)。OPA は v1 構文がデフォルトなので、この 1 行が既存の `regolibrary` ルールをコンパイルし続けさせている。見落とすとルールが壊れる。
- Cosign 署名検証が Rego の組み込み関数として公開されている。`runRegoOnK8s` が `cosign_verify`、`cosign_has_signature`、画像名正規化関数を登録し (`core/pkg/opaprocessor/processorhandler.go:513-517`)、実装は `cosign_verify.go` と `cosign_has_signature.go` にある。ポリシーは「この画像は署名済みか」をポリシー言語の中で問える。
- CEL は配線済みだが未完成。`runCELOnK8s` はスタブで `CEL evaluation not yet implemented` を返し、issue `kubescape/kubescape#2001` を指す (`core/pkg/opaprocessor/processorhandler.go:507-509`)。CEL 環境は `core/pkg/opaprocessor/cel/env.go` にあり、移行は進行中で未出荷。
- timed out した control は fail でも pass でもない。「未評価」として記録され coverage に折り込まれるので、遅いルールはレポートから黙って消えるのではなく coverage の値を下げる (`core/pkg/opaprocessor/processorhandler.go:143-151`、`:98`)。
