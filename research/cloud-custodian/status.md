# status: Cloud Custodian (c7n)

- [x] recon 完了 @ commit `3d8a56261c07aeaba52bc635f7fd17c55daa3f72` (tag `0.9.51.0`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- カテゴリは指定どおり "Security & Compliance" を verbatim 使用。
- tagline 案:
  - EN: A YAML rules engine that queries, filters, and acts on AWS, Azure, and GCP resources to enforce security, compliance, and cost policies.
  - JA: AWS / Azure / GCP のリソースを YAML ポリシーでクエリ・フィルタし、アクションでセキュリティ・コンプライアンス・コストを統制するルールエンジン。
- 代表操作トレースは pull モード (`custodian run`) を CLI → commands.run → Policy.__call__ → PullMode.run → QueryResourceManager.resources → filter_resources → ResourceQuery で確定。path:line は recon.md に記載済み。
- 次の write ステージ向け: 実行モード (pull vs lambda/cloudtrail) の対比と、schema 動的生成 (QueryMeta + schema.generate) が deep-dive の山場。
- star/contributor 数は 2026-06-24 実測。公開前に再確認。
