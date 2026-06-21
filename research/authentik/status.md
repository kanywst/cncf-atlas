# status: authentik

- [x] recon 完了 @ commit `9da4c568cfd52c2b40db3a757d33fa3fe51627e0`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- shallow clone なのでタグ到達不可。コード VERSION は `2026.8.0-rc1`、直近安定タグは `version/2026.5.3`。
- ライセンスは MIT コア + `enterprise/` が EE (source-available)。GitHub は `NOASSERTION` 表記。write 時に「MIT (コア)」と明記し EE の存在を併記すること。
- CNCF 非加盟を cncf.io/projects で確認済み。maturity = Independent。
- 採用組織の一次出典が無い点を write でも正直に書く (捏造しない)。
- 中核トレースはポリシチェック (engine.py -> process.py -> models.py -> evaluator.py)。非自明設計は 1 ポリシ = 1 fork プロセス隔離 + static binding の DB 集計ショートカット。
