# status: metal3-io (baremetal-operator)

- [x] recon 完了 @ commit `56169b71d8e1cb761b734d3a3918f59597e97db1`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: Metal3 は複数リポ構成。deep-dive のコアは `metal3-io/baremetal-operator` (BMO) で確定。Ironic を K8s API で包む本体。CAPM3 / IPAM / IrSO は周辺として言及するに留める。
- カテゴリは指定どおり "Orchestration & Scheduling" を verbatim で使用。
- 成熟度は CNCF Incubating (2025-08-27 昇格) で確認済み。
- pinned は main HEAD (2026-06-24)。最新リリースタグは v0.13.0。shallow clone のため `git describe` での距離計算は不可、タグは ls-remote / `gh release` で確認。
- 非自明設計の目玉: provisioner backend を Go `plugin` (.so) で実行時ロード (`pkg/provisioner/plugin.go`、`main.go`)。write 段でここを深掘りする価値あり。Go plugin の制約 (ビルド整合・Linux 寄り) も触れる。
- 採用事例は CNCF blog 記載の 5 社 (Fujitsu / IKEA / SUSE / Ericsson / Red Hat) のみ。これ以外は出典が無いので書かない。
- 数値の二系統に注意: BMO リポ単体 (star 743 等, 2026-06-24) と プロジェクト全体 DevStats (star 1,523 等, 2025-08 CNCF blog 時点)。write では出典・日付を必ず併記し混同させない。
- 薄い点: ironic 実装側 (`pkg/provisioner/ironic/`) は未読。Provision の Ironic 側ステップ詳細を書くなら second pass が要る。今回は BMO の状態機械 + plugin 機構までで十分な厚み。
