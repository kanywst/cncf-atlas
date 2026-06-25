# status: Longhorn

- [x] recon 完了 @ commit `3b8885a0edb5c1bef3a0dac7d8c5eeb08a0414de` (longhorn-manager master, 2026-06-23)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決の判断: Longhorn はマルチ repo。傘 repo `longhorn/longhorn` は Shell + deploy yaml + chart + docs のみで実装コードが薄い。"primary implementation repo" としてコードを読むなら control plane の `longhorn/longhorn-manager` (Go) が本体。クローン/トレースはこちらで実施。star などコミュニティ計測は傘 repo を引く点を write 側でも踏襲すること。slug は `longhorn`
- カテゴリは指定どおり Storage & Database (verbatim)。maturity は CNCF Incubating で確定 (2021-11-04 昇格)
- data plane (longhorn-engine, longhorn-instance-manager, v2 SPDK engine) はクローンしていない。Internals は manager から見た data plane 越境点 (`engineapi`) までで止めた。write で data plane の I/O 経路を厚くしたい場合は longhorn-engine を別途 recon する必要あり
- 採用事例は CNCF 公式ブログ明記の Cerner / Tribunal Regional Eleitoral do Pará / Tyk の 3 件のみを採用。これ以外は出典なしのため不記載。Replicated の撤退事例を honest note として残した
- 確認待ち: v1.12.0 以降の master を pin しているので、write で「最新リリース」と書くなら v1.12.0 と明示し、コード anchor は pinned commit 基準であることを Overview/Internals に注記する
