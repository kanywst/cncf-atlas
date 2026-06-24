# status: SPIFFE (go-spiffe)

- [x] recon 完了 @ commit `e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: 「SPIFFE」はフレームワーク/標準。仕様本体は `spiffe/spiffe`、サーバ実装は `spiffe/spire`（別ターゲット）。コードを追えるアプリ側の正準ライブラリとして `spiffe/go-spiffe` を主対象に選定した。write 段で「SPIFFE = 標準 + Workload API、go-spiffe はその Go クライアント、SPIRE は実装」の三者関係を冒頭で明確にすること。
- pin: `v2.8.1`（tag）/ sha `e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96`。
- 中核トレース: `NewX509Source` → watcher goroutine → `WatchX509Context` gRPC stream → `parseX509SVIDs` → `x509svid.ParseRaw` → `GetX509SVID`。受信検証は `x509svid.Verify`。
- 非自明な設計: `spiffeid.ID` が「正準文字列 + pathidx」表現（比較可能・割当ゼロ）。
- 注意: `src/` は go-spiffe に貼り替え済み（以前は誤って spire がクローンされていた）。.gitignore 対象。
- 未確認: go-spiffe の正確な contributor 総数（38 以上までしか確認していない）。write で厳密値が要るなら追加取得。
