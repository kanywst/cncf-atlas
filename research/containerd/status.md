# status: containerd

- [x] recon 完了 @ commit `e96fd14b81ba273a38d0506056669ba571fea0bf`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: containerd は単一の主実装リポジトリ `containerd/containerd`。nerdctl / runwasi 等は別リポの周辺ツールで、deep-dive の主対象は本体。
- pin は main の `e96fd14` (commit date 2026-06-19)。`version/version.go` は `2.3.0+unknown`。リリース最新タグは v2.3.2 (release/2.3 系)。write 時はバージョン表記を「2.3 系」に丸めるか pin commit を明示すること。
- カテゴリは Runtime で確定 (CNCF landscape の Container Runtime)。
- 代表操作はタスク作成 (TaskService.Create -> TaskManager -> shim exec -> ttrpc -> runc)。write の「内部実装」節はこの 5 ステップをそのまま使える。
- 非自明設計 = shim をコンテナ毎の別プロセスにしてデーモンと ttrpc 疎結合 (デーモン再起動でコンテナが死なない)。write の目玉に。
- 採用事例は `ADOPTERS.md` 由来のみ採用済み。これ以外を足すなら一次出典必須。
- 次にやること: atlas-write で en/ja 6 セクション生成 -> tools.ts 登録 -> build/lint。
