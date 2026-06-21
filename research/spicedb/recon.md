# recon: SpiceDB

調査メモ。Google Zanzibar 由来の ReBAC 権限データベース。authzed 製。CNCF ではない。

## 基本情報

- repo: authzed/spicedb (<https://github.com/authzed/spicedb>)
- pinned commit: `4bb1d7b3e1029e94551cda04f217029e2f987c97` (2026-06-19, `fix: match IPv4-mapped IPv6 addresses in the in_cidr caveat (#3184)`)
- 近いタグ: `main` ブランチ上で、最新リリースタグ `v1.54.0` の後ろ。HEAD 自体はタグなし (2026-06-22 時点の最新リリースは v1.54.0)
- 言語 / ビルド: Go (go.mod は `go 1.26.4`)。ビルドは mage ベース (`magefiles/`)、`go build ./cmd/spicedb`、コンテナは `authzed/spicedb`
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認、GitHub API の `spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Independent (CNCF プロジェクトではない。競合の OpenFGA が CNCF Incubating。後述)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Identity & Policy
- 主エントリポイント: `cmd/spicedb/main.go` (cobra ベース、`pkg/cmd.BuildRootCommand()` でサブコマンド構築、`serve` が gRPC/HTTP を起動)

## 歴史の素材

- 起源は Google が 2019 年夏に公開した Zanzibar 論文 (グローバル規模の認可システム)。SpiceDB はその OSS 実装。出典: <https://authzed.com/docs/spicedb/concepts/zanzibar> (参照 2026-06-22)
- AuthZed 創業者は元 CoreOS (Red Hat に買収)。2020 年 8 月に Red Hat を離れ、翌月に最初の API 完全実装 (Python 製、コードネーム Arrakis) を書いた。2021 年 3 月に Go へ書き直し (コードネーム Caladan)、2021 年 9 月に SpiceDB として OSS 化。出典: <https://www.star-history.com/blog/spicedb/> および <https://authzed.com/blog/spicedb-is-open-source-zanzibar> (参照 2026-06-22)
- GitHub リポジトリ作成日: 2021-08-16 (GitHub API `created_at`)。OSS 公開アナウンスは 2021 年 9 月末
- Zanzibar からの主な逸脱 (コードで裏取り可能なもの): (1) Spanner だけでなく Postgres / MySQL / CockroachDB / インメモリの複数バックエンド、(2) user を特別扱いせず通常の object 型として扱う (ID プロバイダ中立)、(3) New Enemy 問題に対し ZedToken (Zanzibar の Zookie 相当) と設定可能な consistency で対処、(4) Caveats (CEL ベースの条件付き関係)。出典: <https://authzed.com/blog/spicedb-is-open-source-zanzibar> (参照 2026-06-22)
- コミュニティ提供の主要機能: GitHub の認可チームが MySQL データストアを実装・寄贈、Netflix の認可チームが Caveats のスポンサー兼設計パートナー。出典: <https://www.star-history.com/blog/spicedb/> (参照 2026-06-22)

## アーキテクチャの素材

トップレベル構成 (リポジトリルート):

- `cmd/spicedb/` : バイナリのエントリポイント。`main.go` で zerolog 初期化、kuberesolver 登録、consistent hashring gRPC ロードバランサ登録、cobra ルートコマンド構築
- `internal/services/v1/` : gRPC API v1 の実装 (Permissions, Schema, Watch, Relationships サービス)。`permissions.go` に CheckPermission 等
- `internal/dispatch/` : 認可計算を分散実行するディスパッチ層。`caching/`, `singleflight/`, `remote/` (クラスタ), `combined/`, `graph/` のチェーン
- `internal/graph/` : 実際のグラフ探索エンジン (`check.go`, `expand.go`, `lookupresources*.go`, `lookupsubjects.go`)
- `internal/datastore/` + `pkg/datastore/` : ストレージ抽象とドライバ (`crdb`, `postgres`, `mysql`, `spanner`, `memdb`, `proxy`)
- `pkg/schema/`, `pkg/schemadsl/` : スキーマ DSL (lexer/parser/compiler/generator) とスキーマモデル
- `pkg/tuple/` : 関係タプルとコアデータ構造
- `pkg/caveats/`, `internal/caveats/` : CEL ベースの Caveats
- `pkg/zedtoken/` : ZedToken (consistency トークン) のエンコード/デコード
- `proto/` + `pkg/proto/` : gRPC / 内部 dispatch の protobuf 定義

ディスパッチャのチェーン構築は `internal/dispatch/combined/combined.go:193` の `NewDispatcher`。順序は外側から `caching` -> (`singleflight` -> ローカル `graph`) で、クラスタモードでは `caching` -> `singleflight` -> `remote.NewClusterDispatcher` (consistent hashring で他ノードへ gRPC redispatch)。`combined.go:201` で caching を作り、`combined.go:245` で `graph.NewDispatcher(cachingRedispatch, ...)` がローカル探索を caching に再帰させ、`combined.go:318` の `SetDelegate` でループ状に閉じる。これにより 1 つの check が複数ノードにファンアウトしつつ各ノードでキャッシュされる。

### 代表オペレーション: Permission Check のエンドツーエンド

1. gRPC ハンドラ `(*permissionServer).CheckPermission` : `internal/services/v1/permissions.go:62`。リクエストメタから revision/schemaHash を解決 (`consistency.RevisionFromContext`, `permissions.go:78`)、snapshot reader を取得 (`permissions.go:83`)、namespace と relation の存在検証 (`namespace.CheckNamespaceAndRelations`, `permissions.go:95`)、Caveat コンテキストを組み立て (`permissions.go:85`)
2. `computed.ComputeCheck` を呼ぶ : `permissions.go:124`。`ResourceType = tuple.RR(objectType, permission)`, `Subject = tuple.ONR(...)`, `MaximumDepth = config.MaximumAPIDepth` を渡す
3. `computeCheck` : `internal/graph/computed/computecheck.go:89`。ここで `v1.NewTraversalBloomFilter(uint(params.MaximumDepth))` を生成 (`computecheck.go:113`)、resourceID を `dispatchChunkSize` 単位にチャンク分割し (`computecheck.go:122` `slicez.ForEachChunkUntil`)、各チャンクで `d.DispatchCheck` を呼ぶ (`computecheck.go:123`)。`Metadata.TraversalBloom` に bloom を載せる (`computecheck.go:131`)
4. ディスパッチチェーン: caching ヒットがあれば即返す。なければ `singleflight.(*Dispatcher).DispatchCheck` (`internal/dispatch/singleflight/singleflight.go`) が同一キーの同時実行を 1 本に束ねる。redispatch があれば cluster へ
5. ローカルグラフ探索 `(*ConcurrentChecker).Check` : `internal/graph/check.go:99` -> `checkInternal` (`check.go:165`)。まず subject と一致する resourceID を直接フィルタ (`filterForFoundMemberResource`, `check.go:192`)、relation に userset rewrite が無ければ `checkDirect` (`check.go:304`) で直接タプルを引き、あれば `checkUsersetRewrite` (`check.go:539`) で union/intersection/exclusion を再帰展開し各子を再 dispatch (`check.go:561` の `dispatch`)
6. 結果を `computeCaveatedCheckResult` (`computecheck.go:170`) で Caveat 評価し、`checkResultToAPITypes` (`permissions.go:178`) で `PERMISSIONSHIP_HAS_PERMISSION` / `NO_PERMISSION` / `CONDITIONAL` に変換して返す

## 内部実装の素材

中核データ構造:

- `ObjectAndRelation` (ONR) : `pkg/tuple/structs.go:24`。`{ObjectID, ObjectType, Relation}`。文字列表記は `type:id#relation` (`structs.go:59`)。グラフのノードに相当
- `Relationship` : `pkg/tuple/structs.go:80`。`RelationshipReference{Resource ONR, Subject ONR}` を埋め込み、`OptionalCaveat`, `OptionalExpiration`, `OptionalIntegrity` を持つ。Zanzibar の relation tuple に相当 (`ToCoreTuple`, `structs.go:89`)
- `DispatchCheckRequest` / `ResolverMeta` (protobuf, `pkg/proto/dispatch/v1/`) : ディスパッチ間で運ばれるリクエスト。`ResolverMeta` に `AtRevision`, `DepthRemaining`, `TraversalBloom`, `SchemaHash` を持つ (`computecheck.go:128`)
- `datastore.Datastore` インタフェース : `pkg/datastore/datastore.go`。`SnapshotReader(Revision) Reader` (`:707`)、`OptimizedRevision` (`:711`)、`HeadRevision` (`:715`)、`Watch(...)` (`:739`)、`ReadWriteTx(...)` (`:768`)。MVCC 的な revision モデル。`OptimizedRevision` は「既にレプリケート済みで十分に新しい」revision を返し読み取り遅延を下げる設計
- `ZedToken` : `pkg/zedtoken/zedtoken.go`。datastore revision + schema hash をエンコードした不透明トークン (`NewFromRevision`, `:71`)。クライアントが「この時点以降の一貫性」を要求するために使う (New Enemy 問題対策)

非自明な設計判断 (コードでしか見えないもの): **traversal bloom filter によるディスパッチのループ検出**。

- check のトップで深さ分のサイズの bloom を作る: `v1.NewTraversalBloomFilter(uint(params.MaximumDepth))` (`internal/graph/computed/computecheck.go:113`)。偽陽性率はデフォルト 0.1% (`pkg/proto/dispatch/v1/02_resolvermeta.go:41`)
- bloom はリクエストメタ `TraversalBloom` に載って各ディスパッチへ伝播する (`computecheck.go:131`)
- singleflight ディスパッチャは dispatch キーを bloom に記録する `RecordTraversal` を呼び (`internal/dispatch/singleflight/singleflight.go:74`)、既出キー (= 再帰呼び出しの可能性) を検知したら singleflight の束ね処理を**回避して** delegate に直接流す (`singleflight.go:77-80`)。コメント (`singleflight.go:70-73`) いわく「再帰呼び出しを singleflight でブロックするとデッドロックするため。偽陽性なら 1 回余分に dispatch されるだけの小さな非効率とのトレードオフ」
- `RecordTraversal` の実体は `pkg/proto/dispatch/v1/02_resolvermeta.go:15`。bloom に `TestString` -> 既出なら `possiblyLoop=true`、未出なら `AddString` して詰め直す。ファイル冒頭に `// This file is *not* autogenerated.` とあり、生成 protobuf とは別に手書きされている

これは「スキーマ上は self-referential / 循環しうる relation を、深さ制限 + bloom でディスパッチ層が安全に処理する」という Zanzibar 実装特有の工夫で、ドキュメントよりコードを読まないと見えない。

データストアは複数ドライバ (`internal/datastore/{crdb,postgres,mysql,spanner,memdb}`) を共通インタフェースで切り替え。スキーマは `pkg/schemadsl/` に独自 DSL (lexer/parser/compiler) を持つ。

## 採用事例の素材

出典付きで言えるのは「コントリビュータ/設計パートナーとしての企業名」のみ。製品採用 (本番でこの組織が使っている) と断定できる citable な ADOPTERS ファイルはリポジトリに見当たらない。

- コントリビュータの所属企業として GitHub, Adobe, Google, Fastly, Plaid, Red Hat, Reddit が挙げられている。出典: <https://www.star-history.com/blog/spicedb/> (参照 2026-06-22)
- GitHub の認可チームが MySQL データストアを実装・寄贈。Netflix の認可チームが Caveats のスポンサー兼設計パートナー。出典: 同上 (参照 2026-06-22)
- 上記以外の「本番採用企業」の固有名は、確実な一次ソースを確認できなかったため記載しない (捏造回避)

採用シグナル (定量):

- GitHub stars: 6,791、forks: 399、watchers(subscribers): 50、open issues: 137 (GitHub API, 2026-06-22)
- コントリビュータ数: 約 76 (GitHub API contributors の Link ヘッダ `rel="last"` が page=76、per_page=1、2026-06-22)

## 代替・エコシステム

- 最も直接の代替は **OpenFGA** (元 Auth0/Okta、現 CNCF Incubating)。同じ Zanzibar 系 ReBAC。SpiceDB が gRPC ファースト + トークンベースの厳密 consistency (ZedToken) を既定にするのに対し、OpenFGA は REST ファーストで `HIGHER_CONSISTENCY` をオプトインフラグにする。ライセンスはどちらも Apache-2.0。出典: <https://workos.com/blog/top-5-google-zanzibar-open-source-implementations-in-2024>, <https://authzed.com/learn/openfga-alternatives> (参照 2026-06-22)
- **Ory Keto** : Go 製の Zanzibar 実装。Ory スタック (Kratos 等) と統合。consistency 設定の粒度は SpiceDB より粗い。出典: <https://www.osohq.com/learn/spicedb-alternatives-authorization-tools-comparison> (参照 2026-06-22)
- **OPA / Rego** : グラフベースではなくポリシーコードベースの認可。問題領域が異なる (ReBAC vs ポリシー評価)。出典: <https://www.permit.io/blog/zanzibar-vs-opa> (参照 2026-06-22)
- 本質的な差別化: (1) 完全な Zanzibar consistency モデル (`at_least_as_fresh` / `fully_consistent`) を ZedToken で提供、(2) Postgres/MySQL/CockroachDB/Spanner/memdb の複数バックエンド、(3) 関係変更をリアルタイム配信する Watch API、(4) CEL ベースの Caveats による属性条件付き関係。出典: <https://workos.com/blog/top-5-google-zanzibar-open-source-implementations-in-2024> (参照 2026-06-22)
- エコシステム: 公式 CLI `zed`、`authzed/awesome-spicedb` リスト、OpenTelemetry / Prometheus 連携 (CNCF プロジェクトを利用する側であって、自身は CNCF ではない)。マネージド版は AuthZed 社が提供

### 最小起動 (出典: README.md / authzed docs, 参照 2026-06-22)

- Homebrew: `brew install authzed/tap/spicedb authzed/tap/zed` (README.md:113)
- Docker (インメモリ datastore で即起動):

```bash
docker run --rm -p 50051:50051 -p 8443:8443 authzed/spicedb \
  serve --http-enabled true --grpc-preshared-key "somerandomkeyhere"
```

  (README.md:155)

- Debian/RPM 系は APT/YUM リポジトリ追加で `apt install spicedb zed` / `dnf install spicedb zed` (README.md:116-135)
- 本番は Postgres 等のバックエンドを `--datastore-engine` で指定。インメモリ (memdb) は開発・テスト用
