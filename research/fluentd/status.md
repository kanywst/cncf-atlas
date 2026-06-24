# status: fluentd

- [x] recon 完了 @ commit `729eb328e43f6bb66efe457787c7af81b3f2d72a`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pin した HEAD は v1.19.2 (2026-02-19 リリース) より後の master 開発版。`lib/fluent/version.rb:23` は `1.19.0` を宣言するので write 段では「最新安定版 v1.19.2、pin は master HEAD」と区別して書く。
- ライセンスは Apache-2.0 を実物 (`LICENSE` 全文 + gemspec) で確認済み。
- カテゴリは Observability (ログ収集/転送)。tagline は input -> tag route -> filter -> buffered output の統一ロギング層を軸に。
- 採用企業は CNCF graduation 発表 (出典 5) の Atlassian / AWS / Change.org / CyberAgent / LINE / Nintendo / Microsoft のみ引用可。リポ ADOPTERS.md は testimonials リンクのみで具体名なし。捏造しない。
- 代表トレース anchors: `event_router.rb:104,114,133,192` / `output.rb:876,897,914,1118` / `buffer.rb:330,482,559`。設計判断は EventTime msgpack ext (`time.rb:91`) と FilterOptimizer (`event_router.rb:202`)。
- 数値は 2026-06-22 取得: stars 13,546 / forks 1,392 / contributors ~285。write 時に再確認推奨。
