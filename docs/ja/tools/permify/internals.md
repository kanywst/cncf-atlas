# 内部実装

> コミット `aa3a7c6` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/permify/permify.go` | バイナリのエントリポイント。CLI コマンドと gRPC balancer/resolver を登録 |
| `internal/servers` | gRPC/REST ハンドラ。検証して invoker に委譲 |
| `internal/invoke` | `DirectInvoker`。depth 検証、整合性デフォルト補完、エンジンへのディスパッチ |
| `internal/engines` | Check/Expand/Lookup の解決。ブール合成器と並行性 |
| `internal/schema` | コンパイル済みスキーマから entity/permission/relation/rule 定義を解決 |
| `internal/storage` | 永続化: `postgres/`、`memory/`、`proxies/`、リクエスト内 `context/` |
| `pkg/tuple` | リレーションタプルと subject のヘルパ |
| `pkg/database/postgres` | `XID8` を含む PostgreSQL 型 |

## 中核データ構造

- リレーションタプルと `Subject` (`pkg/tuple/tuple.go`): Zanzibar の `entity#relation@subject` 形式を protobuf 型で運ぶ。`ELLIPSIS = "..."` はワイルドカード relation を表し (`pkg/tuple/tuple.go:19`)、`IsDirectSubject` は relation が空なら直接 user subject とみなし (`pkg/tuple/tuple.go:26-28`)、`AreSubjectsEqual` は ellipsis を正規化した上で比較する (`pkg/tuple/tuple.go:39-41`)。
- `EntityDefinition` / `Rewrite` / `Leaf` / `Child` (`pkg/pb/base/v1` の生成 protobuf): スキーマ DSL がこの木にコンパイルされ、`check()` がこの木を歩く。
- `CheckFunction` と `CheckCombiner` (`internal/engines/check.go:89-95`): 1 件の check は `func(ctx) (*PermissionCheckResponse, error)`、合成器は複数の check を組み合わせる。認可評価は遅延クロージャの木として構成される。
- `Token` (`internal/storage/postgres/snapshot/token.go:16-26`): PostgreSQL の `XID8` 値とスナップショット文字列。下記の整合性アンカー。

## 追う価値のあるパス

1 件の `Check` を RPC から判定まで:

```text
PermissionServer.Check            internal/servers/permission_server.go:32
  DirectInvoker.Check             internal/invoke/invoke.go:105
    checkDepth                    internal/invoke/utils.go:10
    HeadSnapshot / HeadVersion    internal/invoke/invoke.go:135-167
  CheckEngine.Check               internal/engines/check.go:63
    check (参照種別で分岐)         internal/engines/check.go:108
      checkRewrite (UNION/...)    internal/engines/check.go:168
      checkDirectRelation         internal/engines/check.go:252
    checkUnion / checkRun         internal/engines/check.go:635 / 820
```

invoker は元リクエストを変更しないよう clone 上で depth を減らす:

```go
nextRequest := request.CloneVT()
nextRequest.Metadata.Depth = request.GetMetadata().Depth - 1
```

これは `internal/invoke/invoke.go:170-171`。エンジンの `check()` は参照種別から分岐を選び、rewrite を持つ permission をブール合成器にディスパッチする:

```go
case base.EntityDefinition_REFERENCE_PERMISSION:
    ...
    if child.GetRewrite() != nil {
        fn = engine.checkRewrite(ctx, request, child.GetRewrite())
    } else {
        fn = engine.checkLeaf(request, child.GetLeaf())
    }
```

これは `internal/engines/check.go:128-144`。

## 読んで驚いた点

SnapToken は独自のログ位置ではなく PostgreSQL のトランザクションスナップショットそのもの。`Token` は `XID8` とスナップショット文字列を保持し、`Encode` は `xid:snapshot` を base64 化した新形式を生成しつつ、後方互換のため旧来の 8 byte binary xid も Decode できる (`internal/storage/postgres/snapshot/token.go:38-123`)。トークン間の順序は `Eg`、`Gt`、`Lt` における XID8 値の整数比較 (`internal/storage/postgres/snapshot/token.go:60-77`)。トークン未指定時は各 Check が `HeadSnapshot()` に自分を固定するため (`internal/invoke/invoke.go:135-151`)、整合性は別の整合性サービスではなく PostgreSQL の MVCC 可視性に直接乗っている。役割は SpiceDB の ZedToken と同種だが、専用ストアではなくデータベースのネイティブなスナップショットで実装している。

もう 1 つの驚きは `checkUnion` の短絡の強さ。子はキャンセル可能な context の下で並行実行され、最初の ALLOWED が即 return する一方で deferred の `cancel()` が兄弟を止める (`internal/engines/check.go:635-685`)。ファンアウトは `concurrencyLimit` (既定 100、`internal/engines/utils.go:18-20`) のセマフォ chan で上限が掛かるため、深くネストしたスキーマでも無制限に goroutine が湧くことはない。
