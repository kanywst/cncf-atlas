# status: Argo CD

- [x] recon 完了 @ commit `8f6d4e19393233a0b566403b8b76dbc11c8c9c1c`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `argo` / name: Argo CD / category: App Definition & GitOps / maturity: Graduated。
- repo 解決: CNCF "Argo" は 4 サブプロジェクトの傘。GitOps カテゴリの主役は argo-cd なのでこれを主対象に。Workflows/Rollouts/Events は write 段で「エコシステム」節に触れる程度で十分。
- pin は master (VERSION 3.6.0 開発版)。安定最新は v3.4.4 (2026-06-18)。write の Overview/Internals では commit sha を明記すること。
- 追いトレース候補 (write で深掘りするなら): repo-server 側の manifest 生成 (`reposerver/repository/`) と liveStateCache の watch 実装。今回は controller の reconcile -> sync 経路を端から端まで確認済み。
- 非自明設計の目玉は comparison level ladder (`controller/appcontroller.go:88-94`, `:1761`, `:1797-1816`) と gitops-engine の monorepo 取り込み (`go.mod:372`)。
- 採用は USERS.md (445 件自己申告) と CNCF 卒業アナウンスの明記組織のみ引用。捏造なし。
