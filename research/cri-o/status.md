# status: CRI-O

- [x] recon 完了 @ commit `68f2617bf26cc328f3d6edb030ed830362f4b76b`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: `cri-o/cri-o` で確定。CRI-O は単一実装リポジトリ。`openshift/cri-o` は Red Hat の downstream fork なので採用しない。
- pin したコミットは `main` (1.37 開発線)。shallow clone のためタグは描画不可。安定版を引きたいなら write 段で `v1.36.1` (2026-06-03) を基準に書くか検討。
- カテゴリは Runtime で確定。tagline は en/ja とも用意済み。
- 代表オペレーションは RunPodSandbox を end-to-end でトレース済み。設計の肝は conmon による監視プロセス分離。
- 採用組織は ADOPTERS.md 記載の 12 組織のみ使用。捏造なし。
- 次工程 (write) で確認したい点: containerd との比較表 (snapshotter vs storage、daemon の有無)、conmonrs (Rust) への移行状況、Kata の runtime handler 設定例。
