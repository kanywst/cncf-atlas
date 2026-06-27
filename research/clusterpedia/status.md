# status: clusterpedia

- [x] recon 完了 @ commit `bece343b72527405e1a3ff86aca449e7ed9fe3d9` (近いタグ v0.9.1)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo: `clusterpedia-io/clusterpedia`、Go、Apache-2.0、CNCF Sandbox (2022-06-17)。
- カテゴリ: Orchestration & Scheduling (マルチクラスタ集約/検索の control plane。Observability ではない。理由は recon.md 末尾)。
- 代表パス: `kubectl get` → Aggregated API `ResourceHandler.ServeHTTP` (`pkg/kubeapiserver/resource_handler.go:42`) → `RESTStorage.List` (`pkg/kubeapiserver/resourcerest/storage.go:110`) → `internalstorage` の SQL 変換 (`pkg/storage/internalstorage/util.go:184`)。write 章ではこの1本を図にすると効く。
- 非自明: 資源を JSON 1カラム (`types.go:105`) に丸ごと格納し、label/field selector を DB の JSON path 述語 (`json_builder.go`) に実行時変換。DB 方言ごとに分岐。
- 中核データ構造: `Resource` (types.go:90)、`internal.ListOptions` (clusterpedia/types.go:50)、`PediaCluster`/`ClusterSpec` (cluster/v1alpha2/types.go:59,70)、`JSONQueryExpression` (json_builder.go:46)、storage interface (storage.go:20,39)。
- 注意点: adopters は裏取り不可。GitHub シグナル (stars 878 等, 2026-06-27) で代替。helm の正式ホスト repo URL 未確定 → getting-started は git clone + dependency build 経路。
- 次の作業 (write 段階): EN/JA 6 セクション執筆 → tools.ts へ Orchestration & Scheduling で登録 → build/lint。
