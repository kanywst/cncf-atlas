# status: Rook

- [x] recon 完了 @ commit `63eed4ed473c47f8efc6e26aefcd50ab16fffa3b`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は `rook/rook` で確定。Ceph 専用 operator。Cassandra/NFS provider は別 repo へ分離済みなので触れない
- 近いタグは `v1.20.1` (2026-06-16)。pinned commit はそれより後の master HEAD (2026-06-19)
- 代表操作トレースは CephCluster reconcile (`controller.go:311` → `cluster.go:98` の mon/mgr/osd 起動)。write 段でそのまま使える
- 非自明設計: SIGHUP で manager 丸ごと再生成 / `ClusterInfo.Context` の持ち回り。両方とも write で 1 つ拾えばよい
- adopters は `ADOPTERS.md` 記載のみ使う (捏造禁止)。CNCF case study は未確認なので write 段で必要なら追加調査
- 数値は 2026-06-22 時点 (stars 13,553 / forks 2,827 / contributors 約 384)。write 時に再確認推奨
