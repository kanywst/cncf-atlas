# status: Connect RPC

- [x] recon 完了 @ commit `765b3c634490a946231611220e2f993b4214ab9d`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は `connectrpc/connect-go` (canonical な Go 実装) に確定。module path は `connectrpc.com/connect`。
- pin: `765b3c6` (2026-06-24, main)、近いタグ `v1.20.0` (2026-05-20)。コード内 `Version` は `1.21.0-dev`。
- category: Developer Tools (gRPC と同一分類)。maturity: Sandbox (受理 2024-04-13)。license: Apache-2.0 (検証済み)。
- 代表トレース: unary client 呼び出し (`client.go` -> `handler.go`)。非自明な設計: side-effect-free unary を HTTP GET にして cacheable にする (`protocol_connect.go:985-1044`)。
- 採用事例: citable な named adopter は未発見。ADOPTERS ファイルなし。GitHub シグナルで代替済み (connect-go star 3,962 @ 2026-06-29)。
- 保留: named adopter を CNCF case study / カンファレンストークから拾えるか write 前にもう一度探す価値あり。なければ GitHub シグナルのみで書く。
