# status: eraser

- [x] recon 完了 @ commit `20576a24c512feb83c26ed867353d4143717d798`
- [x] sources 整理 (S1-S9、参照日 2026-07-08)
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録 (slug: eraser / category: Security & Compliance / maturity: Sandbox)
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 基本情報・アーキ・内部実装は pinned commit で `file:line` 確認済み。write はそのまま流用可
- 採用事例は AKS Image Cleaner のみ確実 (S9)。ADOPTERS ファイルは無い。ほかの組織名は出典が無いので書かない
- CNCF Sandbox 受理日 2023-06-30 は S2/S4 で裏取り済み
- カテゴリは CATEGORY_ORDER の "Security & Compliance"。追加不要
- タグは `v1.5.0-beta.0` が nearest だが、安定最新は `v1.4.1`。Overview では両方触れると親切
- 薄い点: なし。write に進める
