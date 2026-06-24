# status: Prometheus

- [x] recon 完了 @ commit `fc561264a42bce13a7203e787abcc7ae0c68506f`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `prometheus` / category: Observability / maturity: Graduated
- pin は `3.13.0-rc.0` (release-3.13 ブランチの RC merge)。安定最新は `v3.12.0` (2026-05-28)。write 時はバージョン表記をどちらに寄せるか確認
- src は depth 1 clone なのでタグ解決不可。`VERSION` ファイルでバージョン確定済み
- ADOPTERS ファイルはリポジトリに無い。named adopter は CNCF graduation 発表 (出典 1, 4) のリストに限定。捏造しない
- 代表トレースは scrape -> textparse -> headAppender.Append -> Commit。write 時は mermaid 化候補
- 追える深掘り候補: PromQL engine (`promql/engine.go` の `execEvalStmt` @ 787)、WAL replay、compaction。write で 1 つ選ぶ
- 非自明ポイント: head chunk 3 段構成 (mem -> mmap -> block) + WAL、txRing による isolation、OOO の別 WAL (wbl)
