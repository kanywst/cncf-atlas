# recon: etcd

調査メモ。pinned commit に対して検証済み。出典は `sources.md` の番号と対応。

## 基本情報

- repo: `etcd-io/etcd` (<https://github.com/etcd-io/etcd>)
- pinned commit: `61d518f55effaf5edcedcb2a696504795b4fa7bd` (2026-06-19, main)
- 近いタグ: `v3.8.0-alpha.0` (HEAD はそこから 50 commits ahead / 0 behind。GitHub compare API で確認)。最新安定版は 3.6.x、3.7 系は rc
- 言語 / ビルド: Go (go.mod は `go 1.26` / `toolchain go1.26.4`、`go.mod:1-4`)。`make build` → `scripts/build.sh` が `bin/etcd` `bin/etcdctl` `bin/etcdutl` を生成。マルチモジュール構成 (`go.work`)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭 + GitHub API `spdx_id=Apache-2.0` で確認)
- CNCF 成熟度: Graduated (2020-11-24)
- カテゴリ (CATEGORY_ORDER から): Storage & Database
- main entrypoint: `server/main.go` → `server/etcdmain/main.go`

備考: landscape 上の指定カテゴリは "Service Mesh & Networking" だったが、実体は分散 KVS なので Storage & Database にマップした。

## リポジトリ規模

- Go ファイル数 (概算): `server` 391, `tests` 265, `client` 194, `pkg` 87, `etcdctl` 41, `etcdutl` 20, `api` 22
- stars 51,872 / forks 10,394 / open issues 266 (GitHub API, 2026-06-22 取得)
- contributors: `contributors?per_page=1&anon=true` の last page が 1179 → 1,000 人超のオーダー

## 歴史の素材

- 2013-06-06 CoreOS で初コミット (作者 Xiang Li)。Brandon Philips / Alex Polvi / Xiang Li が Google Chubby / Apache ZooKeeper を検討し、用途に合わず自作。設計は Chubby 論文ベース (出典1, 出典2)
- 名前は Unix の `/etc` + distributed の `d`。単一マシンの設定置き場を分散システム向けにした含意 (出典2)
- 2015-01-28 v2.0.0 (最初の安定版)、2016-06-30 v3.0.0 (gRPC + MVCC バックエンドへ刷新) (出典2)
- Kubernetes がプライマリ KVS に採用したことで利用が一気に拡大 (出典2)
- 2018 CoreOS が Red Hat に買収。同年 CNCF へ寄贈。2018-12-11 Incubating として受理 (出典2, 出典3)
- 2020-11-24 CNCF Graduated。卒業時の maintainer は 10 名、Alibaba / Amazon / Cockroach Labs / Google Cloud / IBM / Indeed / Red Hat 等が分散 (出典1, 出典3)

## アーキテクチャの素材

トップレベル (commit pin 時点):

- `server/etcdserver` … コアの状態機械。クライアント API、raft ループ、apply ループ、メンバーシップ
- `server/storage/{mvcc,backend,wal,schema,datadir}` … MVCC ストア / bbolt バックエンド / WAL / スキーマ
- `server/lease` … lease (TTL) 管理 (lessor)
- `server/auth` … RBAC 認証ストア
- `server/embed` … 組み込み用ラッパ。`server/etcdmain` が CLI として起動
- `api` … protobuf / gRPC 定義 (`go.etcd.io/etcd/api/v3`)
- `client` … Go クライアント (`clientv3`)。`etcdctl` / `etcdutl` は CLI
- raft 本体は別モジュール `go.etcd.io/raft/v3 v3.7.0-rc.1` に切り出し済み (`go.mod:37`)

### 代表オペレーションの追跡: クライアント Put の end-to-end

1. gRPC ハンドラ: `server/etcdserver/api/v3rpc/key.go:90` `kvServer.Put` → `checkPutRequest` → `s.kv.Put(ctx, r)`
2. `server/etcdserver/v3_server.go:295` `EtcdServer.Put` → `s.raftRequest(ctx, &pb.InternalRaftRequest{Put: r})` (`:303`)
3. `v3_server.go:1012` `raftRequest` → `:1058` `processInternalRaftRequestOnce`: req ID 採番、`proto.Marshal`、`MaxRequestBytes` チェック、`ch := s.w.Register(id)` (`:1106`)、`s.r.Propose(cctx, data)` (`:1113`)。以降は wait channel をブロックして待つ (`:1122-1132`)
4. raft 合意 (外部 `go.etcd.io/raft/v3`) が log を複製。commit 済み entry が apply ループへ戻る
5. apply: `server/etcdserver/server.go:1934` `applyEntryNormal` → `apply.Apply(...)` (`:1959`) → 成功時 `s.w.Trigger(id, ar)` (`:1971`) で 3 のブロックを解除して応答
6. dispatch: `server/etcdserver/apply/uber_applier.go:93` `dispatch` → `case r.Put != nil` (`:134`) → `a.applyV3.Put(r.Put)`。applier は corrupt→capped→quota→auth→backend のチェーン (`uber_applier.go:85-87` のコメント)
7. `server/etcdserver/apply/backend.go:50` `applierV3backend.Put` → `mvcctxn.Put(...)`
8. `server/etcdserver/txn/put.go:30` `Put` → `checkLease` → `kv.Write(trace)` で write txn 開始 → `checkAndGetPrevKV` → `put` (`:48`) → `txnWrite.Put(p.Key, val, leaseID)` (`:66`)
9. `server/storage/mvcc/kvstore_txn.go:204` `storeTxnWrite.Put` → `put` (`:223`): `kvindex.Get` で前回 created rev 取得 (`:230`)、`mvccpb.KeyValue` を marshal、`tx.UnsafeSeqPut(schema.Key, ibytes, d)` で bolt へ (`:259`)、`kvindex.Put(key, idxRev)` で in-memory index 更新 (`:260`)
10. `kvstore_txn.go:209` `End`: 変更があれば `tw.s.currentRev++` (`:214`) して txn コミット

ポイント: 書き込みは必ず raft を通る (linearizable)。読みは `Range` がシリアライザブル読みなら raft を経由せずローカル mvcc を引ける (`v3_server.go:1034` `doSerialize`)。

## 内部実装の素材

中核データ構造:

- `store` (`server/storage/mvcc/kvstore.go:53`): MVCC ストア本体。`b backend.Backend` / `kvindex index` / `currentRev` / `compactMainRev` / `le lease.Lessor` を持つ
- `treeIndex` (`server/storage/mvcc/index.go:39`): ユーザキー → `keyIndex` の in-memory B-tree。永続化されない二次索引
- `keyIndex` (`server/storage/mvcc/key_index.go:73`): 1 キーごとの `generations []generation` (revision の世代リスト)。compaction の単位
- `backend` (`server/storage/backend/backend.go:92`): bbolt ラッパ。永続ストアは revision バイト列をキーにする
- `raftNode` (`server/etcdserver/raft.go:81`): `raft.Node` / transport / ticker をまとめる
- `lessor` (`server/lease/lessor.go:145`): lease の TTL 失効を管理
- `watchableStore` (`server/storage/mvcc/watchable_store.go:56`): `store` に watch を載せた層

非自明な設計判断:

- 永続バックエンド (bbolt) は **ユーザキーではなく revision をキーに格納する**。ユーザキー → revision の対応は in-memory `treeIndex` だけが持つ。読みは「キー → treeIndex で revision 解決 → bolt から revision で値取得」の 2 段。これが MVCC・過去 revision からの watch・compaction を成立させる土台で、再起動時に index を bolt から再構築する理由でもある。二重書きは `kvstore_txn.go:259-260` に明示 (`UnsafeSeqPut` が bolt、`kvindex.Put` が index)
- raft を独立モジュール `go.etcd.io/raft/v3` に分離 (`go.mod:37`)。etcd 以外 (CockroachDB 等) からも使われる汎用ライブラリ化
- consistent index を backend に保存して apply の重複を防ぐ。`applyEntryNormal` の defer で `consistIndex` を entry index まで前進させる (`server/etcdserver/server.go:1939-1942`)
- apply は decorator チェーン。`uber_applier.go:85-87` がチェーン順をコメントで説明

## 採用事例の素材 (出典付きのみ)

- 全 Kubernetes ユーザ (K8s のコントロールプレーン KVS が etcd)。`ADOPTERS.md` 冒頭 "All Kubernetes Users" (出典7)
- `ADOPTERS.md` 記載組織: Huawei, Tencent Games, Salesforce.com, Yandex, Baidu Waimai, Grab, DaoCloud, Vonage, OpenTable, PingCAP (PD), Qiniu Cloud, QingCloud, Meitu ほか多数 (出典7)
- CNCF Project Journey Report (2021): 2018 年寄贈〜卒業の成長を数値で記録 (出典4)

数値 (2026-06-22 GitHub API): stars 51,872 / forks 10,394 / contributors 1,000+。CoreOS 系がコントリビュート最多、Google が次点という分布 (出典1, GitHub API)

## 代替・エコシステム

- 直接の比較対象: Apache ZooKeeper (ZAB 合意 + 階層 znode)、HashiCorp Consul (KV + サービスディスカバリ + ヘルスチェック)、Google Chubby (非 OSS、設計上の祖先)
- etcd の差別化: gRPC API + MVCC + watch (revision 指定の履歴購読) + lease、Raft によるシンプルな線形化一貫性、K8s デファクトという運用エコシステムの厚み
- raft ライブラリ `go.etcd.io/raft` は CockroachDB / TiKV (派生) など外部でも利用
- 周辺: `clientv3` (Go)、各言語の gRPC バインディング、`etcdctl`/`etcdutl` CLI、Kubernetes、Prometheus メトリクス連携、bbolt (バックエンド)

## install / 最小構成

バイナリ取得して `etcd` を起動、`etcdctl` で put/get するだけで動く (出典5, 出典6, 出典7)。

```bash
ETCD_VER=v3.6.0
wget https://github.com/etcd-io/etcd/releases/download/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz
tar xzf etcd-${ETCD_VER}-linux-amd64.tar.gz
sudo mv etcd-${ETCD_VER}-linux-amd64/etcd* /usr/local/bin/
etcd --version && etcdctl version
```

```bash
etcd &                              # クライアント 2379 / peer 2380
etcdctl put greeting "Hello, etcd"  # OK
etcdctl get greeting                # greeting / Hello, etcd
```

コンテナは `gcr.io/etcd-development/etcd` (primary) / `quay.io/coreos/etcd` (secondary) (出典7)。
