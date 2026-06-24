# status: SPIRE

- [x] recon 完了 @ commit `73215a39879e40d3e50cbac1e6a845d518df00aa` (近いタグ `v1.15.1`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: `spiffe/spire` が主実装リポ。SPIFFE 仕様本体は別リポ `spiffe/spiffe`。deep-dive は実装の SPIRE を対象にする。
- カテゴリ: CNCF landscape では Identity & Policy。バケットも Identity & Policy にマップ。
- pinned commit は `v1.15.1` の 50 commit 先 (main の HEAD)。タグそのものではない点に注意。`src/` は depth 1 clone なので full history は無い (tag だけ追加 fetch 済み)。
- 中核トレースは Workload API `FetchX509SVID` を採用。peer credential (`SO_PEERCRED`) → workload attestor → cache subscriber → stream push の流れ。path:line は recon.md に記載。
- 採用事例は ADOPTERS.md と CNCF アナウンスに出典がある名前のみ採用。捏造なし。
- write 段階での注意: 「秘密ゼロのブートストラップ」「鍵がネットワークに出ない」「二要素 attestation」の 3 点が SPIRE 固有の語りどころ。SPIFFE (標準) と SPIRE (実装) の区別を読者に最初に立てること。
