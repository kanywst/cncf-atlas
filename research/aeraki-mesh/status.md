# status: Aeraki Mesh

- [x] recon 完了 @ commit `56e4de0f28d7bb0feab9d899eec08a28a62ad27a` (近いタグ `1.4.1`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- カテゴリは Service Mesh & Networking で確定。Istio 専用の L7 拡張コントロールプレーンという立ち位置。
- データプレーンは別 repo `meta-protocol-proxy` (C++)。本 recon は control plane (`aeraki`) のみ精読。write 段で必要ならデータプレーン側 codec interface に触れる。
- pinned commit は master 上で `1.4.1` より新しい。リリース版に揃えたい場合は tag `1.4.1` (`40fd51c1`) を使う選択肢あり。
- Istio バージョン互換が厳密 (1.4.x ↔ Istio 1.18.x)。getting-started に明記済み。
- adopter は確証ソースのある Tencent / Tencent Music のみ。専用 ADOPTERS ファイルは無く、利用者収集は issue #105。
