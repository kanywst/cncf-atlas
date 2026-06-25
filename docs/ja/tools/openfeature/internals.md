# 内部実装

> コミット `80b9e95` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `flagd/main.go` | バイナリのエントリ。`cmd.Execute` を呼ぶ (`flagd/main.go:11`) |
| `flagd/cmd/start.go` | cobra の `start` サブコマンドと起動フラグ |
| `flagd/pkg/runtime/from_config.go` | 起動設定から telemetry / store / evaluator / service を配線 (`from_config.go:55`) |
| `flagd/pkg/service/flag-evaluation/` | gRPC/OFREP service、プロトコル多重化、共通 resolver |
| `core/pkg/evaluator/json.go` | JSON/JSONLogic の flag evaluator |
| `core/pkg/store/store.go` | `hashicorp/go-memdb` 基盤のインメモリ flag store |
| `core/pkg/sync/isync.go` | `ISync` 契約と `DataSync` / `SourceConfig` 型 |
| `core/pkg/sync/builder/syncbuilder.go` | provider/scheme で sync 実装を選ぶ |
| `core/pkg/model/flag.go` | `Flag` 型 |

## 中核データ構造

- `model.Flag` (`core/pkg/model/flag.go:10-20`): key / state / defaultVariant / variants マップ / targeting (`json.RawMessage`) / source / metadata。`FlagSetId` と `Priority` は `json:"-"` タグで serialize されず、索引専用に存在する (`flag.go:12-13`)。
- `sync.DataSync` (`core/pkg/sync/isync.go:29-41`): sync 実装が runtime に送る契約。`FlagData` (生の設定文字列) / `Source` / `Selector` と、実験的な `IncrementalUpdates` フラグを運ぶ。
- `sync.SourceConfig` (`core/pkg/sync/isync.go:43-70`): ソースごとの設定 (uri / provider / tls / selector / interval / headers / oauth)。
- `store.Store` (`core/pkg/store/store.go:33-39`): `*memdb.MemDB` と順序付き `sources` スライスを包む。スキーマは 7 本の index を定義し (`store.go:47-118`)、source スライスの順序が key 衝突を解決する priority になる。
- 理由コード (`core/pkg/model/reason.go`): `TARGETING_MATCH` / `STATIC` / `DEFAULT` / `DISABLED` / `ERROR` と、内部用の `FALLBACK` (API では `DEFAULT` に翻訳)。

## 追う価値のあるパス

boolean 解決をワイヤからストアまで追う。

`FlagEvaluationService.ResolveBoolean` は selector ヘッダを読み、selector とプロトコルバージョンを ctx に載せ、共通の `resolve` を呼ぶ (`flagd/pkg/service/flag-evaluation/flag_evaluator_v1.go:214-231`):

```go
selectorExpression := req.Header().Get(flagdService.FLAGD_SELECTOR_HEADER)
selector := store.NewSelector(selectorExpression)
ctx = context.WithValue(ctx, store.SelectorContextKey{}, selector)
ctx = context.WithValue(ctx, evaluator.ProtoVersionKey, "v1")
```

共通の `resolve[T]` がコンテキストを統合し、resolver を呼び、エラーを整形する (`flag_evaluator.go:349-384`)。評価本体 `evaluateVariant` はストアから flag を取り出し、無効な flag では早期に抜ける (`core/pkg/evaluator/json.go:335-352`):

```go
flag, metadata, err := je.store.Get(ctx, flagKey, &selector)
if err != nil {
    return "", map[string]interface{}{}, model.ErrorReason, metadata, errors.New(model.FlagNotFoundErrorCode)
}
...
if flag.State == Disabled {
    return "", nil, model.DisabledReason, metadata, nil
}
```

targeting があれば、flagd は `$flagd` プロパティ (flag key と timestamp) をコンテキストに注入し、marshal して JSONLogic ルールを実行する (`json.go:364-378`):

```go
evalCtx = setFlagdProperties(je.Logger, evalCtx, flagdProperties{
    FlagKey:   flagKey,
    Timestamp: time.Now().Unix(),
})
...
err = jsonlogic.Apply(bytes.NewReader(targetingBytes), bytes.NewReader(b), &result)
```

ルール結果は引用符を剥がして flag の variants と突き合わせる。有効な variant なら `TARGETING_MATCH` を返し、そうでなければエラー (`json.go:401-409`)。targeting が無ければ `defaultVariant` を理由 `STATIC` で返す (`json.go:420`)。最後にジェネリックな `resolve[T]` が選ばれた variant の値を要求型に type-assert し、一致しなければ `TYPE_MISMATCH` を返す (`json.go:316-320`):

```go
value, ok = variants[variant].(T)
if !ok {
    return value, variant, model.ErrorReason, metadata, errors.New(model.TypeMismatchErrorCode)
}
```

## 読んで驚いた点

- store は map ではなく、7 本の index を持つトランザクショナルな `go-memdb` インスタンスだ (`core/pkg/store/store.go:47-118`)。source 間の key 衝突は source 順で解決する: `priority := slices.Index(s.sources, source)` で高優先の source が勝つ (`store.go:232`)。未登録の source は `panic` する (`store.go:236`)。
- source URI は `?use_path_style=true` のような blob クエリ文字列も含めて verbatim 登録され、sync はその文字列と完全一致する `DataSync.Source` を発行しなければならない (`flagd/pkg/runtime/from_config.go:84-90`)。
- targeting ルールからの `null` は文字列 `"null"` と区別して扱う。結果を trim し、引用符を剥がす前に `"null"` を確認することで、JSON の null と `null` という名前の variant リテラルを見分ける (`core/pkg/evaluator/json.go:384-398`)。
- `fractional` 演算子は明示的なバケット用プロパティが無いとき `targetingKey` でバケットに割り当て (`core/pkg/evaluator/json.go:30-32`)、ユーザーごとに決定的な割合スプリットを与える。
