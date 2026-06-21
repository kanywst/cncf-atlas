# status: OpenFGA

- [x] recon 完了 @ commit `9a556d8a134db308a7690f328dade79104922c8a` (近いタグ `v1.18.0`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- カテゴリ = Identity & Policy、成熟度 = Incubating。
- 採用は CNCF ブログ (出典 3) で名指しされた Okta / Auth0 / Grafana Labs / GitPod / TwinTag のみ一次確定。Docker / Canonical は二次情報のみで未確定 (write 時に断定しない)。
- スター数: CNCF ブログ時点 (2025-11) 4,300+、GitHub 現在 5.3k (2026-06-22 取得)。日付付きで両方記載すること。
- 非自明設計: `internal/planner` の Thompson Sampling で resolver 戦略をオンライン学習。write のアーキ節の目玉に使える。
- v2 `ExperimentalWeightedGraphCheck` は重み付きグラフ Check。まだ feature flag 段階で v1 にフォールバックあり。
