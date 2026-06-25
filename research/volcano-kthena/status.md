# status: volcano-kthena (Kthena)

- [x] recon 完了 @ commit `affd5be8b40aca466c7e39fb8fe41ed6e6ce3b44`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: `volcano-sh/kthena`。Kthena は Volcano（CNCF Incubating）のサブプロジェクト。catalog カテゴリは指定どおり "Orchestration & Scheduling"。
- pin した commit はタグ無しの `main` HEAD（2026-06-24）。最新リリースタグは v0.4.0（2026-04-21）。write 段で「v0.4.0 系の main 先端」と書けば誤解が無い。
- 採用組織: 引用できる named な本番採用先は未発見。開発元 Huawei Cloud のみ言及可。Volcano のコントリビュータ企業（Amazon/Google/Oracle 等）を Kthena 採用先に流用しない。
- write 段の核: (1) Volcano gang scheduling への委譲 + 単一 ServingGroup（dual-LWS 不採用）、(2) router L7 での KV/prefix キャッシュ対応ルーティングと PD 分離。代表オペは「推論リクエストが router を通る経路」（recon の代表オペA/B）。
- 確認保留: README が router を "reference implementation" と明言している点（`README.md:64`）は成熟度の注記として write に残す価値あり。
