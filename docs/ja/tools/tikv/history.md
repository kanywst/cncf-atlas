# 歴史

## 起源

TiKV は 2016 年、TiDB に分散ストレージバックエンドを補完するために PingCAP で始まった [4]。リポジトリは 2015-12-31 に作成された。設計は確立された論文の上に築かれている。データモデルと分散トランザクションは Google の BigTable・Spanner・Percolator に、コンセンサスは Raft 論文に依拠する [4]。ストレージエンジンを一から作り直すのではなく、TiKV は RocksDB の上に MVCC と Percolator の 2 フェーズコミットを重ね、Raft が複製を、別の Placement Driver がシャーディングとタイムスタンプ発行を担う。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | リポジトリ作成 (2015-12-31) [9] |
| 2016 | PingCAP で TiDB のストレージ層として開発開始 [4] |
| 2018 | CNCF Sandbox に受理 (2018-08-28) [3] |
| 2019 | TOC が Incubating への昇格を可決。投票は 2019-05-21 に公表 [5] [6] |
| 2020 | CNCF を卒業 (2020-09-02)。12 番目の卒業プロジェクト [1] [2] |

## どう進化したか

2020 年の卒業時点で、TiKV は本番採用がおよそ 1,000 社規模に倍増し、コアリポジトリのコントリビュータが 78 から 226 に増え、複数企業にまたがる 7 名のメンテナを擁すると報告した [1]。卒業プロセスの一環として、CNCF は Cure53 による第三者セキュリティ監査を出資し、2020 年 2〜3 月に実施された [1]。

その後の大きなアーキテクチャ変更が Raftstore v2 (partitioned-raft-kv とも呼ばれる) である。これは 1 つの RocksDB を共有する代わりに、各 Region に専用の RocksDB tablet を割り当てる。2 つのエンジンはコードベース上で共存する。`EngineType::RaftKv` が従来の単一 RocksDB 設計、`EngineType::RaftKv2` が分割版で、`cmd/tikv-server/src/main.rs:248` でランタイムに選択される。v2 のコードは `components/raftstore-v2` にある。トランザクション層と MVCC 層がストレージと話すのは `Engine` トレイト経由だけなので、同じトランザクションコードが両方で変更なしに動く。

## 現在地

執筆時点の最新安定リリースは `v8.5.6` (2026-04-14) で、`master` は `9.0.0-beta.2` に向けて開発中である [9]。ガバナンスは `tikv/community` リポジトリに記載され、メンテナは PingCAP・Zhihu・JD Cloud・Yidian Zixun を含む複数企業から構成される [1] [11]。主実装は `tikv/tikv` にあり、Placement Driver は `tikv/pd`、クライアントライブラリは `tikv/client-rust` など別リポジトリである。

## 出典

- [1] [Cloud Native Computing Foundation announces TiKV Graduation (CNCF)](https://www.cncf.io/announcements/2020/09/02/cloud-native-computing-foundation-announces-tikv-graduation/)
- [2] [Celebrating TiKV's CNCF Graduation (TiKV blog)](https://tikv.org/blog/graduation-announcement/)
- [3] [TiKV project page (CNCF)](https://www.cncf.io/projects/tikv/)
- [4] [tikv/tikv README](https://github.com/tikv/tikv)
- [5] [TOC votes to move TiKV into CNCF Incubator (CNCF)](https://www.cncf.io/blog/2019/05/21/toc-votes-to-move-tikv-into-cncf-incubator/)
- [6] [CNCF TOC votes to move TiKV to Incubating Status (TiKV blog)](https://tikv.org/blog/cncf-incubating/)
- [9] [tikv/tikv GitHub stats](https://github.com/tikv/tikv)
- [11] [TiKV Governance (tikv/community)](https://github.com/tikv/community/blob/master/GOVERNANCE.md)
