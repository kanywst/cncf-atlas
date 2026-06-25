# status: kubescape

- [x] recon 完了 @ commit `82749757ff7eb629271dffa68e45beb7f085f7e4` (近いタグ `v4.0.9`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: canonical 実装リポは `kubescape/kubescape`（CLI + スキャンエンジン本体）。in-cluster の operator/node-agent/kubevuln/storage 等は同 org の別リポなので deep-dive の主対象には含めない。
- category は指定どおり Security & Compliance（verbatim）。maturity は Incubating で確認済み (S2, S3)。
- 言語 Go / build `go build -v .` / license Apache-2.0（src/LICENSE と GitHub API 双方で確認）。
- 代表操作トレースは `scan framework` を採用。end-to-end の path:line は recon.md に記載（leaf は `core/pkg/opaprocessor/processorhandler.go:544` の `regoEval`）。
- 非自明点: (1) `rego.SetRegoVersion(ast.RegoV0)` で OPA v1 ライブラリ上で v0 構文固定、(2) cosign 署名検証を Rego builtin 登録、(3) CEL 評価器は HEAD でスタブ、(4) per-control timeout を coverage に反映。
- 採用事例は中央 ADOPTERS.md (S6) に出典あり。捏造なし。
- write 段で確認したい薄い点: in-cluster microservices アーキ図（helm-charts/operator 側の最新構成）と Kubescape Storage(Aggregated API) の詳細は本 CLI リポのコードだけでは追えない。4.0 ブログ (S7) と self-assessment (S9) で補強する想定。
- module path 観測: `go.mod` は `/v3` のままだがタグは v4.0.x。write で触れるかは任意（混乱を避けるなら省略可）。
