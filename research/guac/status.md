# status: GUAC

- [x] recon 完了 @ commit `362e6dacedaa22af63c157b2c9d3e39a51da437f`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pinned: main HEAD `362e6da` (2026-06-20)。最新リリースタグ `v1.1.0` (`a399a548`) より後。shallow clone のため `git describe` はタグ解決不可
- category=Supply Chain, maturity=Independent (OpenSSF incubating, CNCF 非加盟)
- 採用事例: 出典付きの本番エンドユーザ事例は無し (ADOPTERS.md 不在)。創設/支援組織のみ出典あり。write 時に捏造しないこと
- 中核トレース: ingest path (collect → process → parse → assemble)。非自明点 = verify と ingest の分離、`Verified` != trusted (`verifier.go:46-49`)
