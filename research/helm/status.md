# status: Helm

- [x] recon 完了 @ commit `74fa4fceb83526d7e7f3a5e99c768a3fe3d04549`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pinned は v4.2.2 の数コミット後の main 先端。write 時は「Helm 4 系」と明記する。Helm 3 と 4 の差 (Tiller 削除は 3、native SSA と WASM プラグインは 4) を混同しない。
- カテゴリバケットは App Definition & GitOps で確定。
- 非自明な設計判断としてアピールするのは「リリース状態を namespace 内の Secret (base64+gzip, type `helm.sh/release.v1`) に保存し Tiller を廃した」点。
- 採用組織は ADOPTERS.md 記載分のみ使う。捏造しない。CNCF 75% は二次出典なので断定調を避ける。
- 代表オペレーションは `helm install`。end-to-end の path:line は recon.md にある。write でも install を主軸にすると流れが通る。
