# status: easegress

- [x] recon 完了 @ commit `3bdb1923a213334fad95dd98ca35dac7dd4c391c`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: easegress / category: **API Gateway** / maturity: **Sandbox** (2023-12-19 受理)。
- repo は easegress-io/easegress に移設済み。ただし go.mod のモジュールパスは今も `github.com/megaease/easegress/v2`。Overview では「MegaEase 発、現在は easegress-io org」で書く。
- pinned commit は v2.11.0 (2026-03-17) より後の main tip。Internals の主張はこの sha 限定。write 側でも sha を明記。
- src は depth 1 の shallow clone。過去コミットを辿る調査 (git blame/log) は不可。追加で歴史を掘るなら full clone が要る。
- 採用事例が薄い: 一次情報で名指しできる企業が MegaEase 以外に見つからない。write では企業名を出さず「MegaEase 発 + CNCF Sandbox + GitHub シグナル (stars 5,873 / forks 495 / contributors 69, 2026-07-08)」で構成する。ここが唯一の thin ポイント。
- アーキ/内部の file:line は src で確認済み。代表フロー (HTTP→mux→pipeline→filter→proxy) と JumpIf 分岐、埋め込み etcd が deep-dive の芯。
