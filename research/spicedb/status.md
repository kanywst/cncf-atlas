# status: SpiceDB

- [x] recon 完了 @ commit `4bb1d7b3e1029e94551cda04f217029e2f987c97`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pinned: `main` @ `4bb1d7b` (2026-06-19)。最新リリースタグは v1.54.0、HEAD はその後ろ
- カテゴリ Identity & Policy / 成熟度 Independent (CNCF ではない。OpenFGA が CNCF Incubating な点と対比すると刺さる)
- write 段階の目玉: traversal bloom filter によるディスパッチのループ検出 (`internal/dispatch/singleflight/singleflight.go:74`, `pkg/proto/dispatch/v1/02_resolvermeta.go:15`) と ZedToken consistency
- 採用事例はコントリビュータ企業名のみ確実。本番採用の固有名は一次ソース未確認なので write でも捏造しない
- 代表オペレーションのトレースは CheckPermission パスを採用済み (recon.md 参照)
