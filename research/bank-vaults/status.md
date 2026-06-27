# status: bank-vaults

- [x] recon 完了 @ commit `2248b7b5a8bac4a6a7155c82304a2c1878bb6a46`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo: `bank-vaults/bank-vaults`。近いタグ `v1.33.1` (HEAD はその数コミット先)。
- カテゴリは Security & Compliance (secret 管理)。CNCF ページの記述とも一致。
- このリポは umbrella の CLI 部分。Operator / Webhook / SDK は別リポなので、deep-dive で触れるなら範囲を明示すること。コード anchor は全て本リポ `src/` を実読して確認済み。
- 代表操作は `bank-vaults unseal`。envelope encryption (KMS で暗号化して S3/GCS に保管) が設計の肝。
- 非自明な設計判断は 2 つ用意済み: (1) KV の 2 層化、(2) `Configure` の `ErrorUnused: true` による typo→誤削除防止。write 時はどちらか 1 つに絞ってよい。
- adopters は ADOPTERS.md 記載のみ引用。捏造なし。
- 次工程 (write): getting-started の手順は recon.md 末尾の最小セットアップを流用。`--mode file` / `--mode dev` はローカル向け、本番は KMS モード。
