# status: OpenKruise

- [x] recon 完了 @ commit `439d98db56ac49050f8973c51fccbabfba283a95` (近いタグ `v1.9.0`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: CNCF landscape / GitHub 上 OpenKruise の primary 実装は `openkruise/kruise`。関連の kruise-rollouts / kruise-game / kruise-helm は別リポなので deep-dive 対象外。
- カテゴリは指示どおり "Orchestration & Scheduling" 固定。
- ライセンスは Apache-2.0 を `LICENSE.md` で確認済み。GitHub API の `NOASSERTION` はファイル名 `LICENSE.md` 由来の誤判定なので write 時に Apache-2.0 と明記する。
- 採用組織は CNCF Incubating blog の列挙 (Alibaba/Baidu/Bringg/LinkedIn/Lyft/Shopee/Oppo/Spectro Cloud) のみ citable。リポ内 `ADOPTERS.md` は無い。これ以外を増やさない。
- 数値 (stars 5,273 / forks 892 / contributors ~160) は 2026-06-24 時点。write 時に参照日を併記。
- write 段で説明する目玉: in-place update の三者構成 (controller + mutating webhook readiness gate + kruise-daemon containermeta)。CloneSet を代表例にすると end-to-end が綺麗に通る。
- `src/` は gitignore 対象 (clone 済み、depth 1 + tag v1.9.0 を追加 fetch)。
