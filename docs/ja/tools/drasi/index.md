# Drasi

> Drasi はデータソースの変更を監視し、変更ごとに常駐する Cypher クエリを評価し、クエリの結果集合が動いたときにリアクションを発火させる。データを中央ストアにコピーすることも、タイマーでポーリングすることもしない。

- **カテゴリ**: Messaging & Streaming
- **CNCF 成熟度**: Sandbox (2025-01-21 受理)
- **言語**: Rust によるコア (エンジン・コントロールプレーン・sources)、Go の CLI、多言語の SDK 層
- **ライセンス**: Apache-2.0
- **リポジトリ**: [drasi-project/drasi-platform](https://github.com/drasi-project/drasi-platform)
- **ドキュメント基準コミット**: `62b10c7` (タグ `0.10.0` から 18 コミット先)

## 何をするものか

Drasi は Kubernetes 上で動く change data processing (変更データ処理) プラットフォームである。3 つのユーザー向け概念で構成される。**Source** はリレーショナルデータベースやメッセージブローカーといった外部システムに接続し、その change feed を監視して、あらゆる変更を Drasi 内部のイベントに変換する。**Continuous Query** (継続的クエリ) は Cypher で書いたクエリで、一度結果を返して終わりではなく常駐する。変更が届くたびに、Drasi が最新に保つ結果集合を維持する。**Reaction** は継続的クエリを購読し、結果集合に行が追加・更新・削除されたときにアクションを起こす。

Drasi が狙う課題は、あるシステムの変更が別の場所での処理をトリガーすべきで、しかも判断に必要なデータがデータベースを共有しない複数システムに散在する、という繰り返し現れる状況である。ありがちな解決策は、すべてを中央ストアにコピーしてポーリングするか、システムの組ごとに専用の統合コードを書くことだ。Drasi はその代わりに、データが既に存在する場所で条件を評価する。条件は複数ソースを横断して結合できる 1 つのグラフクエリとして表現され、変更が実際に触れた部分だけを再計算する。

Drasi は Microsoft の Azure Incubations チームが生んだもので、Dapr・KEDA・Radius・Copacetic と同じチームである。内部のメッセージングとアクターモデルには Dapr を用い、リレーショナル Source の内部ではデータベースの変更ログを読むために Debezium を使う。コアエンジンとコントロールプレーンは Rust で書かれ、`drasi` コマンドラインツールは Go で書かれている。Source と Reaction の SDK は複数言語で提供され、統合を .NET・Java・Python・JavaScript・Rust で書けるようになっている。

## いつ使うか

- 複数システム (データベース・キュー・Kubernetes リソース) をまたぐ条件に反応したく、そのデータをまず 1 か所に集約したくない場合。
- 条件が本質的にグラフや関係の結合 (別々のソースのエンティティにまたがるパターンのマッチ) であり、ポーリングコードではなく宣言的に表現したい場合。
- 既に Kubernetes を運用しており Dapr を動かせる場合。Drasi のコンポーネントはそこにデプロイされ、メッセージングと状態管理を Dapr に依存する。
- 単一のデータベースが全データを保持しており、マテリアライズドビューやデータベーストリガーで用が足りるなら向かない。Drasi のマルチソースモデルは得るものなく運用負荷を足すだけになる。
- 汎用のストリーム処理エンジンでもない。Source/Continuous Query/Reaction という固定の形を提供するので、任意のデータフロートポロジーはより低レベルのエンジンの方が適する。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと変更の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [drasi-project/drasi-platform (GitHub, リポジトリと API)](https://github.com/drasi-project/drasi-platform) (参照 2026-07-08)
2. [Drasi プロジェクトページ (CNCF)](https://www.cncf.io/projects/drasi/) (参照 2026-07-08)
3. [Introducing Drasi: Microsoft's new change data processing system (Azure Blog, Mark Russinovich)](https://azure.microsoft.com/en-us/blog/drasi-microsofts-newest-open-source-project-simplifies-change-detection-and-reaction-in-complex-systems/) (参照 2026-07-08)
4. [Drasi accepted into CNCF sandbox for change-driven solutions (Microsoft Open Source Blog)](https://opensource.microsoft.com/blog/2025/06/10/drasi-accepted-into-cncf-sandbox-for-change-driven-solutions/) (参照 2026-07-08)
5. [Drasi ドキュメント (drasi.io)](https://drasi.io/) (参照 2026-07-08)
6. [\[Sandbox\] Drasi, cncf/sandbox Issue #296](https://github.com/cncf/sandbox/issues/296) (参照 2026-07-08)
7. [Exploring Cloud Native projects in CNCF Sandbox, Part 5: January 2025 (Palark)](https://palark.com/blog/cncf-sandbox-2025-jan/) (参照 2026-07-08)
8. [Continuous Queries (Drasi Docs)](https://drasi.io/concepts/continuous-queries/) (参照 2026-07-08)
9. [Reactions (Drasi Docs)](https://drasi.io/concepts/reactions/) (参照 2026-07-08)
10. [Netstar (CNCF Case Study)](https://www.cncf.io/case-studies/netstar/) (参照 2026-07-08)
11. [How Netstar Streamlined Fleet Monitoring and Reduced Custom Integrations with Drasi (Microsoft Community Hub)](https://techcommunity.microsoft.com/blog/linuxandopensourceblog/how-netstar-streamlined-fleet-monitoring-and-reduced-custom-integrations-with-dr/4499592) (参照 2026-07-08)
