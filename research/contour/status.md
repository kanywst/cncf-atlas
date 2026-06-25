# status: Contour

- [x] recon 完了 @ commit `8f970f082e645bf0be5119c376ac4f4d40a19acd`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: `projectcontour/contour` で確定 (公式サイト・CNCF・GitHub すべて一致)。
- pinned は `main` (commit `8f970f0`, 2026-06-24)。最新リリースタグは `v1.33.5` (2026-05-28)。`main` は v1.33.5 より先行のため `git describe` は不可。write 段階でバージョン記述する際は「main / 最新リリース v1.33.5」と明記する。
- カテゴリは指定どおり "API Gateway" で固定。
- 採用事例は 2 系統に分けて引用済み: 現行 adopters ページ (SnappCloud / Bugfender / Knative / VMware / Flyte / Gojek / DaoCloud) と 2020 受理時 (Adobe / Kinvolk / Kintone / PhishLabs / Replicated)。捏造なし、すべて出典あり。
- 代表オペレーションのトレースは「HTTPProxy 変更 -> informer -> EventHandler holdoff -> DAG Build -> Observer fanout -> RouteCache/SnapshotHandler -> xDS gRPC -> Envoy RDS」で確定。path:line は recon.md に記載。
- 非自明な設計判断: ConstantHash による単一ノード fanout + EDS だけ LinearCache 分離。
- 次にやること: write 段階で 6 セクション (en/ja) 生成、tools.ts 登録、build/lint。
- src/ は gitignore 対象 (clone 済み、コミットしない)。

## taglines

- EN: Envoy-powered Kubernetes ingress controller that adds a richer HTTPProxy CRD and full Gateway API support.
- JA: Envoy を制御プレーンとして駆動し、独自 HTTPProxy CRD と Gateway API に対応する Kubernetes Ingress コントローラ。
