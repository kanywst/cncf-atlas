# status: external-secrets

- [x] recon 完了 @ commit `e1006131b195afa4138e6cc815e1168f533ce95c`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `external-secrets` / name: External Secrets Operator (ESO)
- category: **Security & Compliance**（CATEGORY_ORDER にあり、追加不要）
- maturity: **Sandbox**（CNCF、2022-07-26 受理。公式 project ページの表記は現時点 Sandbox。incubation 申請の言及と TOC #1819 の健全性レビューあり。write では Sandbox を正とする）
- pinned tag: `helm-chart-2.7.0`（リリースは Helm チャート命名。operator バージョンもこれに追随）
- 代表操作トレース（reconcile → GetSecret → Kubernetes Secret）と内部構造は recon.md に `file:line` 付きで記録済み。write でそのまま Architecture / Internals に使える。
- 採用事例は ADOPTERS.md（sources #10）記載組織のみ。捏造なし。GitHub シグナルは 2026-07-09 時点。
- 薄い点: history の細かい日付（最初の GA リリース日、v0.x の節目）は Container Solutions/GoDaddy ブログと GitHub releases 依存。write で年月レベルの精度に留めるなら追加調査不要。プロバイダ/generator の網羅（41/17）は数のみ確認、個別の深掘りは不要。
