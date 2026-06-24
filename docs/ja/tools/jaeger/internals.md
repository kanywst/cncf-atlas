# 内部実装

> コミット `d5e2ccd` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/jaeger/main.go` | プロセスのエントリポイント。サブコマンドと設定フラグを配線する。 |
| `cmd/jaeger/internal/command.go` | Collector コマンドを構築し、デフォルトの all-in-one 設定を注入する。 |
| `cmd/jaeger/internal/components.go` | 全 receiver / processor / exporter / extension を登録する。 |
| `cmd/jaeger/internal/exporters/storageexporter/` | スパンを Jaeger ストレージバックエンドに書き込む exporter。 |
| `internal/storage/v2/api/tracestore/` | v2 ストレージ抽象。`Writer` と `Reader` インターフェース。 |
| `internal/storage/v2/memory/` | インメモリのトレースストア実装。 |
| `internal/jptrace/sanitizer/` | 書き込み前に適用するスパンサニタイザ。 |

## 中核データ構造

システム全体は OTLP `ptrace.Traces` (OpenTelemetry pdata) を中心に回る。v2 でのネイティブなインメモリ表現であり、receiver / processor / exporter / storage がすべてこれを受け渡す。旧来の Jaeger 固有 `model.Span` は段階的に縮退中である。

ストレージ契約は 2 つのインターフェースだ。`Writer` はメソッド 1 つを持つ (`internal/storage/v2/api/tracestore/writer.go:13`):

```go
type Writer interface {
    // WriteTraces writes a batch of spans to storage. Idempotent.
    WriteTraces(ctx context.Context, td ptrace.Traces) error
}
```

`Reader` (`internal/storage/v2/api/tracestore/reader.go:16`) はスライスではなく Go 1.23 のイテレータを返すため、大きな結果セットがストリームされる:

```go
GetTraces(ctx context.Context, traceIDs ...GetTraceParams) iter.Seq2[[]ptrace.Traces, error]
FindTraces(ctx context.Context, query TraceQueryParams) iter.Seq2[[]ptrace.Traces, error]
```

exporter 自体は小さい (`cmd/jaeger/internal/exporters/storageexporter/exporter.go:19`)。`config`、`traceWriter tracestore.Writer`、`logger`、`sanitizer.Func` を持つ。インメモリバックエンドのテナント単位の状態は固定長リングバッファである (`internal/storage/v2/memory/tenant.go:24`)。`ids map[pcommon.TraceID]int` のインデックス、`traces []traceAndId` のリング、`MaxTraces` でサイズが決まる `mostRecent int` カーソルからなる。

## 追う価値のあるパス

1 つの OTLP バッチをストレージへ書く流れは exporter ファクトリから始まる。ファクトリは traces exporter を `StabilityLevelDevelopment` で登録する (`cmd/jaeger/internal/exporters/storageexporter/factory.go:27`)。`createTracesExporter` (`:39`) は `ex.pushTraces` を `exporterhelper.NewTraces` でラップし、呼び出し単位タイムアウトを無効化して retry と queue の挙動を付ける (`:47`)。

起動時、`start()` が `jaeger_storage` extension からバックエンドを解決し writer を保持する (`cmd/jaeger/internal/exporters/storageexporter/exporter.go:34`):

```go
f, err := jaegerstorage.GetTraceStoreFactory(exp.config.TraceStorage, host)
...
if exp.traceWriter, err = f.CreateTraceWriter(); err != nil {
    return fmt.Errorf("cannot create trace writer: %w", err)
}
```

各バッチは `pushTraces` を流れる (`cmd/jaeger/internal/exporters/storageexporter/exporter.go:52`):

```go
func (exp *storageExporter) pushTraces(ctx context.Context, td ptrace.Traces) error {
    return exp.traceWriter.WriteTraces(ctx, exp.sanitizer(td))
}
```

サニタイザは `NewStandardSanitizers` で組み立てられるチェーンである (`internal/jptrace/sanitizer/sanitizer.go:18`)。空サービス名 → 空スパン名 → UTF-8 → 負の duration の順だ。インメモリバックエンドでは `WriteTraces` (`internal/storage/v2/memory/memory.go:65`) が `reshuffleResourceSpans` (`:161`) でスパンを traceID ごとにグルーピングし、`tenancy.GetTenant(ctx)` でテナントを引き、リングバッファに格納する。

## 読んで驚いた点

「設定ファイル無し」の体験は Collector の機能ではなく意図的な回避策だ。`Command()` は cobra の `RunE` を差し替え、`--config` が指定されたかをチェックし、無ければ埋め込みの `all-in-one.yaml` を `yaml:` プロバイダ URI として注入する (`cmd/jaeger/internal/command.go:68`)。ソースのコメントはこのための公式 OTel フックが無いと述べている。

ストレージ exporter はいまだ `StabilityLevelDevelopment` であり (`cmd/jaeger/internal/exporters/storageexporter/factory.go:27`)、レジストリでは v1 の `spanstore.SpanWriter` への橋渡しと記されている (`cmd/jaeger/internal/components.go:116`)。v2 は出荷されているが、その書き込みパスは内部でまだ v1 ストレージ配管に頼っている。

インメモリストアは固定長リングバッファである (`internal/storage/v2/memory/tenant.go:24`)。`MaxTraces` に達すると最古のトレースが追い出され、その id がインデックスから削除される。デモやテストには十分だが、古いデータを黙って捨てる。本番デプロイが永続バックエンドを指す理由はここにある。
