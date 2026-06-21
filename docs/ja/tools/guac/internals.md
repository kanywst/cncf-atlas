# 内部実装

> コミット `362e6da` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/` | 5 つの CLI バイナリ: `guacone` (オールインワン)、`guacgql` (GraphQL サーバ)、`guacrest` (REST)、`guaccollect` (収集デーモン)、`guaccsub` (collectsub サーバ) |
| `pkg/handler/collector/` | ドキュメント収集 (file、gcs、s3、oci、git、github、deps_dev、kubescape、blob) |
| `pkg/handler/processor/` | 生ドキュメントの型/フォーマット推定・検証・分解 |
| `pkg/ingestor/parser/` | ドキュメントツリーを型付き証拠 predicate にパース |
| `pkg/ingestor/verifier/` | 署名/identity 検証。取り込みとは分離 |
| `pkg/assembler/` | predicate 型と GraphQL バルク投入クライアント |
| `pkg/assembler/backends/` | 1 つの `Backend` インターフェース背後の差し替え可能なグラフストア |

## 中核データ構造

`processor.Document` (`pkg/handler/processor/processor.go:35`) は生バイト `Blob` に加え `Type`・`Format`・`Encoding`・`SourceInformation` を持つ。入れ子 (attestation を包む DSSE envelope、SBOM の tarball) は `DocumentTree`/`DocumentNode` (`pkg/handler/processor/processor.go:47`, `pkg/handler/processor/processor.go:50`) で表され、processor が分解中に構築する再帰ツリーである。

`assembler.IngestPredicates` (`pkg/assembler/assembler.go:31`) はパーサが生成する証拠の束で、`IsDependency`・`CertifyVuln`・`HasSBOM` などのフィールドを持つ (`pkg/assembler/assembler.go:33`, `pkg/assembler/assembler.go:36`, `pkg/assembler/assembler.go:41`)。鍵となる不変条件はコメントにある: この struct は証拠ツリーのみを持つ。software tree (パッケージ・ソース・アーティファクト) の取り込みは暗黙で client library が処理するからである (`pkg/assembler/assembler.go:28`)。

`backends.Backend` (`pkg/assembler/backends/backends.go:27`) は全グラフストアが実装する契約で、トポロジ操作 `Neighbors` (`pkg/assembler/backends/backends.go:135`)、`Path` (`pkg/assembler/backends/backends.go:139`)、検索 `FindSoftware` (`pkg/assembler/backends/backends.go:148`) を含む。

`verifier.Identity` (`pkg/ingestor/verifier/verifier.go:50`) は `Verified` (`pkg/ingestor/verifier/verifier.go:53`) を持つ。その doc コメントは、これを identity が信頼されていることと読むべきではないと明記する (`pkg/ingestor/verifier/verifier.go:46`)。

## 追う価値のあるパス

1 ドキュメントを `processDocument` (`pkg/handler/processor/process/process.go:197`) で追う。各段階は順に実行される:

```text
decodeDocument    -> 生 blob を解凍 (bzip2/zstd)
preProcessDocument-> guesser.GuessDocument が Type と Format を設定
validateFormat    -> JSON / JSONLines / XML の整形性チェック
validateDocument  -> 型ごとの ValidateSchema
unpackDocument    -> DSSE/tarball を子ドキュメントに分解
```

`preProcessDocument` は型推定を guesser に委譲する (`pkg/handler/processor/process/process.go:223`)。`validateFormat` はスキーマ処理の前に不正な JSON・JSON Lines・XML を弾く (`pkg/handler/processor/process/process.go:235`)。`unpackDocument` は子ドキュメントを返し、`processHelper` がそれらへ再帰する (`pkg/handler/processor/process/process.go:269`, `pkg/handler/processor/process/process.go:176`)。どの processor がどの型を扱うかは `init()` で populate されるレジストリで決まる (`pkg/handler/processor/process/process.go:57`)。

パーサ側はこの再帰が無限ループになるのを防ぐ。`ParseDocumentTree` (`pkg/ingestor/parser/parser.go:84`) は `docTreeBuilder.parse` (`pkg/ingestor/parser/parser.go:210`) を `map[visitedKey]bool` 付きで呼ぶ。`visitedKey` は `{Type, Format, SourceInformation}` の struct である (`pkg/ingestor/parser/parser.go:203`, `pkg/ingestor/parser/parser.go:216`)。スライスは map のキーにできないため、あえて struct キーにしている。

## 読んで驚いた点

processor は取り込み成功後にだけ pub/sub メッセージを ack する (`pkg/handler/processor/process/process.go:138`)。したがってシステムは at-least-once であり、ワーカーが途中で死ぬとドキュメントが再処理されうる。取り込みはこれに耐える必要がある。

検証は取り込みから切り離されており、コードは「verified」が「trusted」ではないと率直に述べる (`pkg/ingestor/verifier/verifier.go:46`)。DSSE processor は署名済み payload を署名チェックなしで分解する (`pkg/handler/processor/dsse/dsse.go:55`)。信頼は取り込みパスではなくクエリ/ポリシー層が決める。

`MergedIngest` では predicate がバッチでバックエンドに flush される。累積件数が 5000 に達すると assembler が呼ばれ、バッファがリセットされる (`pkg/ingestor/ingestor.go:137`)。バルク投入はオプトインの最適化ではなくデフォルトである。
