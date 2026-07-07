# status: Cozystack

- [x] recon 完了 @ commit `f5c408d2fc2a7b4efea131848e4facf9d51a0423` (main, v1.5.1 の先)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## 確定事項

- repo: `cozystack/cozystack`、Go 1.26.4、Apache-2.0、CNCF Sandbox (2025-02-28 受理)。
- カテゴリ: App Definition & GitOps (CNCF も TAG App Delivery 下で扱う)。
- 中核: `cozystack-api` 集約 apiserver が Application を Flux HelmRelease に射影 (`pkg/registry/apps/application/rest.go:1605` `Values: app.Spec`)。
- 非自明な設計: 全 Application kind を 1 つの汎用 `REST` + 不透明 JSON `Spec` で処理し、kind は ApplicationDefinition から起動時に動的登録 (`pkg/apiserver/apiserver.go:229`)。
- 採用: ADOPTERS.md に 8 組織 (Ænix/Mediatech/Bootstack/gohost/Urmanac/Hidora/QOSI/Cloupard)、出典付き。star 2,132 / contributors 50+ (2026-06-29)。

## メモ

- write 段では「API は REST だが実体は Helm+Flux」という翻訳層の説明を軸にすると刺さる。
- VM/マネージド k8s/DBaaS を 1 プラットフォームで、という点を Crossplane/Harvester/OpenStack との対比で出す。
- 数値 (star 等) は参照日 2026-06-29 を明記して使う。
