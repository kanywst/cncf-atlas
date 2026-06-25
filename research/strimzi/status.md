# status: Strimzi

- [x] recon 完了 @ commit `9505103de40c9756faa4d8cf97ca7c2791c46424`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: `strimzi/strimzi-kafka-operator` (Java / Apache-2.0 / CNCF Incubating)。canonical な実装リポで確定。
- pinned commit はタグ済みリリースではなく main の途中 (`1.0.1` < HEAD < `1.1.0-rc1`)。write 段でバージョン表記する時は「1.0.x 系 / main」と書き、特定タグを断定しない。
- 代表オペレーションは Kafka CR の reconcile を 1 本通した (`KafkaAssemblyOperator` → `KafkaReconciler` の Future チェーン → `podSet()` → `rollingUpdate`)。write 段はこれを図解に使える。
- 非自明な設計判断 = StatefulSet を捨てて自前 `StrimziPodSet` + コントローラで pod 管理。ローリング更新と broker 個別操作の制御権を握るため。write 段の "なるほど" ポイントにする。
- 重要な前提変更: 最新コードは ZooKeeper 廃止の KRaft only (Kafka 4.x)。古い記事は ZooKeeper 前提なので write 時に混ぜない。Kafka CRD は `v1` に到達済み。
- 採用組織は ADOPTERS.md と CNCF blog の citable なものだけ使う (Reddit / Decathlon / AppsFlyer / CERN / Rubin Observatory など)。数値は「1600+ contributors, 180+ orgs (2024-02 CNCF)」「stars 5,843 (2026-06-24)」。
- カテゴリは指定どおり "Messaging & Streaming" を verbatim 使用。
- src/ は gitignore 対象 (clone 済み、コミットしない)。
