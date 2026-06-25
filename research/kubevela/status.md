# status: KubeVela

- [x] recon 完了 @ commit `a10dba6d37353d25989502e52facaae87452a5b1`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決済み: kubevela/kubevela (Go module 名は `github.com/oam-dev/kubevela`、混同注意)。
- カテゴリは指定どおり "App Definition & GitOps" を verbatim 使用。
- pinned commit は master の `a10dba6` (2026-06-10)。安定タグ v1.10.8 より先。write 段でバージョン言及するなら v1.10.x 系を基準にする。
- トレース済みの代表パス: `application_controller.go:109` Reconcile から `appfile.go:332/541` CUE レンダリング、`generator.go:104` / `resourcekeeper/dispatch.go:61` Dispatch まで。
- 非自明設計 2 点 (CUE による抽象層 / ResourceTracker 台帳 GC) を write で 1 つ深掘りに使える。
- 採用は ADOPTERS.md に多数。捏造せず citable 名のみ採用済み。
- 次にやること: atlas-write で recon.md を 6 セクション bilingual に展開。
