# recon: Permify

調査メモ。Zanzibar 系認可エンジン。出典は URL 付き、コードは `path:line` 付き。

## 基本情報

- repo: Permify/permify
- pinned commit: `aa3a7c644e7f298f8f126e3ffa90d450967e0915` (2026-06-18) / 近いタグ: `v1.7.1` (2026-06-05) より後の main HEAD。HEAD 自体にタグは付いていない (`git tag --contains HEAD` は空)。直近の付与済みタグは `v1.7.0` / `v1.7.1`
- 言語 / ビルド: Go (`go 1.25.7`、`go.mod`) / `go build ./cmd/permify`、配布は `ghcr.io/permify/permify` コンテナ
- ライセンス: AGPL-3.0 (`LICENSE` 冒頭が "GNU AFFERO GENERAL PUBLIC LICENSE Version 3"、GitHub API の `spdx_id` も `AGPL-3.0`)
- CNCF 成熟度: Independent (CNCF プロジェクトではない。同種で CNCF 配下なのは OpenFGA。出典 S2, S8)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Identity & Policy
- main エントリポイント: `cmd/permify/permify.go`。`main()` が cobra ルートに `serve` / `validate` / `coverage` / `ast` / `migrate` を登録。起動時に consistent-hash gRPC balancer (`xxhash`) と kuberesolver を登録 (`cmd/permify/permify.go:16-26`)

## 歴史の素材

- 2022 年創業。Google Zanzibar 論文 (公開、実装は非公開) を OSS で再現する狙い。RBAC / ReBAC / ABAC を 1 つの DSL で表現できる点を売りにする。出典 S1, S3
- 2022-07 に Hacker News で初公開 ("Show HN: Permify")。当初の特徴は DB の CDC で認可データを relation tuple として同期する点。出典 S3
- 2024-08 に Permify 1.0 を HN で公開。出典 S4
- アクセラレータは Y Combinator ではなく Pioneer。シードは 500 Global / Pioneer Fund / Diaspora Ventures が約 $1M をリード (二次情報、ベンダー寄り記事なので注意)。出典 S5
- 2025-11-20、FusionAuth が Permify を買収 (金額非公開)。AuthN (FusionAuth) と AuthZ (Permify) を 1 つの self-hostable プラットフォームに統合する狙い。OSS コアは GitHub 上で継続、チーム 2 名が contractor として参加と表明。GitHub の repo description も "Permify is now part of FusionAuth" に変更済み。出典 S6, S7、repo description は GitHub API で確認

## アーキテクチャの素材

レイヤ構成 (`internal/` 配下):

- `servers/` gRPC/REST のハンドラ。`permission_server.go` が `Check` / `BulkCheck` / `Expand` / `LookupEntity(Stream)` / `LookupSubject` / `SubjectPermission` を公開。各 RPC は OTel span を張り、`request.Validate()` 後に invoker へ委譲するだけの薄い層 (`internal/servers/permission_server.go:32-50`)
- `invoke/` invoker 層。`DirectInvoker` が schemaReader / dataReader と各エンジン (Check/Expand/Lookup/SubjectPermission) を束ねる (`internal/invoke/invoke.go:56-100`)。ここで全 RPC 共通の前処理を行う: SnapToken 未指定なら `dataReader.HeadSnapshot()` で最新スナップショットを補完、SchemaVersion 未指定なら `schemaReader.HeadVersion()` で補完 (`internal/invoke/invoke.go:136-167`)
- `engines/` 認可解決の中核。`check.go` / `expand.go` / `lookup.go` / `entity_filter.go` / `subject_filter.go` / `subject_permission.go` / `bulk.go`
- `schema/` DSL からコンパイルされた entity/permission/relation/rule 定義の参照ヘルパ
- `storage/` 永続化抽象。`postgres/` が本命、`memory/` が開発用、`proxies/` に cache 等のデコレータ。`storage/context/` はリクエスト内 contextual tuples/attributes
- `pkg/` 再利用ライブラリ: `tuple` (relation tuple)、`attribute` (ABAC 属性)、`dsl` (スキーマ言語)、`token` (SnapToken)、`cache` (ristretto)、`balancer` (consistent hash)、`database/postgres`、`pb` (生成 protobuf)

BulkCheck は最大 100 件をゴルーチンで並列実行し、個別失敗は DENIED にフォールバックして全体は落とさない (`internal/servers/permission_server.go:80-181`)。

書き込み経路は Zanzibar の relation tuple を Postgres に MVCC 追記し、読み取り時にスナップショットで一貫性を取る。リアルタイム同期に Debezium/Kafka を使う構成は製品側の "Sync Service" であり、コアエンジンは Postgres スナップショットで完結する (出典 [1] は二次情報)。

## 内部実装の素材

代表操作 = 1 件の Permission Check を端から端まで追った。

1. RPC 受信: `PermissionServer.Check` が `request.Validate()` 後に `r.invoker.Check` を呼ぶ (`internal/servers/permission_server.go:32-49`)
2. invoker 前処理: depth 検証、SnapToken / SchemaVersion 補完、depth を 1 減らしたリクエストの clone を作成、最後に CheckCount を atomic にインクリメント (`internal/invoke/invoke.go:105-192`)。depth は `checkDepth` で `Depth < 0` を `ERROR_CODE_DEPTH_NOT_ENOUGH` として弾く (`internal/invoke/utils.go:11-16`)
3. エンジン入口: `CheckEngine.Check` が entity 定義を読み `engine.check(...)(ctx)` を実行 (`internal/engines/check.go:63-84`)
4. ディスパッチ: `check()` が permission 名の参照種別を判定して分岐 (`internal/engines/check.go:108-164`)
   - `REFERENCE_PERMISSION`: child が rewrite を持てば `checkRewrite`、なければ `checkLeaf`
   - `REFERENCE_ATTRIBUTE`: `checkDirectAttribute`
   - `REFERENCE_RELATION`: `checkDirectRelation`
5. ブール代数: `checkRewrite` が UNION / INTERSECTION / EXCLUSION を `checkUnion` / `checkIntersection` / `checkExclusion` にマップ (`internal/engines/check.go:168-187`)
6. 直接関係の解決: `checkDirectRelation` が `TupleFilter` を組み、リクエスト内 contextual tuples (`storageContext.NewContextualTuples(...).QueryRelationships`) と DB (`engine.dataReader.QueryRelationships`) を `NewUniqueTupleIterator` でマージ。subject が一致すれば即 ALLOWED、userset (subject が user でなく relation 付き) なら subject の relation を新 permission として再帰 `engine.invoke` する (`internal/engines/check.go:252-327`)
7. ttu: `checkTupleToUserSet` が tupleset relation でタプルを引き、各 subject に対し computed userset を再帰 (`internal/engines/check.go:331-398`)
8. ABAC: `checkDirectAttribute` が boolean 属性を読み true/false で許否 (`internal/engines/check.go:445-504`)。`checkDirectCall` は rule 定義を読み computed attribute を引いて `cel-go` で式評価 (`prg.Eval`) し bool を返す (`internal/engines/check.go:527-631`)

並列実行の実体: `checkUnion` は子 CheckFunction をキャンセル可能 context で並走させ、1 つでも ALLOWED が来たら即 return して context をキャンセルする (`internal/engines/check.go:635-685`)。`checkRun` が `concurrencyLimit` (既定 100、`internal/engines/utils.go:19`) のセマフォ chan で同時実行数を絞る (`internal/engines/check.go:820-862`)。

中核データ構造 (3 から 5 個):

- relation tuple / Subject: `pkg/tuple/tuple.go`。`ELLIPSIS = "..."` (`pkg/tuple/tuple.go:19`)、`IsDirectSubject` (`:27`)、`AreSubjectsEqual` (`:40`)。Zanzibar の `entity#relation@subject` を protobuf `base.Tuple` で表現
- `EntityDefinition` / `Rewrite` / `Leaf` / `Child` (生成 protobuf `pkg/pb/base/v1`)。スキーマ DSL がこの木にコンパイルされ、`check()` がこの木を歩く
- `CheckFunction` / `CheckCombiner`: `func(ctx) (*PermissionCheckResponse, error)` と、その並列合成器 (`internal/engines/check.go:89-95`)。認可評価を遅延クロージャの木として構成する設計
- SnapToken (Postgres 実装 `internal/storage/postgres/snapshot/token.go`): 下記の設計判断の核

コードでしか見えない非自明な設計判断: **SnapToken (Zanzibar の zookie に相当) を PostgreSQL のトランザクションスナップショット (XID8) で実装している**。`internal/storage/postgres/snapshot/token.go` の `Token{ Value postgres.XID8; Snapshot string }` は `xmin:xmax:xip,...` 形式の PG スナップショットを保持し、`createFinalSnapshot()` が現トランザクションの txid を xip リストに昇順挿入して xmin/xmax を補正、MVCC 可視性に基づく一意スナップショットを作る (`:130-213`)。トークンは `xid:snapshot` を base64 した新形式と、8 byte binary xid の旧形式を `Decode` で両対応 (`:79-123`)。`Gt` / `Lt` / `Eg` は XID8 の整数比較で前後関係を判定する (`:61-77`)。Check のたびに invoker が `HeadSnapshot()` で最新スナップショットを取り (`internal/invoke/invoke.go:136-151`)、読み取り時点のデータ世代を固定して新旧データ混在 (new enemy 問題) を避ける。SpiceDB の ZedToken と同種の仕組みだが、専用ストアではなく Postgres ネイティブの可視性をそのまま使う点が独特。

## 採用事例の素材

- 出典付きで名前が出るのは買収プレスや二次記事の範囲。技術系一次資料に検証可能な ADOPTERS リストは確認できず。買収関連記事は P&G / Mastercard / HPE / Sennder を顧客例に挙げるが、いずれもベンダー/二次情報で repo 内の裏付けはない (出典 S1)。**個別企業名は一次資料での裏取りができないため断定しない**
- 定量シグナル (一次): GitHub stars 5,901、forks 320、contributors 約 78 (anon 含む、`/contributors` の Link ヘッダ last=page 78)。いずれも 2026-06-22 時点、GitHub API。created 2022-07-14
- 製品側が主張する規模 (1.2M+ DL、1 日 43 億 check、40+ 本番デプロイ等) は買収記事/プレスの二次情報であり一次検証なし (出典 S1, S6)

## 代替・エコシステム

- 直接の代替: SpiceDB (AuthZed、Apache-2.0、最も Zanzibar 忠実、ZedToken で per-request 一貫性、Postgres/MySQL/CockroachDB/Spanner 対応)、OpenFGA (Auth0/Okta 発、Apache-2.0、CNCF Sandbox)。Permify は AGPL-3.0、Postgres 中心 (+memory)、マルチテナント前提と DSL/Playground の DX を差別化点に置く。出典 S2, S8
- 本質的な差: (1) ライセンスが AGPL-3.0 で、ネットワーク提供にも copyleft が及ぶ。SpiceDB/OpenFGA の Apache-2.0 と非対称。(2) 一貫性は Postgres スナップショットに依存し、per-request の細粒度調整は SpiceDB ほど豊富でない。(3) ABAC を attribute + CEL ルール (`checkDirectCall`) でネイティブ統合し純 ReBAC を超える
- エコシステム: gRPC + REST (REST 3476 / gRPC 3478、`README.md:104-110`)、Playground (`playground/`)、各言語 SDK (`sdk/`)、proto 定義 (`proto/base/v1/`)、cache に ristretto、分散構成で consistent-hash balancer + kuberesolver

## 最小セットアップ

```bash
docker run -p 3476:3476 -p 3478:3478 ghcr.io/permify/permify serve
```

3476 が REST、3478 が gRPC (`README.md:104-110`)。スキーマを書き、relation tuple / attribute を投入し `Check` を呼ぶのが最小ループ。永続化は Postgres、開発用に in-memory フォールバックあり。
