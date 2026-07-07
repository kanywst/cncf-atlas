# status: Dalec

- [x] recon 完了 @ commit `0d888c2e779bcbc61901e8855bed1a7aeb6c104d`（near tag `v0.21.2`）
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## 確定事項

- canonical repo: `project-dalec/dalec`（`Azure/dalec` は 301 リダイレクト）。
- category: Supply Chain。CNCF も landscape 上で Supply Chain Security に分類。
- 言語 Go、ライセンス Apache-2.0（verify 済み）、CNCF Sandbox（2025-10-08 採択）。
- tagline EN: Declarative YAML to native RPM/DEB packages and minimal, signed, SBOM-attested containers, using only Docker.
- tagline JA: YAML 1 枚から、ネイティブな RPM/DEB パッケージと、署名・SBOM 付きの最小コンテナを Docker だけでビルドする。

## メモ（次にやること）

- write 段で「LLB とは何か」を最初に 1 行定義してから使う（前方参照禁止ルール）。
- 採用事例は外部 adopter 不在を明記し、GitHub シグナル（stars 310 / forks 54 / contributors 約 38、2026-06-26）と Microsoft 内部利用に留める。捏造禁止。
- メンテナ全員 Microsoft という単一ベンダー性は「リスク/ガバナンス」節で正直に書く。
- getting-started は `docs/examples/hello.inline.yml` を基に、`docker build -f ... --target=azlinux3/rpm --output=_output .` と `--target=azlinux3 -t hello:dev .` をそのまま使えるよう検証済み。
