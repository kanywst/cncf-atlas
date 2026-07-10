# 歴史

## 起源

Drasi は Microsoft の Azure Incubations チーム内部で開発され、2024-10-09 にオープンソースとして公開された。発表は Azure ブログで Azure CTO の Mark Russinovich が行った。当初から Apache-2.0 で、CNCF Sandbox への申請も既に進行中と明記され、PostgreSQL・Microsoft Dataverse・Azure Event Grid のプリビルト Source/Reaction を備えて出発した (Azure ブログ)。GitHub リポジトリはそれ以前の 2024-05-27 に作成されており (GitHub API `created_at`)、公開に向けた準備期間にあたる。

チームが説明する動機は、データベースを共有しないシステム間での変更検知と反応である。よくある回避策は、データを中央ストアにコピーしてポーリングするか、接続の組ごとに専用の統合コードを書くことだ。Drasi の前提は、データが既に存在する場所で条件を評価することにある。条件はソースをまたげるグラフクエリとして表現し、変更が実際に動かした部分だけに反応する (Azure ブログ)。

継続的クエリエンジンは、最初から Drasi の名前だったわけではない。旧コードネームは "Reactive Graph" で、その名残は vendored なエンジンのテストに残っている。あるユースケースクエリは今も `apiVersion: query.reactive-graph.io/v1` を宣言している (`query-container/query-host/drasi-core/shared-tests/src/use_cases/rolling_average_decrease_by_ten/queries.rs:18`)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2024 | リポジトリ作成 (2024-05-27)。Apache-2.0 でオープンソース化し Azure ブログで発表 (2024-10-09) |
| 2025 | CNCF Sandbox に受理 (2025-01-21)。Microsoft のオープンソースブログが受理を改めて告知 (2025-06-10) |
| 2026 | `0.10.x` 系が活動中。本書では `62b10c7` (タグ `0.10.0` から 18 コミット先) を基準に記述 |

## どう進化したか

公開後の最も明確な転換はガバナンスだった。Drasi は 2025-01-21 に CNCF Sandbox 入りし、その月に受理された 13 プロジェクトの 1 つとなった (CNCF プロジェクトページ、cncf/sandbox #296、Palark の 2025 年 1 月まとめ)。Microsoft は 2025-06-10 に自社のオープンソースブログでこのマイルストーンを取り上げ直し、Drasi を change-driven なソリューションのための CNCF プロジェクトとして位置づけた (Microsoft Open Source ブログ)。この動きは、Drasi を同チームの他の CNCF 活動と並べるものだった。Azure ブログは Drasi を Dapr・KEDA・Radius・Copacetic と同じ系譜で紹介している (Azure ブログ)。

技術的な形は公開時の説明から一貫している。Source が変更を送り込み、Continuous Query が Cypher で評価し、Reaction が結果集合に対して動く。エンジン本体は別リポジトリ `project-drasi/drasi-core` にあり、`query-container/query-host/drasi-core` の下にサブモジュールとして vendored されている (`.gitmodules`)。そのためクエリの意味論は独自の軌道で進化し、プラットフォームはそれを Kubernetes 向けにパッケージする。

## 現在地

Drasi は活動中の CNCF Sandbox プロジェクトである。ドキュメント基準コミットの時点でプラットフォームはタグ `0.10.0` から 18 コミット先にあり、README はこれをコミュニティがプラットフォームを学び proof of concept で試すための early release と位置づけ、バグ報告や機能要望を歓迎している。開発は `drasi-project` GitHub organization と公開の Discord を通じてオープンに調整され、コントリビューション・セキュリティ・行動規範のガイドは共有リポジトリ `drasi-project/.github` に置かれている (README)。エンジンとプラットフォームは 2 つのリポジトリに分かれたままサブモジュールで固定されており、本書のプラットフォームは特定のエンジンコミット (`a0273f22`) を追っている。
