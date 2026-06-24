# status: KEDA

- [x] recon 完了 @ commit `c5b577cd882d7a4572787e48868ed6a82da91369`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `keda` / category: Orchestration & Scheduling / maturity: Graduated。
- pin は main 上で v2.20.1 の少し先 (タグ無しコミット)。write 時は「v2.20.1 系 + pin commit」と明記する。
- 採用組織は CNCF graduation アナウンス ([4]) 由来の 6 社 (FedEx, Grafana Labs, KPMG, Reddit, Xbox, Zapier) のみ引用可。リポ内 ADOPTERS.md は無い。それ以上の社名を足すなら別途出典が要る。
- 代表トレースは「HPA → metrics adapter → gRPC → operator scale handler → scalers」+ 「operator が 0↔1 を直接処理」の 2 系統。write でここを図にすると効く。
- 次にやること: atlas-write で en/ja 6 セクション生成、tools.ts 登録、build/lint。
