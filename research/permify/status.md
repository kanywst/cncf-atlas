# status: Permify

- [x] recon 完了 @ commit `aa3a7c644e7f298f8f126e3ffa90d450967e0915`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 近いタグは `v1.7.1` (2026-06-05)。pin した HEAD はそれより後の main で、HEAD 自体にタグはない
- ライセンスは AGPL-3.0 (検証済み)。write 段で代替との非対称性を必ず触れる
- 2025-11-20 に FusionAuth が買収。OSS コアは GitHub 継続。カードや本文で「現在は FusionAuth 傘下」を明記
- CNCF プロジェクトではない (maturity = Independent)。CNCF 配下の同種は OpenFGA
- 採用企業の一次裏付けは無い。write でも個別企業名は断定しない方針を維持
- 非自明な設計判断: SnapToken = Postgres XID8 トランザクションスナップショット (`internal/storage/postgres/snapshot/token.go`)。write の内部解説の目玉にする
