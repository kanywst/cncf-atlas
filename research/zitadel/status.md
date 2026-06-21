# status: ZITADEL

- [x] recon 完了 @ commit `10087e7389702991b37af8d5c50d5e1e2ec910e3`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pinned HEAD は main 上で無タグ。直近リリースは v4.15.2 (2026-06-17)。write 段で「v4 系を pin、commit は main」と書くこと。
- category = Identity & Policy / maturity = Independent (CNCF 非ホスト、検証済み)。
- ライセンスは AGPL-3.0-only + ディレクトリ例外 (proto/docs は Apache-2.0、login/client/proto packages は MIT)。v3 (2025-03-31) で Apache から変更された点を歴史で必ず触れる。
- 中核トレースは gRPC permission チェック (auth_interceptor → authz.CheckUserAuthorization)。非自明設計は eventstore.Push のリトライループ (events2_pkey 衝突 + CRDB/serialization)。
- 採用は ADOPTERS.md (自己申告) のみが citable。named enterprise の独立ソースは未確認なので write 段で誇張しない。
