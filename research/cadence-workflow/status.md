# status: Cadence Workflow

- [x] recon 完了 @ commit `66dcbafb3089050e436f571eab288f6d51a34993`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は `cadence-workflow/cadence` に移管済みだが `go.mod` の module path は今も `github.com/uber/cadence`。本文で混同しないこと。
- 近いタグは `v1.4.1-prerelease31` (prerelease)。安定リリースは `v1.4.0` (2026-02-27)。書き物では「pinned commit は v1.4.0 後の master」と書くのが正確。
- カテゴリは Orchestration & Scheduling で確定。Temporal が最も近い兄弟 (同じ創業者の 2019 fork)。Airflow/Argo とは用途が違う (DAG バッチ vs 汎用 durable execution) ことを write 段で明示。
- 採用企業は ADOPTERS.md に Uber / NetApp(Instaclustr) / DoorDash / Cloudera が明記。捏造不要、これだけで足りる。
- 非自明な設計判断として rangeID fencing (`shard/context.go:1117`) を推す。write 段でも 1 つの目玉にする。
- 未確認: matching service の task dispatch 経路は深追いしていない。write で activity dispatch を扱うなら `service/matching/` を追う必要あり。
