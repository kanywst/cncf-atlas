# recon: TiKV

調査メモ。自分用の密度。出典は `sources.md` の番号を `[n]` で参照。コードは pinned commit に対する `file:line`。

## 基本情報

- repo: `tikv/tikv` (主実装リポジトリ。PD は `tikv/pd`、クライアントは `tikv/client-rust` 等の別リポジトリ)
- pinned commit: `2ce11742650d4dd1c87070a82f9ae816ec94d61c` (2026-06-22) / 近いタグ: `v9.0.0-beta.2.pre` (master は `9.0.0-beta.2` 開発中)。最新安定リリース: `v8.5.6` (2026-04-14) [9]
- 言語 / ビルド: Rust (edition 2021, nightly toolchain 固定) / `make build` (dev), `make release`。`cargo` 直叩きより Makefile 経由。protoc + cmake + C++ コンパイラ必須 (gRPC, RocksDB のため) [src `AGENTS.md`, `Cargo.toml:1-12`]
- ライセンス: Apache-2.0 (`LICENSE` は Apache License 2.0 全文、`Cargo.toml:6` も `license = "Apache-2.0"`)。検証済み
- CNCF 成熟度: Graduated (2020-09-02 卒業) [1] [2]
- カテゴリ (tools.ts CATEGORY_ORDER): Storage & Database
- 規模: Rust ソース約 1,315 ファイル (`find -name '*.rs' | wc -l`)、`/components/` 配下に 70+ クレートのワークスペース
- エントリポイント: `cmd/tikv-server/src/main.rs` (サーバ本体)、`cmd/tikv-ctl` (運用 CLI)

## 歴史の素材

- 2016 年に PingCAP が TiDB のストレージバックエンドを補完するために Rust で開発開始。設計は Google の BigTable / Spanner / Percolator と Raft 論文に着想 [src `README.md`] [4]。リポジトリ作成は 2015-12-31 [GitHub API]
- CNCF Sandbox 受理: 2018-08-28 [3 (CNCF project page)]
- CNCF Incubating 昇格: TOC 投票が 2019-05-21 に公表 (CNCF の卒業告知は "April 2019" 表記、TiKV ブログは "May 2019")。日付に出典間の揺れあり [5] [6]
- CNCF Graduated: 2020-09-02。Kubernetes, Jaeger, Harbor 等に続く 12 番目の卒業プロジェクト [1] [2]
- 卒業時の実績: 本番採用が約 1,000 社規模に倍増、コア repo のコントリビュータが 78 → 226 に増加、メンテナ 7 名。Cure53 による第三者セキュリティ監査を 2020 年 2〜3 月に CNCF 出資で実施 [1]
- 大きなアーキ変更: Raftstore v2 / partitioned-raft-kv (multi-rocksdb) の追加。`components/raftstore-v2`、`src/storage/config.rs` の `EngineType::{RaftKv, RaftKv2}` として共存 (`main.rs:248-253`)

## アーキテクチャの素材

トップレベル構成 (src `AGENTS.md` のコードマップと一致を確認):

- `src/server/` : gRPC サーバ、接続処理、`Service` 実装。クライアント (TiDB / client-rust) との境界
- `src/storage/` : トランザクション + MVCC ストレージ層。Percolator 2PC の本体
- `src/storage/mvcc/`, `src/storage/txn/` : MVCC エンコード/デコードと txn コマンド処理 + スケジューラ
- `src/coprocessor/`, `src/coprocessor_v2/` : TiDB からの push-down 計算 (table/index scan, 集約)。HBase 風の coprocessor フレームワーク
- `components/raftstore/`, `raftstore-v2/` : Raft コンセンサスと Region 管理。peer / apply / store の fsm
- `components/engine_traits/` + `engine_rocks/` : ストレージエンジン抽象トレイトと RocksDB 実装。`engine_panic` 等のダミー実装で差し替え可能
- `components/pd_client/` : Placement Driver クライアント。auto-sharding / リバランス / TSO を PD に委譲
- `components/txn_types/` : `Key` / `Value` / `Lock` / `Write` / `TimeStamp` などトランザクション基本型
- `components/concurrency_manager` : インメモリのロックテーブルと `max_ts`。async-commit / 1PC の正しさを担保
- 周辺: `components/cdc` (Change Data Capture), `resolved_ts`, `backup` / `backup-stream` (PITR), `sst_importer` (一括取り込み), `encryption` (保存時暗号化)

データは 4 つの RocksDB Column Family に分かれる (`components/engine_traits/src/cf_defs.rs:4-7`):

- `default` : 実データ (長い値、`user_key{start_ts}` で格納)
- `lock` : Percolator のロック (未コミットトランザクション)
- `write` : コミット記録 (`user_key{commit_ts}` から `start_ts` ポインタ + 短い値)
- `raft` : Raft ログ / メタ (raft-engine 使用時はそちら)

### 代表操作のトレース: トランザクション read (`kv_get`)

ある `start_ts` でのスナップショット読み取りを端から端まで。1 ホップごとに `file:line`。

1. gRPC `kv_get` 受信。`handle_request!` マクロが `future_get` にディスパッチ (`src/server/service/kv.rs:339`)。`future_get` 実体は `src/server/service/kv.rs:1614`
2. `Storage::get` から `get_entry` (`src/storage/mod.rs:610`, `:625`)。read pool のスレッドへ spawn (`:662`)、deadline と API version をチェック (`:683-685`)
3. `prepare_snap_ctx` で `concurrency_manager` のインメモリロックを確認し、`bypass_locks` を考慮 (`src/storage/mod.rs:694-701`)。ここで `max_ts` 等の並行性制御が効く
4. エンジンからスナップショット取得 (`src/storage/mod.rs:702-703`)。`Engine` トレイト経由で `RaftKv::async_snapshot` (`src/server/raftkv/mod.rs:653`) に入り、LocalReader のリース読み / read-index で Raft リーダーの線形化可能読みを保証
5. `SnapshotStore::new(...).get_entry(...)` (`src/storage/mod.rs:713-723`)。内部は `PointGetter::get_entry` (`src/storage/mvcc/reader/point_getter.rs:188`)。MVCC ロジックで `write` CF を `commit_ts <= start_ts` で逆向きシークし、見つけた `start_ts` で `default` CF から実データを引く

### 代表操作のトレース: トランザクション write (`prewrite`)

書き込みは read pool ではなくスケジューラ経由 (Percolator の 2PC 前半):

1. `Storage::sched_txn_command` がコマンド種別ごとに API version / key size を検証 (`src/storage/mod.rs:1861`, Prewrite は `:1874`)
2. `TxnScheduler` (`src/storage/txn/scheduler.rs:422`) が key 単位の `Latches` を取得して同一 key の直列化を行う (`:404` で `latches.acquire`)。ラッチ取得後にコマンドを実行 (`TaskContext::execute` `:203`)
3. コマンドは `Modify` の集合を生成し、`Engine::async_write` で書く。`RaftKv::async_write` (`src/server/raftkv/mod.rs:503`) が `Modify` を `RaftCmdRequest` に変換 (`:578-582`)
4. `self.router.send_command(cmd, cb, extra_opts)` で raftstore に投げる (`src/server/raftkv/mod.rs:633` 付近)。ここから Raft の propose から多数派へ複製、commit、apply に進み、`applied_cb` でストレージ層へ完了通知

## 内部実装の素材

中核データ構造 (3〜5 個):

- `Lock` (`components/txn_types/src/lock.rs:87`) : Percolator ロック。`lock_type` / `primary` (主キー位置) / `ts` (start_ts) / `ttl` / `for_update_ts` (悲観ロック判定) / `use_async_commit` / `use_one_pc` / `secondaries` / `min_commit_ts`。`lock` CF に保存され、未コミットトランザクションの存在を示す
- `Write` (`components/txn_types/src/write.rs:71`) : `write` CF のコミット記録。`write_type` (Put/Delete/Lock/Rollback)、`start_ts`、短い値の埋め込み (`short_value`)、`has_overlapped_rollback` (Commit と Rollback が同 internal key で衝突する希少ケースの対処)
- `Storage<E, L, F>` (`src/storage/mod.rs:197`) : ストレージ層のファサード。`engine: E` / `sched: TxnScheduler` / `read_pool` / `concurrency_manager` を保持。型パラメータで Engine (RaftKv / RaftKv2)、LockManager、KvFormat (API v1/v2) を差し替える
- `TxnScheduler<E, L>` (`src/storage/txn/scheduler.rs:422`) : 走行中コマンドの追跡と `Latches` による key 単位の直列化。読みは read pool、書きはここを通す二系統
- Column Family 定数 (`components/engine_traits/src/cf_defs.rs:4-7`) : `default` / `lock` / `write` / `raft`。MVCC のデータレイアウトそのもの

非自明な設計判断:

- ストレージ層は `Engine` トレイト (`src/server/raftkv/mod.rs:438` の `impl Engine for RaftKv`) を介してのみ永続化する。同じトランザクション/MVCC コードが RaftKv (v1, 単一 RocksDB) と RaftKv2 (partitioned-raft-kv, Region ごとに tablet を分離) の両方で動く。`main.rs:248-253` が `EngineType` でランタイム分岐
- 読みは Raft ログを経由しない。`RaftKv::async_snapshot` は LocalReader のリース読み / read-index を使い、リーダーの線形化可能読みを保ちつつログ書き込みを避ける。書き (`async_write`) だけが Raft を通る非対称設計
- 値は短ければ `lock` / `write` CF に直接埋め込み (`short_value`)、長ければ `default` CF に `start_ts` をキーにして退避する。点読みで CF を 1 往復節約する最適化
- `concurrency_manager` のインメモリロックと `max_ts` が async-commit / 1PC の正しさの要。永続化されない `use_one_pc` フラグ (`lock.rs:98-101`) はこのためだけに存在し、1PC 失敗時は false に戻す
- `Write` の `has_overlapped_rollback` (`write.rs:84`) : commit 記録の上に保護付き rollback を書くと GC compaction filter と競合しうるため、別レコードではなく既存 commit 記録にフラグを立てる。分散 GC とのレースを避ける泥臭い実装

## 採用事例の素材

公式 adopters ページ [7] と CNCF ケーススタディ [8] に出典のあるもののみ:

- JD Cloud & AI : OSS (オブジェクトストレージ) メタデータを MySQL から TiKV へ移行。100 billion から 1 trillion 行規模を見込む。CNCF 詳細ケーススタディあり [8]
- Shopee (EC)、LY.com (旅行)、Zhuan Zhuan (マーケットプレイス)、Meituan-Dianping (フードデリバリー)、Ele.me : TiDB なしで TiKV 単体採用として adopters ページに記載 [7]
- Zhihu : TiDB と Zetta Table Store を TiKV 上に構築。MySQL のスケーラビリティ限界を解決とメンテナ Xiaoguang Sun のコメント [1] [7]
- U-Next : 2019-12 から ARM プラットフォーム上で TiKV を本番運用。COVID-19 期のトラフィック増に対応 (Birong Huang) [1]
- 規模感: CNCF 卒業告知時点で本番採用が約 1,000 社に倍増、コア repo コントリビュータ 78 → 226 [1]

採用シグナル (数値 + 取得日):

- GitHub stars 16,739 / forks 2,295 / contributors 約 389 (GitHub API, 2026-06-23 取得) [9]
- メンテナはマルチ企業構成 (PingCAP, Zhihu, JD Cloud, Yidian Zixun) [1]

## 代替・エコシステム

エコシステム / 統合先:

- TiDB : 最大の利用者。TiKV は TiDB の分散ストレージ層。coprocessor で計算 push-down [src `README.md`]
- PD (Placement Driver, `tikv/pd`) : auto-sharding、Region リバランス、TSO 発行を担う必須コンポーネント
- クライアント: `client-rust` / `client-go` / `client-java` / `client-python`。TiDB を介さず TxnKV / RawKV API を直接利用可能
- CDC / TiCDC : `components/cdc` + `resolved_ts` で変更データキャプチャ
- バックアップ: BR / `backup-stream` で PITR (Point-In-Time Recovery)

主な代替と本質的な差:

- etcd : 同じ Raft + KV だが etcd は小さな構成データ向け (数 GB)、TiKV は 100+ TB スケールと分散 ACID トランザクション (Percolator 2PC) が目的。用途が違う
- CockroachDB / YugabyteDB : 同じく Spanner/Percolator 系の分散トランザクション KV/SQL。CockroachDB は SQL 層まで一体、TiKV は KV 層に特化し SQL は TiDB に分離。MVCC レイアウトと CF 分割が TiKV 独自
- FoundationDB : 分散トランザクション KV だが決定的シミュレーションテストとレイヤ設計が中心。TiKV は Raft + RocksDB + PD の構成と coprocessor push-down が差別化
- Cassandra / ScyllaDB : 結果整合の wide-column。TiKV は強整合 + 分散トランザクションで対照的

## 検証コマンド (再現用)

- `git -C src rev-parse HEAD` から pinned commit
- `grep -n "pub struct Storage" src/src/storage/mod.rs` から `:197`
- `grep -rn "pub const CF_" src/components/engine_traits/src/cf_defs.rs` から CF 定義
