# status: ContainerSSH

- [x] recon 完了 @ commit `ce7d2b6dbe3a592355c50ef4d80f7ae10eb3fa26`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は `ContainerSSH/ContainerSSH` (module `go.containerssh.io/containerssh`)。旧 `libcontainerssh` は main repo に統合済み。
- pin は v0.6.0 (2026-03-23) より後の `main` HEAD。最新リリースは v0.6.0。
- カテゴリは Developer Tools。honeypot 用途が強いので Security & Compliance とも迷うが、本体は「SSH 経由で使い捨てコンテナを起こす開発者アクセス基盤」なので Developer Tools。
- 採用組織は citable なものが無い。GitHub シグナル (stars 3,061 / forks 106 / contributors 21、2026-06-26) で代替。捏造しない。
- 設計の目玉: 認証/設定を webhook に外出し + Docker の connection/session 実行モード分岐 (`internal/docker/handler_channel.go:91-95`)。write 段でここを軸にする。
- getting-started は examples repo の docker-compose quick-start を使う。任意パスワードを通すテスト用構成である点を明記すること。
