# SpiceDB

> 「この主体はあの資源に対してこの操作ができるか?」を、関係のグラフを辿って答える Google Zanzibar 由来のデータベース。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Independent
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [authzed/spicedb](https://github.com/authzed/spicedb)
- **ドキュメント基準コミット**: `4bb1d7b3` (2026-06-19)

## 何をするものか

SpiceDB は、Google が 2019 年に公開した Zanzibar 論文の認可システムを実装したオープンソースである。権限をフラットなアクセス制御リストとして保存するのではなく、オブジェクト間の関係 (例: `document:budget#viewer@user:anne`) を保存し、その関係から権限を導出するスキーマを定義する。アクセス判定を行うときは、静的なルールを評価するのではなく関係のグラフを辿る。

gRPC と HTTP の API を公開するサーバとして動作する。クライアントはスキーマを書き、関係を書き、`CheckPermission` のような権限の問い合わせを行う。関係データは差し替え可能なデータストアに保存される: PostgreSQL、MySQL、CockroachDB、Google Spanner、または開発用のインメモリストア。

SpiceDB は AuthZed が開発・保守している。アプリケーションスタックの認可レイヤに位置し、データを所有するサービスが SpiceDB を呼んで各オブジェクトの閲覧・変更可否を判定することで、認可ロジックをアプリケーションのデータベースから切り離す。

## いつ使うか

- 関係ベースのアクセス制御 (ReBAC) が必要なとき: 固定のロール表ではなく、所有関係・グループ所属・フォルダ階層を辿る権限が要るとき。
- サービス間で一貫性保証が欲しいとき。ZedToken を使い、権限取り消し後に古い読み取りがデータを漏らす「New Enemy 問題」を避けられる。
- 複数のアプリケーションが共有する単一の認可サービスを、特定のアプリケーション DB から切り離して持ちたいとき。
- 向かないのは、必要なのが小さな固定ロール集合のとき (より単純な RBAC ライブラリで十分)、または関係グラフを伴わない純粋な属性ポリシー評価のとき (OPA のようなポリシーエンジンが適する)。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [authzed/spicedb (GitHub)](https://github.com/authzed/spicedb)
2. [authzed/spicedb GitHub REST API](https://api.github.com/repos/authzed/spicedb)
3. [Starlet #17 SpiceDB (star-history)](https://www.star-history.com/blog/spicedb/)
4. [SpiceDB, the Google Zanzibar open source solution (AuthZed)](https://authzed.com/blog/spicedb-is-open-source-zanzibar)
5. [Google Zanzibar (AuthZed Docs)](https://authzed.com/docs/spicedb/concepts/zanzibar)
6. [Top 5 Google Zanzibar open-source implementations in 2024 (WorkOS)](https://workos.com/blog/top-5-google-zanzibar-open-source-implementations-in-2024)
7. [Alternatives to OpenFGA (AuthZed)](https://authzed.com/learn/openfga-alternatives)
8. [Top Alternatives to SpiceDB (Oso)](https://www.osohq.com/learn/spicedb-alternatives-authorization-tools-comparison)
9. [Google Zanzibar vs OPA (Permit.io)](https://www.permit.io/blog/zanzibar-vs-opa)
10. [SpiceDB product page (AuthZed)](https://authzed.com/spicedb)
11. [spicedb/README.md](https://github.com/authzed/spicedb/blob/main/README.md)
