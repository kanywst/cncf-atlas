# status: Capsule

- [x] recon 完了 @ commit `8d89d6865df6f41c7faa22fc9e807a57b01bfd0e`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pinned tag は `v0.13.7`。インストール doc の例は `--version 0.12.4` なので write 段では最新 tag に合わせるか doc の値を踏襲するか要判断。
- カテゴリは Identity & Policy を採用。マルチテナンシー + RBAC 委譲 + admission ポリシーが核なので Security & Compliance とも隣接するが、テナント所有権 (identity) とポリシー強制が主軸。
- 代表オペレーションは「テナントオーナーが Namespace を作る」の mutating -> validating -> Tenant controller reconcile の流れ。anchor は recon.md の内部実装節に全て記載済み。
- 非自明設計: quota 超過時の既存 Namespace は deny せず API サーバの AlreadyExists に委ねる (`quota.go:84-86`)。所有権は label でなく ownerReference + field index (`namespaces.go:159`)。
- src は gitignore 対象。clone は depth 管理外 (既存 clone を再利用)。
- 確認保留: ResourcePool / TenantResource / Capsule Proxy は別 repo で深掘り余地あり。write では本体スコープに絞る。
