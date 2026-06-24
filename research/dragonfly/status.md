# status: Dragonfly

- [x] recon 完了 @ commit `0041afa00d64585052476d99b4b00a62111a88ed`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: 主実装は `dragonflyoss/dragonfly` (Go の scheduler + manager)。データプレーン client (dfdaemon/dfget) は Rust の別リポ `dragonflyoss/client`、console / helm-charts も別リポ。deep-dive 主対象は本リポで確定。
- pin: shallow clone のため `git describe` 不可。近い安定タグ `v2.4.3` (2026-03-11)、HEAD は `v2.4.4-rc.3` (2026-06-09) より後の main。
- representative core operation: AnnouncePeer ストリーム → handleRegisterPeerRequest → ScheduleCandidateParents → FindCandidateParents → 評価器の重み付きスコアで親選定 → DAG にエッジ → NormalTaskResponse。path:line は recon.md に記載済み。
- 非自明設計: タスク単位の DAG + サイクル検出 (`pkg/graph/dag/dag.go:277`)、親候補のランダムサンプリング + 4 因子重み付けスコア (`evaluator_default.go:108`)。
- 注意: Web 記事の一部 (「supernode が 4MB チャンク集中制御」) は Dragonfly 1.x の話。2.0 は Manager/Scheduler/Seed Peer/Peer 役割分割。write 時に混同しないこと。
- 採用事例は `ADOPTERS.md` 由来のみ使用。捏造禁止。Datadog のみ用途が lazy loading と明記。
- カテゴリは Runtime にマップ。tagline は en/ja とも P2P 配布アクセラレータの軸で。
