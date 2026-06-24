# TiKV

> 分散トランザクション対応のキーバリューストア。TiDB のようなシステムに、強整合性を保ったまま水平スケールするストレージ層を提供する。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Graduated
- **言語**: Rust
- **ライセンス**: Apache-2.0
- **リポジトリ**: [tikv/tikv](https://github.com/tikv/tikv)
- **ドキュメント基準コミット**: `2ce1174` (2026-06-22)

## 何をするものか

TiKV は Rust で書かれた分散キーバリューストアである。2016 年に PingCAP が TiDB のストレージ層として開発を始め、設計はデータモデルと分散トランザクションを Google の BigTable・Spanner・Percolator の論文に、コンセンサスを Raft 論文に依拠している。データは Region に分割され、Raft で複製され、RocksDB に永続化される。

生のキーバリュー層の上で、TiKV は Percolator 方式の 2 フェーズコミットによる分散 ACID トランザクションを実装する。トランザクション API (TxnKV) と raw API (RawKV) の両方を公開し、クライアントライブラリから直接使うことも、TiDB の SQL エンジンのバックエンドとして使うこともできる。シャーディング・リバランス・タイムスタンプ発行は別コンポーネントの Placement Driver (`tikv/pd`) が担う。

TiKV は SQL の下、ローカルディスクの上に位置する。コンセンサス・MVCC・トランザクションスケジューリング・ストレージを担い、クエリのパースとプランニングは TiDB のような上位層に委ねる。

## いつ使うか

- 強整合性を保ったまま単一マシンを超えて 100+ TB までスケールするキーバリューストアが必要なとき。
- キー単位の原子性だけでなく、複数キーにまたがる分散 ACID トランザクションが必要なとき。
- TiDB の上に構築する、あるいは `client-rust`・`client-go`・`client-java`・`client-python` 経由でトランザクション KV バックエンドに直接アクセスしたいとき。
- 単一ノードや小規模クラスタの etcd で十分な小さな構成データには向かない。
- そのまま SQL がほしいときには向かない。TiKV は KV 層であり、SQL は TiDB にある。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [Cloud Native Computing Foundation announces TiKV Graduation (CNCF)](https://www.cncf.io/announcements/2020/09/02/cloud-native-computing-foundation-announces-tikv-graduation/)
2. [Celebrating TiKV's CNCF Graduation (TiKV blog)](https://tikv.org/blog/graduation-announcement/)
3. [TiKV project page (CNCF)](https://www.cncf.io/projects/tikv/)
4. [tikv/tikv README](https://github.com/tikv/tikv)
5. [TOC votes to move TiKV into CNCF Incubator (CNCF)](https://www.cncf.io/blog/2019/05/21/toc-votes-to-move-tikv-into-cncf-incubator/)
6. [CNCF TOC votes to move TiKV to Incubating Status (TiKV blog)](https://tikv.org/blog/cncf-incubating/)
7. [TiKV Adopters](https://tikv.org/adopters/)
8. [Case study: TiKV in JD Cloud (CNCF)](https://www.cncf.io/blog/2019/11/26/case-study-tikv-in-jd-cloud/)
9. [tikv/tikv GitHub stats](https://github.com/tikv/tikv)
10. [TiKV Documentation](https://tikv.org/docs/latest/concepts/overview/)
11. [TiKV Governance (tikv/community)](https://github.com/tikv/community/blob/master/GOVERNANCE.md)
