# 内部実装

> コミット `42c26e7` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/cortex/main.go` | バイナリのエントリポイント。 |
| `pkg/cortex/cortex.go` | トップレベル設定とサービス組み立て (`-target`、auth デフォルト)。 |
| `pkg/cortex/modules.go` | モジュール名の宣言と配線 (`:74-106`)。 |
| `pkg/api/api.go` | HTTP ルート登録。`POST /api/v1/push` を含む (`:296`)。 |
| `pkg/util/push/push.go` | remote-write デコードハンドラ (`:49`)。 |
| `pkg/distributor/distributor.go` | write path の検証・シャーディング・分配。 |
| `pkg/ring/` | ハッシュリングのメンバシップ、トークン所有、バッチ分配。 |
| `pkg/ingester/ingester.go` | テナントごとの TSDB head への append・flush・ship。 |
| `pkg/cortexpb/` | remote-write protobuf のワイヤ型とプーリング。 |

## 中核データ構造

- `cortexpb.WriteRequest` (`pkg/cortexpb/cortex.pb.go:189`): remote-write のワイヤメッセージ。`Timeseries []PreallocTimeseries` とメタデータ・ソースを持つ。
- `cortexpb.PreallocTimeseries` (`pkg/cortexpb/timeseries.go:78`): `*TimeSeries` を埋め込み、`Unmarshal` 時に `TimeseriesFromPool()` (`pkg/cortexpb/timeseries.go:83`) で `sync.Pool` から backing slice を確保し GC 圧を下げる。
- `ring.Desc` と `ring.InstanceDesc` (`pkg/ring/ring.pb.go:65`, `:108`): リング全体は `map[string]InstanceDesc`。各 instance は `Addr`・heartbeat の `Timestamp`・`State`・`Tokens`・`Zone` を持つ。トークンが instance の所有するハッシュ範囲を決める。
- `ingester.userTSDB` (`pkg/ingester/ingester.go:376`): テナントごとの `*tsdb.DB` ラッパ。active series・limiter・state・inflight push/read の WaitGroup・Thanos shipper を追跡する。flush・idle 検出・削除の単位。
- `distributor.Distributor` (`pkg/distributor/distributor.go:85`): リング参照・レートリミッタ・HA tracker・メトリクスを束ねるステートレスな write サービス。

## 追う価値のあるパス

remote write を端から端まで追う。`(*Distributor).Push` (`pkg/distributor/distributor.go:747`) は冒頭で、検証エラー経路でプール済み slice を返す defer を仕込む。

```go
func (d *Distributor) Push(ctx context.Context, req *cortexpb.WriteRequest) (*cortexpb.WriteResponse, error) {
    var validationError = true
    defer func() {
        if validationError {
            cortexpb.ReuseSlice(req.Timeseries)
            req.Free()
        }
    }()
```

検証・シャーディング・レートチェックの後、分配は `doBatch` (`pkg/distributor/distributor.go:980`) を経由し、これが `ring.DoBatch` (`pkg/ring/batch.go:74`) を呼ぶ。各 key でリングがレプリケーションセットを解決し (`pkg/ring/batch.go:93`)、`record` (`pkg/ring/batch.go:151`) が instance ごとの結果を分類して quorum を判定する。所有する ingester は `(*Ingester).Push` (`pkg/ingester/ingester.go:1324`) を実行し、テナントごとの TSDB head に append する。

## 読んで驚いた点

ホットな write path は aggressive なオブジェクト再利用と `unsafe` ゼロコピーデシリアライズの上に作られている。distributor と ingester はどちらも、defer された `req.Free()` と `cortexpb.ReuseSlice(req.Timeseries)` でプール済み timeseries slice を返す (`pkg/distributor/distributor.go:749-754`, `pkg/ingester/ingester.go:1352-1355`)。ingester はそれに伴う制約を明記する。

```go
// NOTE: because we use `unsafe` in deserialisation, we must not
// retain anything from `req` past the call to ReuseSlice
defer req.Free()
defer cortexpb.ReuseSlice(req.Timeseries)
```

label は元バッファへの `unsafe` 参照なので、プール返却後に `req` から何も保持してはならない。これが高カーディナリティ・高スループットな取り込みで GC 圧を抑えるための意図的な割り切り。

2 つ目の驚きは `doBatch` (`pkg/distributor/distributor.go:984`)。ingester 送信は呼び出し元の context ではなく `RemoteTimeout` 付きの新しい background context で走る。クライアントが早期に切断・タイムアウトしても進行中バッチは中断されず、元のリクエストが消えてもレプリケーション quorum は保たれる。
