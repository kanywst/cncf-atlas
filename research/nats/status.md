# status: NATS

- [x] recon 完了 @ commit `bd058fac3d0c04398698b113e986b35065212fda`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: primary implementation は `nats-io/nats-server` (Go)。クライアント 40+ 言語は `nats-io` org の別リポなので deep-dive 本体はサーバで正しい。
- pin はデフォルトブランチ HEAD (VERSION 2.15.0-dev)。最新リリースタグは v2.14.2 (2026-06-02)。write 時はサーバ挙動を 2.14 系として説明しつつ HEAD を pin として明記。
- core publish のトレースは L1 結果キャッシュ + sublist 二段キャッシュが肝。write の Internals 節はここを主役に。
- 採用企業は出典付きのみ記載 (The Stack 記事 + cncf/toc#2042)。Mastercard は未確認なので使わない。
- カテゴリは "Messaging & Streaming" 固定。
- 確認保留: graduation の最終判定 (まだ Incubating)。write 時に CNCF project page で最新ステータス再確認。
