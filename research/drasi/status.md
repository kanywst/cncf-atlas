# status: Drasi

- [x] recon 完了 @ commit `62b10c72aa87bc1d8d76964abaca46d6fb53fa85` (drasi-core サブモジュール `a0273f22`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `drasi` / category: **Messaging & Streaming** / maturity: **Sandbox** (2025-01-21 受理)
- 言語の但し書き: コアは Rust (エンジン + コントロールプレーン)、CLI は Go。GitHub 言語統計では .NET (SDK/reaction) がバイト数最大なので、write では「Rust + Go 中核、SDK 層は多言語」と正確に書く
- クエリエンジンは別 repo `project-drasi/drasi-core` のサブモジュール。Internals はこの pin で検証済み
- 旧コードネーム "reactive-graph" の痕跡あり (history のネタになる)
- 二次パスで詰めたい: source 側の内部ホップ (change-router / change-dispatcher) と view-svc は file:line 未精読。write で厚く扱うなら要追加調査。中核の source→query→reaction フローは検証済みなので THIN ではない
