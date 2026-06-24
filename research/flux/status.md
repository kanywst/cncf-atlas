# status: flux

- [x] recon 完了 @ commit `65d975b490d1284cd1f341d0980e38c84d3aa6a9` (近いタグ `v2.8.8`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: CNCF landscape の Flux は `fluxcd/flux2` が CLI + bootstrap の主実装リポジトリ。GitOps Toolkit のコントローラ (source/kustomize/helm/notification/image-*) は別リポジトリだが、deep-dive の中心は flux2。
- 代表操作トレース済: `flux bootstrap github` → `bootstrap.Run` → ReconcileComponents/SourceSecret/SyncConfig → Report*Health。path:line は recon.md 参照。
- 非自明設計: Flux は自分自身を flux-system Kustomization 経由で GitOps 管理下に置く (自己ブートストラップ)。write 段でここを軸にすると良い。
- src/ は gitignore 対象 (shallow clone)。HEAD は main で v2.8.8 の先。write 時に commit/tag を再掲する。
- 採用事例は ADOPTERS ページと CNCF 発表の名指しのみ使う。捏造禁止。
