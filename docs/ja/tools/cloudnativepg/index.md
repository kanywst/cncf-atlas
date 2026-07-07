# CloudNativePG

> Kubernetes 上で PostgreSQL を高可用に運用する operator。etcd や Patroni のような外部ツールではなく、Kubernetes API 自体を合意ストアとして使う。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [cloudnative-pg/cloudnative-pg](https://github.com/cloudnative-pg/cloudnative-pg)
- **ドキュメント基準コミット**: `7ef33bb` (2026-06-26, `main`)

## 何をするものか

CloudNativePG は PostgreSQL のための Kubernetes operator。欲しいデータベースを `Cluster` カスタムリソースで宣言すると (インスタンス数、ストレージサイズ、PostgreSQL 設定、バックアップポリシー)、operator がそれを動かす Pod・Service・Secret・ボリュームを生成して維持する。ブートストラップ、フェイルオーバー、スイッチオーバー、ローリング更新、バックアップ、リカバリまでライフサイクル全体をカバーする。

最大の設計上の選択は、外部 DCS (Distributed Configuration Store、分散構成ストア) に依存しない点だ。多くの PostgreSQL 高可用スタックは、primary を選出するために etcd・Consul・ZooKeeper を裏に持つ Patroni や repmgr を使う。CloudNativePG はその代わりに Kubernetes API サーバを唯一の真実の源として扱う。operator が `Cluster` リソースを watch し、各 Pod 内で動く instance manager というエージェントも同じリソースを watch するので、クラスタの状態とデータベースのトポロジが 1 か所に集約される。

プロジェクトは EDB (EnterpriseDB) のプロプライエタリ製品として始まり、2022 年にベンダー中立なコミュニティへ OSS 化・寄贈され、2025 年 1 月に CNCF Sandbox 入りした。controller-runtime を土台に Go で書かれている。

## いつ使うか

- Kubernetes 上で PostgreSQL を動かし、リーダー選出のために別途 etcd や Consul クラスタを運用せずに宣言的な高可用性が欲しいとき。
- イメージを digest 固定した、使い捨て可能でイミュータブルな DB Pod と、自動ローリング更新が欲しいとき。
- オブジェクトストレージ (S3 互換) への統合バックアップと PITR (point-in-time recovery、特定時点復旧)、そして標準で出力される Prometheus メトリクスが欲しいとき。
- 単一ベンダーの商用製品に紐づいた operator ではなく、CNCF のベンダー中立な operator が欲しいとき。

向かない状況:

- PostgreSQL 以外の DB エンジンが必要、あるいは Kubernetes 外で PostgreSQL を動かしているとき。
- マルチプライマリの書き込みスケールが必要なとき。CloudNativePG は読み取りレプリカを伴う単一プライマリであり、アクティブ-アクティブ構成ではない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cloudnative-pg/cloudnative-pg リポジトリ (README・ソース)](https://github.com/cloudnative-pg/cloudnative-pg)
2. [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md)
3. [Introducing CloudNativePG (EDB)](https://www.enterprisedb.com/blog/introducing-cloudnativepg-new-open-source-kubernetes-operator-postgres)
4. [CloudNativePG Officially Joins the CNCF Sandbox (EDB)](https://www.enterprisedb.com/blog/cloudnativepg-officially-joins-cncf-sandbox-milestone-cloud-native-postgresql)
5. [cncf/sandbox issue #128 (Sandbox 申請)](https://github.com/cncf/sandbox/issues/128)
6. [CloudNativePG 公式ドキュメント](https://cloudnative-pg.io/documentation/)
