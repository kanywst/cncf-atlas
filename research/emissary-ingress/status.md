# status: Emissary-Ingress

- [x] recon 完了 @ commit `65b0dd9ae34e76ac21d0598398a55e015416d6ea`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: 正規実装は [emissary-ingress/emissary](https://github.com/emissary-ingress/emissary)。`emissary-ingress` org には他に docs 等もあるが deep-dive 対象はこの本体。
- pin: `main` HEAD `65b0dd9ae...` (2026-05-01)。`git describe` は `v4.0.1-22-g65b0dd9ae`。最新リリースタグは `v4.1.0` (2026-05-19) だが HEAD からは到達しない (リリース系列が別 lineage)。write 側では「近いタグ v4.0.1 / 最新リリース v4.1.0」と書き分ける。
- 言語が 2 つ (Go + Python)。GitHub の primaryLanguage は Python だが、watcher/ambex/apiext/CRD 型は Go。両方触れること。
- カテゴリは「API Gateway」固定 (指示どおり verbatim)。
- 採用事例は Ticketmaster / Chick-fil-A / AppDirect のみ (The New Stack 由来)。repo に ADOPTERS.md 無し。これ以上は捏造しない。
- 次: atlas-write で en/ja 6 セクション。代表トレース (Mapping -> Envoy route) と endpoint fastpath を技術的山場に。
