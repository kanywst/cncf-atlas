# status: cdk8s (CDK for Kubernetes)

- [x] recon 完了 @ commit `558f788bc27873892bce99c7def33106861a2324`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は `cdk8s-team/cdk8s-core` を採用 (npm `cdk8s` の実装本体)。star 等の採用シグナルはアンブレラ `cdk8s-team/cdk8s` を引用すること。混同注意。
- clone は shallow でタグ無し。pinned commit は `558f788`、対応する直近リリースは `v2.70.80` (2026-06-23)。
- ソースは clone ルート直下ではなく `src/src/*.ts`。path:line 引用は repo 相対で `src/app.ts` 等と表記している (clone 内の実体は `src/src/app.ts`)。write 段で参照する際は実パスに注意。
- 代表操作のトレースは `App.synth()` (FILE_PER_CHART) を採用済み。
- 非自明な設計判断: `Symbol.hasInstance` override による instanceof 回避 (jsii 多言語 + ライブラリ多重コピー対策)。
- named adopter は未特定。ADOPTERS ファイル無し。捏造しない。GitHub シグナルで代替。
- カテゴリ: App Definition & GitOps。
