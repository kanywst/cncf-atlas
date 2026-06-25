# status: OpenCost

- [x] recon 完了 @ commit `4d117aabe116695ddd11100497827983b1892959`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `opencost` / category: `Observability` / maturity: `Incubating` (2024-10-25 昇格、CNCF project page で確認)
- canonical repo は `opencost/opencost` (allocation engine 本体)。UI と Helm chart は別 repo なので write 時に混同しない
- pin した HEAD は develop 先端 (`v2.6.0-rc.0` の後)。安定版を引きたいなら `v2.5.3`。Internals の file:line はこの HEAD 基準
- 厚みが薄い箇所: 採用事例は ADOPTERS.MD 起点で7社のみ。DevStats の時系列 (contributor 推移) は未取得。必要なら devstats.cncf.io を当たる
- bingen の生成器本体は別 repo (`opencost/bingen` 系)。本 repo には生成物 `opencost_codecs.go` と注釈のみ
- src/ は gitignored。clone 済み
