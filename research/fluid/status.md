# status: Fluid

- [x] recon 完了 @ commit `25531595e9233cb9340a3c544eb284b400b82d50`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: 正規実装は `fluid-cloudnative/fluid` (CNCF プロジェクトページ・GitHub org で確認)。組織内の他 repo (charts, common, fluid-client-python, fluid-cloudnative.github.io) は周辺で、ディープダイブ対象は core repo。
- pin commit は master HEAD (2026-06-23)。直前の安定タグは `v1.0.8` (2025-10-31)。write 段で「v1.0.8 系」と書くのが無難。
- CNCF 昇格日に 2 系統あり: プロジェクトページ「Incubating 2026-01-08」 vs 告知 blog「2026-03-24」。両方併記済み (TOC 投票日 vs 告知の差と推測)。断定回避。
- contributors 数も 2 系統: CNCF blog 979 (DevStats all-time 系) vs GitHub contributors API 約 480。両方併記済み。
- カテゴリは指示どおり "Storage & Database" で確定。
- 代表操作トレース: Dataset+AlluxioRuntime → RuntimeReconciler → TemplateEngine.Setup → SetupMaster → helm exec。path:line は全て実ファイル確認済み。
- 非自明な設計: controller が StatefulSet を直接 apply せず `ddc-helm` 外部バイナリを exec して同梱 chart を install する点。
- `src/` は gitignore 配下 (`research/<tool>/src`)。docs/ と tools.ts は本段では触れていない。
