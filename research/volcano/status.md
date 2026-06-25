# status: Volcano

- [x] recon 完了 @ commit `7110813b198e99d0282170ef022f51ceb43d9403`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `volcano` / category: `Orchestration & Scheduling` / maturity: Incubating
- 近いタグは v1.15.0 (2026-06-01)、HEAD はその後の master。write 時はバージョン表記を v1.15.x 系で。
- tagline (EN): Kubernetes-native batch scheduler for AI/ML, HPC, and big-data, with gang scheduling, fair-share queues, and topology-aware placement.
- tagline (JA): AI/ML・HPC・ビッグデータ向けの Kubernetes ネイティブなバッチスケジューラ。ギャングスケジューリングとフェアシェアキュー、トポロジ対応の配置を備える。
- 第 2 パスで補強したい点:
  - iFlytek の CNCF End User Case Study の一次 URL を確認できれば差し替える (現状は adopters.md 起点)。
  - contributor 数は GitHub contributors API の last ページ (447, 匿名含む) からの概算。DevStats の数値があれば置換。
  - preempt/reclaim/backfill action と各 plugin (drf/proportion/capacity) の挙動は write 時にもう少し深掘り可。
