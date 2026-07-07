# status: copa (Copacetic)

- [x] recon 完了 @ commit `0f6f0ab2c3ee4590530a621094502047fad127cf`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pinned commit はメインの `0f6f0ab` (2026-06-24)。直近タグは `v0.14.1` (2026-05-18)。HEAD はタグより新しい。
- カテゴリは Security & Compliance を採用 (CNCF Landscape の分類に一致)。Supply Chain も候補だが主目的は脆弱性パッチ。
- 代表操作トレースは単一アーキの `copa patch -i -r -t`。マルチプラットフォーム (`patchMultiPlatformImage`) と bulk (`pkg/bulk`) は write 段でカバー要否を判断。
- 非自明設計の目玉: distroless 向け `unpackAndMergeUpdates` (ツールイメージで .deb を展開し対象 FS にマージ)。`probeDPKGStatus` の判定とセットで書く。
- 実験的機能 (`COPA_EXPERIMENTAL=1` の library/toolchain パッチ) は write では「実験的」と明記。
- adopters は website の adopters ページ記載分のみ引用 (Kubescape/Devtron/Helmper/Verity ほか)。それ以外は捏造しない。
- 未検証: ビルド/テストは未実行 (recon ではコード読みのみ)。write 段で `make build` 等を回すか要検討。
