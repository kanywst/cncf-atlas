# status: linkerd

- [x] recon 完了 @ commit `7977d505fc3d9ae7dddddd11779a82f813e405ac` (近いタグ `edge-26.6.3`)
- [x] sources 整理 (14 件、全て 2026-06-22 参照)
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 主実装は `linkerd/linkerd2` (Go の control plane + CLI)。データプレーンの `linkerd-proxy` は別リポ `linkerd/linkerd2-proxy` (Rust) なので、write 時に「2 リポ構成」を明示すること。
- カテゴリは Service Mesh & Networking。tools.ts 登録時のカテゴリ名は CATEGORY_ORDER の表記に合わせて確認。
- 代表操作として proxy 注入 webhook を端から端まで追えている (`controller/webhook/server.go` -> `controller/proxy-injector/webhook.go` -> `pkg/inject/inject.go`)。mTLS の `Certify` 経路も補助として使える。
- 非自明設計: 注入パッチを Helm `patch` チャートのレンダリングで作り、末尾カンマを正規表現で除去 (`pkg/inject/inject.go:814-834`)。write の「設計の妙」セクション候補。
- 採用事例は ADOPTERS.md と公式 adopters ページのみ引用。捏造しない。Imagine Learning は数値付きケーススタディとして使える。
- `src/` は .gitignore 対象 (clone 済み、shallow)。
