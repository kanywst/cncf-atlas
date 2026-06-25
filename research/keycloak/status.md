# status: Keycloak

- [x] recon 完了 @ commit `e73344070e0bb0dc57dcddb4ed79aff4854fa39a` (近いタグ `26.6.3`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: CNCF landscape / GitHub で `keycloak/keycloak` が一次実装リポと確定。Java + Quarkus 配布物。
- カテゴリは指定どおり "Identity & Policy" 固定。
- 代表操作は OIDC authorization_code トークン交換を end-to-end で追った。非自明な設計判断は「認可コード = single-use ストアへの参照キー、`remove` で原子的に消費して replay を防ぐ」。
- 採用組織は `ADOPTERS.md` と CNCF blog の citable なものだけ採用。捏造なし。
- write 段階の注意: build-time/run-time 二段モデル (`kc.sh build` → `kc.sh start`) と SPI/Provider 拡張モデルは初学者が詰まりやすいので前提として説明する。
- 数値は時点を明記 (stars 35,044 / 2026-06-24)。再実行時は GitHub API で更新。
