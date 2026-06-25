# status: Notary Project (notation)

- [x] recon 完了 @ commit `51ff5eca6686f4990631435017e50121f8057baf`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: Notary Project の旗艦実装は `notaryproject/notation` (CLI)。旧 `notaryproject/notary` (TUF ベース v1, stars 3286) は別プロジェクト扱いで deep-dive 対象外
- pin commit は v2 開発線 (module `.../notation/v2`、`internal/version` は `v2.0.0-alpha.1`)。安定最新タグは `v1.3.2`。write 時にバージョン記述は「v1.3.2 安定 / v2 alpha 進行中」を併記すること
- カテゴリは "Supply Chain" verbatim 指定
- tagline EN: `Cross-registry signing and verification for container images and OCI artifacts.`
- tagline JA: `コンテナイメージと OCI アーティファクトをレジストリ横断で署名・検証するサプライチェーン署名ツール。`
- 採用は Microsoft (ACR/AKS) / AWS Signer / Harbor / Zot のみ出典あり。これ以外は捏造禁止
- src/ は gitignore 対象 (`research/*/src`)。コア署名ロジック `notation.SignOCI` / `notation.Verify` は依存 `notation-go` 側にあり本 repo に無い。write で深追いするなら notation-go を別途参照
</content>
