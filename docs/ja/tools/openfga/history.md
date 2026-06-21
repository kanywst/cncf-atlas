# 歴史

## 起源

OpenFGA は Auth0 の内部認可システムから生まれた。Auth0 (のちに Okta が買収) は 2021 年 12 月からこれを Auth0 FGA として本番稼働させ、その後エンジンを OSS 化して 2022 年 6 月に公開発表した (2)。

動機は具体的だった。Airbnb や Carta といった企業が、出発点となる共通の OSS 実装が存在しないために、各社で Zanzibar 系の認可システムをゼロから作り直していた。OpenFGA は「誰もが使える 1 つの再利用可能な実装」になることを目指した。Google の Zanzibar 論文の発想 (関係ベースアクセス制御、数兆規模の ACL へのスケール、p95 レイテンシ 10ms 未満) を取り入れつつ、RBAC や ABAC のユースケースも表現できるモデル DSL を備えた (2)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | Auth0 FGA が社内本番で稼働 (12 月) (2) |
| 2022 | エンジンを OSS 化し OpenFGA として発表 (6 月)、CNCF Sandbox に受理 (9 月 14 日) (2)(3) |
| 2025 | TOC が Incubating への昇格を可決 (10 月 28 日)、公式発表 (11 月 11 日) (3)(5) |

## どう進化したか

OSS 化後、プロジェクトは単一のデータストアと単一チームの枠を越えて広がった。コミュニティの貢献によってストレージバックエンドが追加された。Grafana Labs が SQLite アダプタを、TwinTag が MySQL アダプタを寄贈し、既存の PostgreSQL とインメモリエンジンに加わった (3)。メンテナ陣も当初の Okta エンジニアから Grafana や GitPod の貢献者へと広がり、その間も Auth0/Okta FGA は同じ OpenFGA エンジン上に構築され続けた (2)(3)。

エンジン内部も変化を続けている。この基準コミットのコードベースには、`ExperimentalWeightedGraphCheck` フィーチャーフラグ配下の実験的な第 2 世代 Check パスが含まれており、モデルを重み付きグラフとして評価し、その形で表現できないモデルでは元のパスにフォールバックする ([`pkg/server/check.go:69-152`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/server/check.go#L69-L152))。解決戦略をオンラインで選択するクエリプランナ ([`internal/planner/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/internal/planner)) も、性能チューニングが固まった設計ではなく継続的な作業領域であることを示している。

## 現在地

OpenFGA は 2025 年末時点で CNCF Incubating プロジェクトである (3)(4)。リリースは頻繁にタグ付けされており、このディープダイブは `v1.18.0` (2026-06-17) の 1 コミット後に固定している。そのコミットは changelog のドキュメント修正である ([コミット `9a556d8`](https://github.com/openfga/openfga/commit/9a556d8a134db308a7690f328dade79104922c8a))。CNCF ブログは、Incubation の時点で本番利用を公に表明した組織が 37 社あると報告している (3)。ガバナンスは複数企業のメンテナで共有され、商用の Auth0/Okta FGA 製品は引き続き OSS エンジンを追随している。
