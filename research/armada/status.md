# status: armada

- [x] recon 完了 @ commit `85b582dedbf1e4a0c049ff3255bf23fda83fd3b4`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo: `armadaproject/armada`、pinned commit `85b582d` (近いタグ `v0.21.5` 2026-06-17、アクセス時の最新 release `v0.21.6` 2026-06-26)、Apache-2.0、Go 1.26.1
- category: Orchestration & Scheduling
- tagline EN: Multi-cluster batch scheduler that queues and runs millions of Kubernetes jobs a day with fair-share, gang, and preemption.
- tagline JA: 複数 Kubernetes クラスタを束ね、公平配分・ギャング・プリエンプションで数百万のバッチジョブを毎日捌く高スループットスケジューラ。
- write 段の注意:
  - 受理日は CNCF project page の 2022-07-25 を採用 (blog とずれあり、深追いしない)
  - adopters は G-Research のみ確証。それ以外は GitHub シグナル (stars 602 / forks 166 / contributors ~102 @ 2026-06-26) で示す
  - 推し材料: インメモリ copy-on-write jobdb (MVCC 的スナップショット)、Pulsar イベントソーシング、DRF fair-share、out-of-cluster キューイング
  - 中核トレース: SubmitJobs → Pulsar publish → scheduler cycle (leader 限定)
