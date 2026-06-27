# status: chaosblade

- [x] recon 完了 @ commit `39a0c02e5f34af980f561440c0f1c218a3cde821`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pin した HEAD は `blade-ai-v0.5.0` タグ (2026-06-18)。mainline のプロダクションリリースは `v1.8.0`。write 段では「コア CLI = v1.8.0 系、blade-ai = 0.5.x の新コンポーネント」と書き分ける
- 言語注意: GitHub 統計は Python 74.2% と出るが、これは新規 `blade-ai/` (Python) のせい。`blade` 本体は Go (go 1.25)。deep-dive のコード解説は Go 側を主役にする
- 設計の目玉は「spec 駆動 dispatcher + 別 executor バイナリ (chaos_os) への shell out」。write の core-internals はここを軸にする (`exec/os/executor.go:66-67`, `cli/cmd/exp.go:140`)
- 採用企業は Alibaba ブログ由来の ICBC / China Mobile / Xiaomi / JD.com の 4 社のみ citable。ADOPTERS ファイルは無い。捏造しない
- カテゴリ: Chaos Engineering で確定
- 未確認: contributor 数は anon 込み per_page=1 の last page から ~52 と推定。write で厳密値が要るなら `contributors` 全ページ集計し直す
