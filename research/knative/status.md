# status: Knative

- [x] recon 完了 @ commit `6fb71ff2ecf40bdad90fcc41a11374611bc3f121`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 主対象は `knative/serving` (本体実装)。eventing / func / client は別リポなので write 段では「Knative プロジェクト全体の中で Serving を中心に扱う」と明示する。
- pin タグは main 上の `knative-v1.22.0` が最近接 (commit はそこから 46 commits ahead)。リリースブランチの `knative-v1.22.1`/`v0.49.1` とは diverged なので混同しない。
- 代表オペレーションは Service → Configuration → Revision/Route の reconcile チェーン。データプレーン (activator + queue-proxy + SKS) は write 段で図解すると効く。
- 非自明設計の目玉は二重ウィンドウ (stable 60s + panic 6s) オートスケールと EBC による activator in-path 判定。`pkg/autoscaler/scaling/autoscaler.go` を中心に。
- 採用組織は ADOPTERS.MD のみを根拠にする。捏造禁止。
- カテゴリは Orchestration & Scheduling 確定。
