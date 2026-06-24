# status: kubernetes

- [x] recon 完了 @ commit `8c64324b69ac1e444979f2fddf07a63baa759e5a`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pin は master HEAD (2026-06-22)。タグではないので、write 段で版を書く時は「v1.37 開発サイクル、直近安定版 v1.36.2」と表現する。depth-1 clone なのでローカルに tag 解決不可、`git ls-remote --tags` で確認済み。
- 代表操作はスケジューラの 1 サイクル (`pkg/scheduler/schedule_one.go`)。write でもこの end-to-end を主軸にすると具体的。非自明ポイントは適応的 `percentageOfNodesToScore` (`:858`) と assume + 非同期 bind (`:141`)。
- adopter は Spotify / adidas のみ確証あり (kubernetes.io ケーススタディ)。それ以外 (Airbnb 等) は一次ソース未確認なので write では使わない。
- カテゴリ bucket は Orchestration & Scheduling で確定。
