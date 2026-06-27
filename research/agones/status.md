# status: Agones

- [x] recon 完了 @ commit `19f82f4f5a01cf1104e271d6d795acffbd53c35a`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は `agones-dev/agones` (旧 `googleforgames/agones`)。README バッジに `googleforgames` が残るので write 時は現行 org を使う。
- 近いタグは `v1.58.0`、HEAD は `1.59.0-dev` 開発線上。
- カテゴリは Orchestration & Scheduling。
- 採用は Ubisoft のみ確実 (CNCF blog)。`ADOPTERS` ファイルは無いので他社名は出さない。GitHub シグナル: スター約 6.9k / フォーク約 925 / contributor 250 名超。
- 非自明設計: HostPort をコントローラが自前割当 (Service / NodePort を使わない, UDP 直結で低遅延)。
- CNCF 受理日 (2025-12-21) と移管告知 blog 日 (2026-03-23) は別物。混同しない。
