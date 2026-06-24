# etcd

> Raft を使い、小さく重要なデータセットをクラスタ全体で一貫させる分散キーバリューストア。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [etcd-io/etcd](https://github.com/etcd-io/etcd)
- **ドキュメント基準コミット**: `61d518f` (2026-06-19, main)

## 何をするものか

etcd は強整合なキーバリューストアです。すべての書き込みは Raft 合意プロトコルを通り、変更の順序についてクラスタの過半数が合意してから初めて応答されます。これにより線形化可能 (linearizable) な読み書きが得られ、分散システムが依存する設定・協調データに適しています。

ストアはマルチバージョン並行制御 (MVCC) でデータを保持します。各変更はその場で上書きせず新しい revision を作るため、クライアントは過去の revision を読み、指定 revision からのキー変更を watch し、不要になった古い履歴を compaction で削れます。ストアの上に etcd は lease (TTL で失効するキー)、ロールベースアクセス制御、gRPC API を載せています。

etcd は Kubernetes の主データストアとして最もよく知られ、クラスタ状態すべてを保持します。Go 製で、`etcd` サーバ、`etcdctl` クライアント、`etcdutl` 保守ツールの 3 バイナリで提供されます。

## いつ使うか

- 小さなデータセット (設定、リーダー選出、サービスディスカバリ、ロック) を数ノードに強整合で複製したいとき。
- キーを watch して変更に反応したい、または TTL ベースの lease で生存確認したいとき。
- Kubernetes を運用している、または信頼できる単一の真実が必要なコントロールプレーンを作るとき。

向かない場面:

- 汎用データベースではありません。データセットはメモリに収まり、ストレージクォータ内に収まる前提なので、大量のアプリデータや巨大な blob には向きません。
- 合意を必要としない書き込み中心のワークロードは、使わない複製コストを払うことになります。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [CNCF Announces etcd Graduation](https://www.cncf.io/announcements/2020/11/24/cloud-native-computing-foundation-announces-etcd-graduation/)
2. [etcd (Wikipedia)](https://en.wikipedia.org/wiki/Etcd)
3. [etcd (CNCF projects)](https://www.cncf.io/projects/etcd/)
4. [etcd Project Journey Report](https://www.cncf.io/reports/etcd-project-journey-report/)
5. [etcd Quickstart](https://etcd.io/docs/v3.6/quickstart/)
6. [etcd Install](https://etcd.io/docs/v3.6/install/)
7. [etcd-io/etcd (README, ADOPTERS.md, LICENSE)](https://github.com/etcd-io/etcd)
