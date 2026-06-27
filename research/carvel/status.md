# status: Carvel (kapp-controller)

- [x] recon 完了 @ commit `be1faefd135d62d901a0ad4b4904b30c6c0dc7c3` (tag v0.60.3)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 主実装リポジトリは `carvel-dev/kapp-controller` を採用。`carvel-dev/carvel` は実装を持たない community/docs リポジトリなので deep-dive 対象外。Carvel は複数ツールの寄せ集めだが、クラスタ内エンジンで CRD と reconcile が厚い kapp-controller が最も deep-dive 向き。
- カテゴリ: App Definition & GitOps。
- 代表操作トレース済み: App CR の fetch → template → deploy パイプライン。全 path:line は v0.60.3 で実ファイルを開いて確認済み。
- 非自明設計: (1) sidecarexec による外部 CLI 実行の特権分離 + allowlist、(2) Package/PackageMetadata を CRD でなく集約 API server で提供、(3) 起動時の config 同期 reconcile。
- 採用企業: ADOPTERS ファイルなし。第三者固有名の確証ソースが取れないため列挙しない。GitHub シグナルで代替 (star 315 / contributors 約 76)。
- write 段で確認: install コマンドは `kubectl apply -f .../releases/latest/download/release.yml`、CLI は `kctrl`、App CR の apiVersion は `kappctrl.k14s.io/v1alpha1`。
- 保留: 第三者導入事例で公開トーク等の一次ソースがあれば追記したい (現状なし)。
