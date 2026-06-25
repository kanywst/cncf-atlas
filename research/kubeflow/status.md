# status: kubeflow

- [x] recon 完了 @ commit `5beeae1a86b14be2b141a459d92ea2dd01d0aa17`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `kubeflow` / category: `Orchestration & Scheduling`（固定指定）/ maturity: Incubating（CNCF 2023-07-25 受理）。
- リポ解決の注意: CNCF の "Kubeflow" はアンブレラで、公式リポ `kubeflow/kubeflow` は現在 gateway 化されコードが無い。コードのディープダイブは中核オーケストレーション実装の `kubeflow/pipelines` を対象にした。write 段でこの「アンブレラ vs 実装リポ」の区別を明記すること（読者が `kubeflow/kubeflow` を clone して困惑するのを防ぐ）。
- pinned `5beeae1` は master の途中コミット（タグ無し）。最近リリースは backend 2.16.1 / sdk-2.16.1。Internals の path:line はこの commit 限定で valid。
- 採用事例は ADOPTERS.md の 4 社 + Vertex AI Pipelines (KFP DSL 採用) のみ citable。これ以上は捏造しない。
- v2 アーキ（driver+launcher をタスクに注入、MLMD が真実の源、Argo は実行基盤）が deep-dive の肝。v1 (Argo YAML 直書き) との対比を Architecture で一段触れると良い。
- 薄い箇所: MLMD の内部スキーマ（Context/Execution/Artifact の型）は今回 driver 側からしか追っていない。write 前に `backend/src/v2/metadata/` を一度通読すると Internals が厚くなる。
