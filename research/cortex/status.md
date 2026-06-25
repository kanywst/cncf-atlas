# status: Cortex

- [x] recon 完了 @ commit `42c26e7eab49ce36bb4dc80ecbcf365fe0e33899`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pinned commit `42c26e7` (2026-06-23)、近いタグ `v1.21.1` (2026-06-04)。`src/` は gitignore 済み (depth 1 clone)。
- カテゴリは指定通り Observability で固定。
- tagline (en): "Horizontally scalable, multi-tenant, long-term storage for Prometheus metrics."
- tagline (ja): "Prometheus メトリクスを水平スケールさせる、マルチテナント対応の長期ストレージ。"
- write 段で強調したい筋: push (remote write) 集中受信モデル / ハッシュリングによる sharding と quorum 書き込み / per-tenant TSDB / sync.Pool + unsafe による GC 最適化。
- 注意点: 外部比較ブログの「Cortex は停滞・maintenance mode」記述はリポ実態 (v1.21.x を 2026 年も継続リリース、archived=false) と矛盾。write でこの誤情報を引かない。Mimir は Cortex の fork という関係のみ事実として扱う。
- 代表オペレーションのトレース: api.go:296 -> push.go:49 -> distributor.go:747 -> ring/batch.go:74 -> ingester.go:1324。path:line は全て pinned commit で確認済み。
