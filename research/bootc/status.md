# status: bootc

- [x] recon 完了 @ commit `a7f95e743aa54a2f966edc1a0417ef6d509df9af`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は `bootc-dev/bootc`（CNCF 移管で `containers/bootc` から改名。リダイレクトされる）。pinned commit はタグ未付与のため `git describe` は失敗、最寄りリリースは `v1.16.2`。
- カテゴリは **Runtime** を選択。指定リストに「OS / Image-based Linux」がないため、ホストランタイム層として最も近いものを採用。書き手はこの判断を再確認のこと。
- ライセンスはデュアル `MIT OR Apache-2.0`（両 LICENSE ファイル存在）。GitHub UI は apache-2.0 のみ表示。
- 代表トレースは `bootc upgrade`（cli.rs:1154 → deploy.rs:773 pull → deploy.rs:1012 stage → deploy.rs:899 deploy → ostree.stage_tree_with_options）。非自明設計は deploy.rs:919 の `!Send` を index/string に落として spawn_blocking へ渡す回避。
- 採用は ADOPTERS.md ベースで実在のみ記載。GitHub: stars 2,134 / forks 204 / contributors ~94（2026-06-26）。
- composefs（CNCF Sandbox 申請 #311）が新バッキングストアとして bootc に組み込まれつつある点は write 時に触れる価値あり。
