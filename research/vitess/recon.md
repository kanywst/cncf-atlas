# recon: Vitess

調査メモ。MySQL を水平スケールさせる分散 DB クラスタリングシステム。VTGate がプロキシとしてシャーディングロジックを吸収し、アプリには単一の MySQL 互換エンドポイントを見せる。出典は URL を添える。コードは pinned commit の実物を読んで `file:line` を残す。

## 基本情報

- repo: `vitessio/vitess` (<https://github.com/vitessio/vitess>)
- pinned commit: `792474356c3f7d220092534e768ce9989996ab98` (2026-06-22, `main`)。リリースタグは未付与。直近のリリースタグは `v24.0.1` (2026-05-07)。`go/vt/servenv/version.go:22` の `versionName` は `25.0.0-SNAPSHOT` で、v25 開発中の HEAD。
- 言語 / ビルド: Go (`go.mod` の `module vitess.io/vitess`, `go 1.26.4`)。ビルドは `make build` (Makefile)。Java クライアントは `java/` にある補助物。
- ライセンス: Apache-2.0。`LICENSE` 冒頭が `Apache License Version 2.0` で実確認。GitHub API の `license.spdx_id` も `Apache-2.0`。
- CNCF 成熟度: Graduated (2019-11-05 卒業)。出典は CNCF。
- カテゴリ (tools.ts の CATEGORY_ORDER から): Storage & Database

## 歴史の素材

- 2010 年 YouTube の社内プロジェクトとして発足。MySQL は水平スケール (シャーディング) を素では持たず、YouTube は急成長で MySQL の限界に当たっていた。発端は当時 YouTube のエンジニア Sugu Sougoumarane。出典: <https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/>, <https://vitess.io/docs/22.0/overview/history/>
- 設計の核は「シャード選択ロジックをアプリから剥がす」こと。アプリとDBの間にプロキシ (VTGate) を挟み、ルーティングと管理をそこへ寄せた。出典: 同上 SiliconANGLE。
- 2011 年以降 YouTube の DB 基盤の中核となり、数万 MySQL ノード規模に拡大。GitHub への最初の公開コミットは 2012-02-24 (リポジトリ作成は 2013-06-27, GitHub API `created_at`)。出典: SiliconANGLE。
- CNCF 受け入れ 2018-02-05 (Incubating)、卒業 2019-11-05 (Graduated)。Kubernetes, Prometheus, Envoy, CoreDNS, containerd, Fluentd, Jaeger に次ぐ 8 番目の卒業プロジェクト。卒業時に v4.0、VReplication の実験的サポートを含む。2019-02 に CNCF 出資のセキュリティ監査を通過。出典: <https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/>, <https://www.cncf.io/projects/vitess/>
- コントリビュータの多様化: 2020-04 時点で上位は Google 36% と PlanetScale 25%。初期2年は Google(YouTube) が大半を提供。出典: <https://www.cncf.io/reports/vitess-project-journey-report/>

## アーキテクチャの素材

トップレベルの実行系コンポーネントは `go/cmd/` のバイナリ群に対応する。

- `vtgate` (`go/cmd/vtgate/`): ステートレスなプロキシ。MySQL ワイヤプロトコルと gRPC を話し、SQL を受けてパース・プランニング・シャードへのルーティングを行う。アプリから見える唯一の窓口。
- `vttablet` (`go/cmd/vttablet/`): 各 MySQL インスタンスに張り付くサイドカー。クエリ実行、コネクションプール、クエリ整形 (consolidation)、ヘルスチェック、バックアップを担う。
- `vtctld` / `vtctldclient` (`go/cmd/vtctld/`, `go/cmd/vtctldclient/`): 管理プレーン。スキーマ変更、リシャーディング、MoveTables などの運用操作 RPC を提供。
- `vtorc` (`go/cmd/vtorc/`): レプリケーショントポロジを監視し自動フェイルオーバ (reparent) を行うオーケストレータ。
- `vtadmin` (`go/cmd/vtadmin/`): 複数クラスタを束ねる管理 API + Web UI。
- topology service: etcd / ZooKeeper / Consul に keyspace・shard・tablet のメタデータを保存 (`go/vt/topo/`)。VTGate はここを watch して serving graph を構築する (`go/vt/srvtopo/`)。
- `vtcombo` (`go/cmd/vtcombo/`): 全コンポーネントを1プロセスに詰めたテスト/ローカル用。

論理データモデル: keyspace (= 論理DB) が複数の shard に分割される。各 shard は primary + replica の MySQL 群。シャーディングのキー導出は VSchema が定義する Vindex (Vitess Index) で決まる。

VTGate の起動は cobra コマンド (`go/cmd/vtgate/cli/cli.go:138` `run`)。`servenv.Init()` から `vtgate.Init(...)` (`cli.go:182`)、`servenv.RunDefault()` (`cli.go:192`) という servenv フレームワーク経由。エントリポイントは `go/cmd/vtgate/vtgate.go` の `main()` で cobra の `cli.Main.Execute()` を呼ぶだけ。

## 内部実装の素材

### 代表操作: VTGate が 1 本の SELECT を受けてシャードへ投げるまで

1. `Executor.Execute` (`go/vt/vtgate/executor.go:254`): トレーススパンを張り `LogStats` を作って内部 `execute` を呼ぶ。終わりにメモリ超過警告 (`executor.go:276`)、エラー変換 (`errorTransform.TransformError`, `executor.go:292`) を通す。
2. `Executor.execute` (`go/vt/vtgate/executor.go:489`): `newExecute` にコールバック2つ (プラン実行用 `execPlan` と begin/commit などの簡易応答用 `recResult`) を渡すだけの薄い橋渡し。`executor.go:493`。
3. `Executor.newExecute` (`go/vt/vtgate/plan_execute.go:65`): 本体。
   - `MaxBufferingRetries` ループ (`plan_execute.go:90`)。フェイルオーバ中のバッファリングで VSchema が更新されるのを待って再プランするための再試行。`plan_execute.go:106` で `waitForNewerVSchema`。
   - `fetchOrCreatePlan` (`plan_execute.go:122` 経由 `executor.go:1174`): SQL をパースしてプラン木を作り、プランキャッシュに載せる。`Plan.Instructions` (Primitive 木) がここで確定。
   - `handleTransactions` (`plan_execute.go:156`): begin/commit/savepoint 等は実シャードに行かず session 操作で完結。
   - `addNeededBindVars` (`plan_execute.go:165`, 実体 `executor.go:507`): `last_insert_id()` や `@@autocommit` などプランが要求する bind 変数を session から注入。
   - 実行 (`plan_execute.go:175`): `plan.Instructions.NeedsTransaction()` なら `insideTransaction` でラップし、最終的に `execPlan` から `executePlan`、`plan.Instructions.TryExecute(...)` を呼ぶ。
4. プラン木の葉での実シャード実行 `Route.TryExecute` (`go/vt/vtgate/engine/route.go:133`):
   - `route.findRoute` (`engine/route.go:134`, 実体 `go/vt/vtgate/engine/routing.go:138`) が Opcode と Vindex を見て対象シャード `[]*srvtopo.ResolvedShard` を解決。`Equal`/`EqualUnique` は Vindex で keyspace id を引いて単一シャード、`Scatter` は全シャードへ。`routing.go:152` 周辺の `switch rp.Opcode`。
   - `route.executeShards` (`engine/route.go:148`): `vcursor.ExecuteMultiShard(...)` (`route.go:185`) で各 shard の vttablet に並列実行。マッチ shard が 0 でも `count(*)` のような0行で意味が変わるケースは任意 shard に投げる (`route.go:178` `anyShard`)。scatter かつ `OrderBy` ありなら結果を merge-sort (`route.go:205` `route.sort`)、最後に `Truncate` (`route.go:211`)。

このプランから Primitive 木、シャード fan-out までが VTGate の中核。

### 中核データ構造

- `engine.Plan` (`go/vt/vtgate/engine/plan.go:42`): クエリの実行戦略。`Instructions Primitive` (実行命令木) を包み、`Type` (PlanType: Passthrough/Scatter/JoinOp/Complex 等、`plan.go:75` 以降の const)、`QueryType`、`TablesUsed`、実行統計 (`ExecCount`/`ExecTime`/`ShardQueries`) を持つ。プランキャッシュのキーは `PlanKey` (`plan.go:64`, keyspace + tablet type + destination + query + collation)。
- `engine.Primitive` (`go/vt/vtgate/engine/primitive.go:271`): 実行命令のインタフェース。`TryExecute` / `TryStreamExecute` / `GetFields` / `NeedsTransaction` / `Inputs`。木構造で、`Route`/`Join`/`Limit`/`OrderedAggregate`/`Distinct` など各 primitive が `engine/*.go` に1ファイルずつ。`noInputs`/`noTxNeeded`/`noFields` の埋め込みで葉のデフォルト挙動を共有 (`primitive.go:287`)。
- `engine.Route` (`go/vt/vtgate/engine/route.go`): 1 keyspace に対する実シャードクエリ primitive。`*RoutingParameters` を埋め込み、`ScatterErrorsAsWarnings` や merge-sort 用 `OrderBy` を持つ。
- `vindexes.Vindex` (`go/vt/vtgate/vindexes/vindex.go:52`): シャーディングキーから keyspace id へのマッピング抽象。`Cost()` (0=keyspace id そのもの, 1=ハッシュ可能, 2+=外部ルックアップ必要), `IsUnique()`, `NeedsVCursor()`。hash / lookup / consistent_lookup / numeric / cfc など実装多数 (`vindexes/*.go`)。
- `srvtopo.ResolvedShard` (`go/vt/srvtopo/resolver.go:78`): 解決済みの送信先。`Target *querypb.Target` (keyspace/shard/tablet type) と実行口の `Gateway`。
- `sqltypes.Result` (`go/sqltypes/result.go:31`): MySQL 結果セット。`Fields` / `Rows []Row` / `RowsAffected` / `InsertID`。`proto3Rows` をキャッシュしてクエリ consolidation 時の再エンコードを避ける (`result.go:42` 付近のコメント)。

### 非自明な設計判断: Vindex 抽象でシャーディングキーを主キーから切り離す

伝統的な手動シャーディングはシャードキーをアプリのクエリ条件に固定で要求する。Vitess は VSchema 上で「列から Vindex 関数、keyspace id」を宣言的に定義し (`vindexes.Vindex`, `go/vt/vtgate/vindexes/vindex.go:52`)、プランナが Opcode を決める際に Vindex の `Cost()` を見て一番安いルーティングを選ぶ (`routing.go:152` の Opcode 分岐)。これにより:

- primary Vindex (hash 等、cost 1) でないカラムでの検索でも、secondary な lookup Vindex (`vindexes/lookup.go`, cost 2、別テーブルへの逆引き) を張れば単一シャードに絞り込める。
- スキャッター回避を「アプリのクエリ書き換え」ではなく「VSchema 宣言 + プランナ」で実現する。MySQL 互換性を保ったまま、シャードキー以外の検索を吸収するのがこの抽象の肝。`NeedsVCursor()=true` の Vindex は VReplication からは使えない、といった制約も同インタフェースに表現されている。

## 採用事例の素材

repo 同梱の `ADOPTERS.md` 記載 (実確認済み、捏造なし): GitHub, Slack, Square, Pinterest, Shopify, Etsy, HubSpot, New Relic, JD.com, FlipKart, PlanetScale, Uber, Twitter, YouTube, Axon, BetterCloud, CloudSigma, Vinted, Weave ほか。

- CNCF 卒業告知でも GitHub, JD.com, Pinterest, Slack, Square, Stitch Labs, YouTube が production / 各段階で利用と明記。出典: <https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/>
- スケール実績: YouTube はペタバイト級・秒間数百万クエリ。Slack の Vitess は約 6,000 サーバ規模、最大級の deployment は約 70,000 サーバとされる。出典: <https://www.cncf.io/reports/vitess-project-journey-report/> (Project Journey Report)。
- GitHub 指標 (2026-06-23 取得, GitHub API): stars 21,053 / forks 2,356 / contributors 約 327。

## 代替・エコシステム

- PlanetScale: Vitess を SaaS 化したもの (managed/serverless)。ブランチング、非ブロッキングスキーマ変更を売りにする。Vitess の最大スポンサーの一つ。MySQL 専用。
- Citus: PostgreSQL 拡張によるシャーディング。Vitess より設定は単純で Postgres の柔軟性を活かせるが、複雑なシャーディング管理は Vitess の方が手厚い。
- CockroachDB / TiDB / YugabyteDB: NewSQL。シャードキー宣言不要の自動シャーディングと強い分散一貫性 (serializable) を持つ。Vitess は MySQL 互換ミドルウェアでシャード割当を明示制御する点が本質的に違う。クロスシャードは 2PC でアトミックだがシャード跨ぎの完全な ACID 分離は提供しない (アプリ側ハンドリング前提)。
- エコシステム: トポロジバックエンドに etcd/ZooKeeper/Consul。Kubernetes 上は vitess-operator (`examples/operator/operator.yaml`)。バックアップは S3/GCS/Ceph (`examples/local/ceph_backup_config.json`)。VReplication が MoveTables / Reshard / Materialize / オンライン DDL の基盤。
- 出典: <https://www.tinybird.co/blog/Citus-Alternatives>, <https://www.pingcap.com/compare/best-distributed-sql-databases/>

## インストール・最小構成

- ローカル最小クラスタ: repo の `examples/local/`。`./101_initial_cluster.sh` で topology + vtctld + vtgate + vttablet (commerce keyspace) が立ち上がる。前提として `mysqld`/`mysql` と Vitess バイナリ (`make build` 後 `PATH` 通す) が必要。`examples/local/README.md:12`。
- 運用操作は `vtctldclient` 経由。例: `vtctldclient MoveTables --workflow commerce2customer --target-keyspace customer create --source-keyspace commerce --tables "customer,corder"` (`examples/local/README.md:22`)、リシャードは `vtctldclient Reshard ... --source-shards '0' --target-shards '-80,80-' create` (`README.md:40`)。
- Kubernetes は vitess-operator + `examples/operator/101_initial_cluster.yaml`。
- ガバナンス: `GOVERNANCE.md` / `STEERING.md` / `MAINTAINERS.md` がリポジトリにあり、CNCF 卒業要件の透明なガバナンスと guiding principles を満たす (`GUIDING_PRINCIPLES.md`)。
