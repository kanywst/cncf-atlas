# 内部実装

> コミット `f75131f` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

実装は `v1/` 配下にある。ルートのパッケージは薄い shim (最終節を参照)。

| パス | 責務 |
| --- | --- |
| `cmd/` | cobra ルートに載る CLI サブコマンド (`cmd/commands.go:14`)。 |
| `v1/ast/` | Rego のパーサ・コンパイラ・型チェッカと AST 型。 |
| `v1/topdown/` | top-down 評価エンジン、単一化、組み込み関数。 |
| `v1/rego/` | 高レベルのコンパイル〜評価 API (`rego.New().Eval()`)。 |
| `v1/server/` | `/v1/data/<path>` を提供する REST PDP。 |
| `v1/storage/` | base document に対する `Store` 抽象。 |
| `v1/bundle/` | bundle の読込・署名・検証。 |
| `v1/sdk/`, `v1/plugins/` | 埋め込み SDK と decision-log / bundle / status プラグイン。 |

## 中核データ構造

- `Term` は AST の最小単位。`v1/ast/term.go:315` の `type Term struct` で、`Value` と `*Location` を持つ。
- `Value` は全 AST 値が実装するインターフェース (`v1/ast/term.go:61`)。`Compare`・`Find`・`Hash`・`IsGround`・`String` を要求する。具体値は `Var` (`v1/ast/term.go:1148`)・`Ref` (`v1/ast/term.go:1215`)・`Object` (`v1/ast/term.go:2130`) など。
- `Module`・`Rule`・`Head`・`Body` がポリシーの構造 (`v1/ast/policy.go:193`、`:227`、`:245`、`:263`)。`Module` は package・imports・rules・annotations を持ち、`Rule` は default フラグ・head・body・else を持つ。
- `bindings` は評価中の変数束縛を保持する (`v1/topdown/bindings.go:32`)。少数なら配列、しきい値を超えると map に切り替える adaptive 表現。
- `Store` は base document に対する txn 付き read/write の境界 (`v1/storage/interface.go:20`)。外部データをポリシー評価から分離する。

## 追う価値のあるパス

Rego ポリシーを 1 回評価する際のホップは次の通り。

1. `rego.New(opts...)` (`v1/rego/rego.go:1414`) が query・modules・store・input のオプションから評価器を組む。
2. `(*Rego).Eval` (`v1/rego/rego.go:1502`) が txn を開き、クエリを準備する。

   ```go
   pq, err := r.PrepareForEval(ctx)
   // ...
   rs, err := pq.Eval(ctx, evalArgs...)
   ```

3. `PrepareForEval` (`v1/rego/rego.go:1788`) が Rego を一度だけパース・コンパイルし、`compiledQueries[evalQueryType]` にキャッシュする。再評価ではコンパイル済みの形を使い回す。
4. `PreparedEvalQuery.Eval` (`v1/rego/rego.go:559`) がコンパイル済みクエリを eval context にセットし、エンジンへ委譲する。

   ```go
   ectx.compiledQuery = pq.r.compiledQueries[evalQueryType]
   return pq.r.eval(ctx, ectx)
   ```

5. `(*Rego).eval` (`v1/rego/rego.go:2309`) が target (rego / wasm / plugin) で分岐する。既定の rego target では `topdown.NewQuery(...)` を組み、compiler・store・txn・組み込み・cache を注入する。
6. `(*Query).Iter` (`v1/topdown/query.go:565`) が `eval` 構造体を初期化し、`(*eval).eval` (`v1/topdown/eval.go:404`) のループを回す。ループは `evalExpr` (`v1/topdown/eval.go:408`) と `evalStep` (`v1/topdown/eval.go:461`) を駆動し、全 expr を消化すると解を yield する。
7. 変数束縛は `(*eval).biunify` (`v1/topdown/eval.go:1134`)、双方向単一化のステップで解決される。

## 読んで驚いた点

`evalStep` (`v1/topdown/eval.go:461`) は、ほぼ同一の分岐を 2 本持つ。trace 有効時用と無効時用である。コメントがこの重複の意図を説明している。

```text
// NOTE(æ): the reason why there's one branch for the tracing case and one almost
// identical branch below for when tracing is disabled is that the tracing case
// allocates wildly. These allocations are cause by the "defined" boolean variable
// escaping to the heap as its value is set from inside of closures.
```

trace 無効の共通パスは alloc ゼロに保たれる。分けないと `defined` という bool がクロージャ内から heap に escape し、一部のワークロードで数百万回の alloc を生んでしまう。

もう 1 つの驚きは構造的なものだ。リポジトリのルートで import するパッケージ、例えば `rego/rego.go` にはロジックが一切ない。それらは `v1/*` への型エイリアス (例: `type Rego = v1.Rego`) である。エンジン全体が 1.0 の既定言語切り替えのために `v1/` へ移り、ルートのパッケージは旧 import path を生かすためだけに存在する。
