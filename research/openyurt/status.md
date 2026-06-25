# status: OpenYurt

- [x] recon 完了 @ commit `f01cbf5655383d1c695cfb72097827bc9d22fb8b` (近いタグ `v1.7.0`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: [openyurtio/openyurt](https://github.com/openyurtio/openyurt)。CNCF Incubating (2025-07-02 昇格)。Apache-2.0、Go (`go 1.25.0`)。
- カテゴリは指定どおり "Orchestration & Scheduling" を verbatim 使用。
- tagline (en): Extend a vanilla Kubernetes control plane to edge nodes with offline autonomy, keeping the upstream API intact.
- tagline (ja): 素の Kubernetes をそのまま使い、エッジノードにオフライン自律と地域分割を足すクラウドエッジ基盤。
- 中核トレース済み: YurtHub のプロキシ -> クラウド転送 -> dualReadCloser tee でローカルキャッシュ書き込み -> オフライン時 errorHandler/localProxy 復元。
- 非自明な設計: pool-scope metadata (services/endpointslices) を NodePool 内の leader YurtHub に集約し multiplexer で多重化。
- 保留: named adopter は未確認 (root に ADOPTERS.md 無し、CNCF blog も企業名なし)。write 段で community repo / website の ADOPTERS を当たるか、企業名なしで採用シグナル (stars/contributors/maintainer 所属) のみ提示する。
- src/ は gitignore 済みの clone。star 数 1968 は 2026-06-25 時点。
