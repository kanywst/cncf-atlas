# 採用事例・エコシステム

## 誰が使っているか

リポジトリに ADOPTERS ファイルはなく、本番採用企業の検証可能な一次リストは確認できなかった。買収やベンダーの記事は P&G、Mastercard、HPE、Sennder などを顧客例に挙げるが、いずれも二次情報でリポジトリ内の裏付けがない (出典 1)。そのためここでは確定した採用企業として断定しない。最も信頼できる公開シグナルは下記の GitHub の活動量。

## 採用のシグナル

2026-06-22 時点、GitHub API で計測 (出典 7):

| シグナル | 値 |
| --- | --- |
| Stars | 約 5,900 |
| Forks | 約 320 |
| Contributors | 約 78 (匿名含む) |
| リポジトリ作成 | 2022-07-14 |
| 最新タグ | `v1.7.0`、`v1.7.1` (2026 年 6 月) |

ベンダーや買収関連の資料はより大きな数字 (120 万以上の DL、1 日約 43 億 check、40 以上の本番デプロイ) を主張するが、これらは二次情報で独立検証はできていない (出典 1, 3)。

## エコシステム

- gRPC (ポート 3478) と REST (ポート 3476) の API (`README.md:104-110`)。
- スキーマ作成・テスト用の Playground (`playground/`)。
- `sdk/` 配下の各言語 SDK と `proto/base/v1/` 配下の protobuf 定義。
- キャッシュは ristretto。分散構成では consistent-hash の gRPC balancer と Kubernetes resolver が起動時に登録される (`cmd/permify/permify.go:16-17`)。
- リアルタイムデータ同期用の製品側 "Sync Service" (Debezium/Kafka)。コアエンジンとは分離されている。
- 2025 年の買収後、Permify は FusionAuth と並んで self-hostable な AuthN + AuthZ プラットフォームの認可側として位置づけられている (出典 3, 4)。

## 代替候補

下記 3 つはいずれも Zanzibar に由来する。誠実な切り分けはライセンス、データストアの幅、リクエスト単位の整合性調整の豊富さ。

| 代替 | 違い |
| --- | --- |
| SpiceDB (AuthZed) | Apache-2.0。最も Zanzibar 忠実で、ZedToken によるリクエスト単位の整合性を持ち、PostgreSQL・MySQL・CockroachDB・Spanner に対応 (出典 5, 6) |
| OpenFGA (Auth0/Okta) | Apache-2.0。CNCF Sandbox プロジェクトで広く採用され、類似のモデリング言語を持つ (出典 5, 6) |
| Permify | AGPL-3.0。PostgreSQL 中心 (+ in-memory)、マルチテナント前提で、属性と CEL ルールによるネイティブ ABAC、DSL/Playground の DX を持つ (出典 5, 6) |

RBAC・ReBAC・ABAC を 1 つのスキーマで扱いたく、PostgreSQL に標準化されていて、AGPL-3.0 が許容できるなら Permify。幅広いデータストアやより細かいリクエスト単位の整合性制御が必要なら SpiceDB。寛容ライセンスで CNCF ガバナンス下の選択肢が欲しいなら OpenFGA。
