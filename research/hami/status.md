# status: HAMi

- [x] recon 完了 @ commit `2487a240edb78705c2cbf35829f95f67793817ed`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- **成熟度の要判断**: タスク指定は Sandbox だが、CNCF projects 実物 (S2) は **Incubating** (2026-07-02 昇格)。pinned commit の README.md:25 はまだ "CNCF Sandbox" 表記のまま。tools.ts の `maturity` は事実優先で `Incubating` が正しいと思われる。書き段階で kt に最終確認。カテゴリは `Orchestration & Scheduling` で確定。
- HAMi-core (libvgpu.so) は別リポ (Project-HAMi/HAMi-core, submodule)。clone は depth 1 の shallow なので、HAMi-core のコード内部や HAMi 本体の first commit を一次で追うにはサブモジュール/full clone が要る。architecture/internals の主張は本体リポの `file:line` で足りているが、HAMi-core 内部の実装詳細 (実際の CUDA hijack コード) を書くなら second pass で HAMi-core を読む必要あり。
- 歴史の日付 (Sandbox 受理・Incubating 昇格) は CNCF/Dynamia のソース。donate 経緯の一次 (旧 4paradigm/k8s-vGPU-scheduler リポや donate PR) は未確認。書きで深掘るなら補強。
- 採用は CNCF ケーススタディ 3 社 (SF Technology / KE Holdings / NIO) が名前を出せる確実枠。それ以外は star/fork 等の signal のみ。
