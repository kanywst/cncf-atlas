# Permify

> PostgreSQL に格納したリレーションタプルに対し、きめ細かなアクセス判定を解決する Google Zanzibar 系の認可エンジン。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Independent
- **言語**: Go
- **ライセンス**: AGPL-3.0
- **リポジトリ**: [Permify/permify](https://github.com/Permify/permify)
- **ドキュメント基準コミット**: `aa3a7c6` (2026-06-18、`v1.7.1` より後)

## 何をするものか

Permify は Google の Zanzibar 論文をモデルにした認可サービス。Google が論文で記述したが公開しなかった社内認可システムを下敷きにしている。スキーマを独自 DSL で定義し、エンティティ間の関係をリレーションタプルとして格納し、「user 3 は document 12 を閲覧できるか」といった許可の問いをエンジンに投げる。エンジンはスキーマの木をたどり、格納データに対して関係を再帰的に解決して答える。

スキーマは RBAC・ReBAC・ABAC を 1 つの言語で表現する。リレーションと権限の rewrite がロールベースと関係ベースのモデルを、属性と CEL ルールが属性ベースの判定を、同じ `Check` 呼び出しの中でカバーする。Permify は gRPC と REST の両 API を公開し、単体コンテナとして動く。永続化の本命は PostgreSQL で、開発用に in-memory ストアもある。

位置づけはアプリケーションとデータの間。アプリは認可の書き込み (リレーション、属性) と認可の読み取り (`Check`、`Expand`、`LookupEntity`、`LookupSubject`) を Permify に送り、アクセスロジックをアプリコードや SQL に埋め込まない。

## いつ使うか

- 各サービスでアドホックに判定するのではなく、複数サービスで共有する集中型のきめ細かな認可が必要。
- アクセスモデルが関係中心 (所有、階層、グループメンバーシップ) で、静的なロール表では足りない。
- RBAC・ReBAC・ABAC を 1 つのスキーマ・1 つの判定パスで扱いたい。
- すでに PostgreSQL を運用していて、認可データの整合性アンカーをそれに任せてよい。

向かない場合:

- クローズドソースのネットワークサービスに組み込むために寛容なライセンスが必要なとき。Permify は AGPL-3.0 で、copyleft はネットワーク経由の提供にも及ぶ。
- 幅広いデータストア (MySQL、CockroachDB、Spanner) や、最も Zanzibar 忠実なリクエスト単位の整合性調整が欲しいとき。それは SpiceDB が向く。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. Show HN: Permify, open-source authorization service based on Google Zanzibar (2022): <https://news.ycombinator.com/item?id=32096610>
2. Show HN: Permify 1.0 (2024): <https://news.ycombinator.com/item?id=41311489>
3. FusionAuth Acquires Permify, Unifying AuthN + AuthZ: <https://fusionauth.io/blog/fusionauth-permify-pr>
4. An Exciting New Chapter: Permify Joins FusionAuth: <https://permify.co/post/fusionauth-acquires-permify/>
5. Top 5 Google Zanzibar open-source implementations (WorkOS): <https://workos.com/blog/top-5-google-zanzibar-open-source-implementations-in-2024>
6. OpenFGA vs Permify vs SpiceDB (PkgPulse): <https://www.pkgpulse.com/guides/openfga-vs-permify-vs-spicedb-zanzibar-authorization-2026>
7. Permify/permify GitHub リポジトリ: <https://github.com/Permify/permify>
