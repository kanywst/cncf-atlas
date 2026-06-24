# status: KubeEdge

- [x] recon 完了 @ commit `864f45eb1b23059e3ddb7bb862c2d51cba7d0f34`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決済み: `kubeedge/kubeedge` (主実装。`kubeedge` org には dashboard/sedna 等の周辺 repo もあるが deep-dive 対象はここ)。
- pin は master HEAD (`864f45e`)。タグ v1.23.0 の 89 commits ahead。write 段では「v1.23.0 系 + post-release master」と書く。
- 代表オペは edgehub の routeToEdge -> ProcessHandler -> metamanager 永続化のフロー。file:line は recon.md に記載済み。
- 非自明設計: metamanager の SQLite ローカルストアによる edge autonomy。
- adopters は ADOPTERS.md 記載のみ使用 (捏造なし)。1,600+ contributors は CNCF 発表の広い定義、GitHub code contributor は約 309 と区別済み。
- カテゴリは Orchestration & Scheduling にマップ。
- src/ は gitignored の前提。
