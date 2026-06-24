# status: CoreDNS

- [x] recon 完了 @ commit `cc88c96e0e1d67e5d8c81f4a4a1209451e30c275`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決済み: `coredns/coredns` が唯一の主実装 repo。caddy fork は `coredns/caddy` に分離されているが本体ではない。
- pin: HEAD は `v1.14.4` (2026-06-09) の後の commit (2026-06-17)。shallow clone のため `git describe` は出ない。近いタグは `v1.14.4`。
- カテゴリ: CNCF landscape では Service Mesh & Networking。バケットも同名で確定。
- write 段で使える代表トレース: `Server.ServeDNS` → zone 最長一致 → `pluginChain.ServeDNS` → forward plugin → `proxy.Connect`。path:line は recon.md に記載済み。
- 非自明な設計: plugin chain を逆順畳み込みで構築 (`server.go:107-108`)。図解する価値あり。
- 採用者は ADOPTERS.md と CNCF/InfoQ のみを根拠にした。捏造なし。
