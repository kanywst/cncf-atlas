# status: Thanos

- [x] recon 完了 @ commit `cc24370da67cc3a78c32caaee5af53b87da9f0d5`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決済み: thanos-io/thanos（CNCF Incubating、Observability）。
- pin は main 先端。最寄りタグ v0.42.0-rc.0（2026-06-23）、安定版は v0.41.0。write 段で「v0.41.0 系 / 開発は v0.42 系」と書けば安全。
- 代表操作トレース済み: Querier ProxyStore.Series の StoreAPI ファンアウト + 損者木 k-way merge。tagline はこれを軸に。
- tagline EN: Highly available Prometheus with unlimited, cost-efficient long-term metric storage and a global query view.
- tagline JA: Prometheus をそのまま拡張し、オブジェクトストレージで無制限・低コストな長期保存とグローバルなクエリビューを足す高可用メトリクスシステム。
- 採用名は CNCF blog 由来の 5 社 + Wikimedia のみ citable。これ以上は捏造しない。
- src/ は gitignore 済み（`research/<tool>/src`）。
