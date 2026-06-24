# CubeFS

> メタデータとデータを分離し、ボリュームごとにレプリカ複製とイレイジャーコーディングを選べる分散ファイル/オブジェクトストレージ。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cubefs/cubefs](https://github.com/cubefs/cubefs)
- **ドキュメント基準コミット**: `6b2e792` (master, 2026-06-22)

## 何をするものか

CubeFS は、同じデータを POSIX (FUSE)・S3・HDFS 互換インタフェースで公開する分散ストレージシステムです。責務を小さなロールに分割します。inode やディレクトリエントリといったメタデータは MetaNode のメモリ上に置き、ファイルの実データは DataNode 上の extent に置き、クラスタ構成は別のリソース管理ノード (Master) が追跡します。単一の `cfs-server` バイナリが、config の `role` キーに応じてこれらのいずれかのロールになります (`cmd/cmd.go:184`, `cmd/cmd.go:206-239`)。

設計上の狙いはコンテナ基盤での compute と storage の分離です。原典の SIGMOD 2019 論文は、CubeFS (当時 ChubaoFS) を JD.com の大規模コンテナ環境のバックエンドストレージとして説明しています。compute Pod はステートレスを保ち、耐久性のある状態はファイルシステム側に置きます (S7)。

ボリュームは 2 つのストレージエンジンのいずれかを選びます。multi-replica ボリュームは DataNode 間で強整合な chain 複製を使います。erasure-coded ボリュームはデータを BlobStore (`blobstore/`) に通し、超大規模で低コストにします。両エンジンは同じメタデータプレーンを共有します。

## いつ使うか

- 同じデータを POSIX・S3・HDFS インタフェースで提供する 1 つのシステムが欲しいとき。
- Kubernetes 上のステートフルワークロードで、ストレージを compute Pod から切り離したいとき。
- メタデータ負荷が高い (小ファイルが大量、stat や list が頻繁) ワークロードで、メタデータを RAM に保持できるとき。
- ホットデータにはレプリカ複製、コールドで容量重視のデータにはイレイジャーコーディングを、同一クラスタ内で使い分けたいとき。

向かないのは、小さな単一ノードで済ませたいとき、メタデータ総量が MetaNode の RAM を超えるとき、あるいはアプリが厳格な POSIX 整合性に依存するときです。CubeFS は性能のため POSIX セマンティクスを緩めています (S2)。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cubefs/cubefs リポジトリ (README, ADOPTERS, ソース)](https://github.com/cubefs/cubefs)
2. [CubeFS ドキュメント: introduction.md](https://github.com/cubefs/cubefs/blob/master/docs/source/overview/introduction.md)
3. [CNCF が CubeFS の卒業を発表](https://www.cncf.io/announcements/2025/01/21/cloud-native-computing-foundation-announces-cubefs-graduation/)
4. [CubeFS CNCF プロジェクトページ](https://www.cncf.io/projects/cubefs/)
5. [The New Stack: Cloud Native Computing Now Has Its Own File System](https://thenewstack.io/cloud-native-computing-now-has-its-own-file-system-cubefs/)
6. [SiliconANGLE: CubeFS graduates from CNCF incubation](https://siliconangle.com/2025/01/21/cubefs-storage-platform-graduates-cncf-incubation/)
7. [CFS: A Distributed File System for Large Scale Container Platforms (SIGMOD 2019)](https://dl.acm.org/doi/10.1145/3299869.3314046)
8. [arXiv 1911.03001 (論文プレプリント)](https://arxiv.org/abs/1911.03001)
9. [CubeFS セルフアセスメント (CNCF TAG Security)](https://tag-security.cncf.io/community/assessments/projects/cubefs/self-assessment/)
10. [cubefs/cubefs リリース v3.5.3](https://github.com/cubefs/cubefs/releases/tag/v3.5.3)
11. [InfoQ: CubeFS が CNCF を卒業](https://www.infoq.com/news/2025/03/cubefs-cncf-graduation/)
