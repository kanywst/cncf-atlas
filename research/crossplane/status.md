# status: Crossplane

- [x] recon 完了 @ commit `56aace77e6771894afa157a3339dbe8d6d15401a`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: `crossplane/crossplane` で確定。org には provider 多数あるがコア実装はこれ
- pin は main HEAD (2026-06-19)。タグと一致しないので write 段では「v2.x 系 main」と表現する。最新安定は v2.3.2
- カテゴリは tools.ts のバケットでは App Definition & GitOps に寄せた (CNCF landscape の元区分 Orchestration & Scheduling とはズレるので write 時に一言触れる)
- 代表オペレーションは XR reconcile -> function pipeline (gRPC) -> composed apply。path:line は recon.md 参照
- v2 の大きな転換 (P&T 廃止、namespaced default、claim deprecated、Operations 追加) は write の目玉になる
- 採用事例は ADOPTERS.md 記載の citable なものだけ使用。CNCF の 3000 contributors は org 全体の数字、repo 単体は別 (混同しない)
- 次: atlas-write で en/ja 6 セクション生成 -> tools.ts 登録 -> build/lint
