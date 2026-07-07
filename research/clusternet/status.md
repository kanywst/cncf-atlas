# status: clusternet

- [x] recon 完了 @ commit `e8b5a0c622e417960db3a6b9bfa057ca46488159`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo: `clusternet/clusternet` / pinned `e8b5a0c6` (main, 2026-05-10) / 近いタグ `v0.18.1` (2025-08-13)。
- 言語 Go 1.23 / build `make` / Apache-2.0。CNCF Sandbox (2023-03-07 受理)。
- カテゴリ: Orchestration & Scheduling。
- recon.md の path:line アンカーは 2026-06-28 に src で全件再確認済み (subscription / scheduler / generic / default_binder / deployer / agent generic / shadow rest / exchanger / 全 CRD 型)。
- 配布パイプライン: `Subscription → (scheduler) BindingClusters → (controller-manager) Base → Description → (agent/hub) 実 apply`。scheduler と deployer は Subscription status 経由で疎結合。
- 非自明設計 2 点: shadow API (`kubectl apply` を Manifest CRD 化) と remotedialer による reverse websocket proxy。
- ADOPTERS.md は存在しない。本番採用組織の裏取りソースは未確認。README の企業名は contributor 所属であり採用事例ではない。write 段で混同しないこと。
- 次にやること: write 段で en/ja 6 セクションを起こす。proxy (visit) と shadow API が差別化の軸。Karmada / OCM / KubeStellar との違いを冒頭で立てる。
