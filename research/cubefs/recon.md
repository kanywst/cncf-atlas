# recon: CubeFS

調査メモ。出典は URL + `path:line`。captured 2026-06-22。

## 基本情報

- repo: `cubefs/cubefs` (主リポ。サブプロジェクトに `cubefs-csi`, `cubefs-helm` が別repoである (S1))
- pinned commit: `6b2e7926bec66d12fc037f03cd4b2ac680475448` (master, committed 2026-06-22)
- 近いタグ: master HEAD はタグ無し。直近リリースは `v3.5.3` (2025-12-23) (S10)。HEAD は v3.5.3 より先
- 言語 / ビルド: Go (go.mod `go 1.18`)。一部 CGO (libsdk / blobstore に cpp あり)。ビルドは `make build` (= server authtool client cli libsdk fsck fdstore bcache blobstore deploy)。`build/build.sh` 経由
- ライセンス: Apache-2.0 (確認済み。`LICENSE` 冒頭 "Apache License Version 2.0"、全 .go に Apache ヘッダ。`cmd/cmd.go:1-13`) (S1)
- CNCF 成熟度: Graduated (2024-12-11 TOC 承認 / 2025-01-21 公式発表) (S3)(S4)
- カテゴリ (tools.ts): Storage & Database

## サマリ (一言)

分散ファイル + オブジェクトストレージ。メタデータ(in-memory B-Tree)とデータ(extent)を分離し、レプリカ用途とイレイジャーコーディング用途で別エンジンを選べる。POSIX / S3 / HDFS 互換。compute と storage の分離が狙い。

## 歴史の素材

- 2017 年に JD.com (京东) 社内で誕生。当初名 ChubaoFS (CBFS, 中国語 "储宝" Chǔbǎo)。創設者/メンテナは Haifeng Liu (S5)(S6)
- 設計の原典: SIGMOD 2019 論文 "CFS: A Distributed File System for Large Scale Container Platforms" (Liu et al., DOI 10.1145/3299869.3314046, arXiv 1911.03001)。コンテナ基盤での compute/storage 分離が動機。Ceph 比でメタデータ操作 約3倍と主張 (S7)
- 2019-06 JD.com が ChubaoFS を CNCF へ寄贈。2019-12-16 Sandbox 受理 (S3)(S4)
- 2020-08 OPPO がプロモータ/コントリビュータとして参加 (S5)
- 2022-03 incubation 申請時に英語で発音しづらいとして ChubaoFS → CubeFS にリネーム。2022-07-03 Incubating 昇格 (S4)(S5)
- 2024-12-11 Graduated 承認、2025-01-21 公式アナウンス (S3)(S4)
- リネームの痕跡: バッジ url に `chubao-fs` / `clomonitor.io/projects/cncf/chubao-fs` が残る (`README.md` バッジ群)

## アーキテクチャの素材

4 サブシステム + α。単一バイナリ `cfs-server` を config の `role` で起動し分ける。

- ロール分岐: `cmd/cmd.go:71-93` (RoleMaster/RoleMeta/RoleData/RoleObject/RoleAuth/RoleConsole/RoleLifeCycle/RoleFlash/RoleFlashGroupManager)。`cmd/cmd.go:206-239` の switch で各 `NewServer()` を生成し `common.Server` インタフェースで起動
- Master (`master/`): リソース管理ノード。クラスタ/ボリューム/データパーティション/メタパーティションのメタ管理。`master/cluster.go:141` `type Cluster`, `master/vol.go:142` `type Vol`, `master/data_partition.go:34`, `master/meta_partition.go:54`。Master 自身も raft で多重化
- MetaNode (`metanode/`): ファイルのメタデータ(inode/dentry)を全て in-memory に保持。partition 単位で multiraft 複製
- DataNode (`datanode/`): 実データを extent (ローカルファイル) に格納。data partition 単位、プライマリ-バックアップ chain 複製
- ObjectNode (`objectnode/`): S3 互換ゲートウェイ
- BlobStore (`blobstore/`): イレイジャーコーディング(EC)エンジン。clustermgr / blobnode / access / proxy / scheduler / shardnode のサブモジュール群。低コスト・超大規模(EB)向け
- 補助ロール: AuthNode (認証), Console (Web UI), lcnode (ライフサイクル), flashnode + flashgroupmanager (分散キャッシュ)
- クライアント: `client/` (FUSE), `sdk/` (Go SDK), `java/` (libcubefs)
- 2 エンジン: multi-replica (強整合レプリケーション) と erasure coding (blobstore)。volume 単位で選択 (S1)

## 内部実装の素材: 書き込みパスを end-to-end で追う

代表操作 = ファイル append write。クライアント SDK からプライマリ DataNode、そして follower への chain 複製まで。

1. `sdk/data/stream/stream_writer.go:355` `(*Streamer).write`。`s.extents.PrepareWriteRequests(offset,size,data)` で書き込みを extent 単位リクエストに分解 (`:381`)。overwrite は既存 ExtentKey があり seq 一致なら `doOverwrite` (`:422`)、append は ExtentKey==nil で `doWriteAppend` (`:458`)。overwrite 前に必ず flush する設計 (`:386-404`)
2. データは `ExtentHandler` にバッファされ packet 化される。`sdk/data/stream/extent_handler.go:231` `(*ExtentHandler).write`。tiny extent は小ファイル集約用 (`:240` `tinySizeLimit`)、それ以外は `util.BlockSize` 単位。`NewWritePacket` でパケット生成 (`:260`)、満杯で `flushPacket()` (`:276-278`)
3. 送信は専用 goroutine。`extent_handler.go:292` `(*ExtentHandler).sender`。`eh.allocateExtent()` で dp/extent 未割当なら割当 (`:308`)。パケットに dp 情報を詰める: `packet.PartitionID`, `packet.Arg = eh.dp.GetAllAddrs()` (= 全レプリカアドレス、`:338`)、`packet.RemainingFollowers = len(Hosts)-1` (`:340`)。`packet.writeToConn(eh.conn)` でプライマリ DataNode へ (`:350`)。応答は `receiver()` goroutine が `processReply` で処理 (`:366-376`)
4. DataNode 受信側。`datanode/repl/repl_protocol.go:334` `OperatorAndForwardPktGoRoutine`。forward が必要なパケットは `sendRequestToAllFollowers` で全 follower に転送してからローカル処理 (`:342-349`)。follower への転送時は `followerRequest.RemainingFollowers = 0` にして無限転送を防ぐ (`repl_protocol.go:318-322`)。これがプライマリ-バックアップ chain 複製
5. ローカル書き込み。`datanode/wrap_operator.go:912` `(*DataNode).handleWritePacket`。forbidden/repairing/容量チェック後 (`:927-952`)、`store := partition.ExtentStore()` (`:953`)。tiny extent と通常を分岐し `storage.WriteParam{WriteType: AppendWriteType, ...}` を組んで `store.Write(param)` (`datanode/storage/extent_store.go:665`)。実 extent への書き込みは `datanode/storage/extent.go:499` `(*Extent).Write`。ディスク I/O は `partition.disk.tryDiskLimit` でレート制限 (`:959`)
6. メタ反映: 書き込み完了後クライアントは確定した ExtentKey を MetaNode に登録し、inode の `SortedExtents` に追加する (`metanode/inode.go:111` `GetExtents`)。これにより「データは DataNode、その位置(ExtentKey)は MetaNode の inode」という分離が成立

ポイント: クライアントが全レプリカアドレスを `packet.Arg` に載せ、プライマリが follower へ chain 転送する。Master はデータパスに介在しない (data partition の host 一覧を配るだけ)。

## 中核データ構造 (3-5 個)

- `proto/extent_key.go:58` `type ExtentKey`: ファイル内の論理位置とデータの物理位置を繋ぐ鍵。`FileOffset` / `PartitionId` / `ExtentId` / `ExtentOffset` / `Size` / `CRC` / `SnapInfo`。全体のアドレッシングの中心
- `metanode/inode.go:78` `type Inode`: in-memory inode。`Size/Generation/*Time/Type/Uid/Gid/NLink/StorageClass` に加え `HybridCloudExtents *SortedHybridCloudExtents` でこの inode に属する ExtentKey 群を保持。`StorageClass` でレプリカ/blobstore/ハイブリッドクラウドを切替
- `metanode/dentry.go:53` `type Dentry`: ディレクトリエントリ。`ParentId` / `Name` / `Inode` / `Type`。`(ParentId, Name)` で子を引く
- `metanode/partition.go:484` `type metaPartition`: `inodeTree *BTree` (`:490`) と `dentryTree *BTree` (`:489`) の 2 本の B-Tree。`metanode/btree.go:31-33` で Google `btree.BTree` を RWMutex 包む薄ラッパ。メタは全部メモリ常駐で B-Tree 索引
- `datanode/partition.go:102` `type DataPartition` / `master/cluster.go:141` `type Cluster`: それぞれ DataNode 側のデータパーティション実体、Master 側の全体台帳

## 非自明な設計判断

メタデータを完全 in-memory の 2 本の B-Tree (inodeBTree + dentryBTree) で持つ (`metanode/partition.go:489-490`)。耐久性は raft ログ + 定期 snapshot で確保し、永続ストアは索引のソースではない。狙いはメタ操作のレイテンシ削減 (SIGMOD 論文で Ceph 比 約3倍を主張 (S7))。さらに SIGMOD 論文いわく、メタデータ配置はノードのメモリ使用量ベースで分散させるので容量拡張時の data rebalancing が不要。代償としてメタの容量はノード RAM に律速され、POSIX セマンティクスを緩めて(relaxed consistency)整合コストを下げている (`docs/source/overview/introduction.md` の POSIX compatible 節)。

もう一つの非自明点: 小ファイルを TinyExtent に集約する二層 extent (`extent_handler.go:240` の `tinySizeLimit` 分岐)。大量の小ファイルで extent/メタが爆発するのを防ぐ。

## 採用事例の素材 (出典付きのみ)

リポジトリ `ADOPTERS.md` に production/testing 区分つきで列挙 (捏造でなく一次情報)。

- JD.com: 2018 から本番。3000+ 業務、50+ PB、5000+ サーバ。広告/検索/AI 学習基盤等 (`ADOPTERS.md`)
- OPPO: Kubernetes ベース AI プラットフォームのバックエンドストレージ (`ADOPTERS.md`)
- NetEase (网易): Elasticsearch のバックエンド、2+ PB (`ADOPTERS.md`)
- Meizu / BEIKE / LinkSure / Reconova / BIGO / Vipshop: production 記載あり (`ADOPTERS.md`)
- Xiaomi, Shopee (shoppe), CreditEase, TD Tech ほか production/testing テーブルに記載 (`ADOPTERS.md`)
- CNCF 発表値: 200+ 組織が利用、350 PB 管理 (2025-01 時点) (S3)(S4)

## 採用規模 / コミュニティ数値 (日付つき)

- GitHub stars 5,593 / forks 703 (gh api, 2026-06-22)
- GitHub contributors API: 最終ページ 127 (= GitHub アカウント紐付きコントリビュータ約 127 人, 2026-06-22)。CNCF は別集計で「27 人→379 人 across 42 社」「contributions 1,112→16,845」と報告 (S3)(S4)
- adopters: CNCF いわく Sandbox 以降 10→200 組織 (1,900% 増) (S3)
- 最新リリース v3.5.3 (2025-12-23) (S10)

## 代替・エコシステム

- 直接の比較対象: Ceph (CephFS/RADOS)。SIGMOD 論文が明示的に Ceph と比較 (S7)。他に MinIO (S3 オブジェクト特化), JuiceFS (メタを外部 DB に置く POSIX FS), Alluxio (キャッシュ層), HDFS (CubeFS は HDFS 互換 API を提供し置換を狙う)
- 本質的な差: (1) ファイル + オブジェクトを 1 システムで、replica と EC の 2 エンジンを volume 単位で選べる。(2) メタを in-memory B-Tree で持ちメモリ使用量ベースで配置、容量拡張時 rebalance 不要。(3) Master がデータパスに介在しない
- 統合: CSI ドライバ `cubefs/cubefs-csi`、Helm chart `cubefs/cubefs-helm` (サブプロジェクト (S1))。S3 SDK / Hadoop FileSystem / POSIX(FUSE) クライアント。Prometheus exporter (`util/exporter`)

## インストール / 最小構成

- ソースビルド: `make` または `make build` (要 Go 1.18+, CGO 用 gcc)。成果物は `cfs-server`, `cfs-client`, `cfs-cli` 等
- 最小起動 (推奨): `./docker/run_docker.sh -r -d /path/to/disk`。master+metanode+datanode+objectnode+client+monitor 一式を docker-compose で立ち上げる (`docker/run_docker.sh:11-29`, `docker/docker-compose.yml`)。要 10GB+ の空きディスク (`MIN_DNDISK_AVAIL_SIZE_GB=10`, `run_docker.sh:6`)
- 個別起動: `cfs-server -c master.json` のように role を config で指定 (`cmd/cmd.go:184` `role` キー)
- K8s 本番: `cubefs-helm` + `cubefs-csi` (S1)
