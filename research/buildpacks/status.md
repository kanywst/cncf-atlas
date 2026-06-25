# status: Buildpacks (Cloud Native Buildpacks)

- [x] recon 完了 @ commit `2df3b8c3b0955ea41aec010783ddfe70cbc17c56` (tag `v0.40.7`)
- [x] sources 整理 (13 件、参照日 2026-06-24)
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 一次実装リポは `buildpacks/pack` (CLI / プラットフォーム実装) に確定。実ビルドは別リポ `buildpacks/lifecycle` のバイナリが担い、`pack` はそれをコンテナとして駆動するだけ。write 段では「pack ≠ ビルドエンジン、lifecycle がエンジン」という 3 層関係 (pack / lifecycle / buildpacks) を最初に明示しないと読者が混乱する。
- カテゴリは指定どおり "App Definition & GitOps" を使用。tools.ts の CATEGORY_ORDER に存在するか write 段で要確認。
- 成熟度は Incubating (2020-11-18 昇格、Graduated 未到達)。CNCF landscape で最新ステータスを再確認すると安全。
- 代表トレースは `pack build`: commands/build.go:70 → client.Build (build.go:308) → LifecycleExecutor.Execute (lifecycle_executor.go:118) → LifecycleExecution.Run (lifecycle_execution.go:170)。trusted/untrusted で creator 単一コンテナ vs フェーズ別コンテナに分岐 (:240-349) が deep-dive の山場。
- 採用事例は出典付きのみ採用 (Heroku Fir / DigitalOcean App Platform / CNCF 昇格時の Greenhouse・Salesforce・VMware)。それ以外は捏造しない。
- 薄い箇所: 具体的な本番ユーザ数の最新値、Graduated 申請の有無。write 前に CNCF 側で再確認推奨。
