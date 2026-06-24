# status: cert-manager

- [x] recon 完了 @ commit `dbc027ee2a7ded1fa109ed63e631ba35cd83b6cf`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `cert-manager` / category: Security & Compliance / maturity: Graduated
- 近いタグは `v1.21.0-alpha.1`、HEAD は未タグの master (alpha より後)。write 時に「v1.21 系開発版」と表現するのが正確
- 採用事例は薄い。確実な名指しは CNCF 発表の Giant Swarm のみ。repo に ADOPTERS なし。write で adopters を増やすなら追加の出典探索 (CNCF case study / KubeCon talk) が必要。捏造禁止
- end-to-end トレースは Certificate -> trigger -> keymanager -> requestmanager -> ACME signer -> Order/Challenge -> issuing の micro-controller チェーンで取得済み。`file:line` は recon.md に記載
- 数値 (stars 13873 等) は 2026-06-22 取得。write 時に再取得して日付更新を検討
