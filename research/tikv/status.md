# status: TiKV

- [x] recon 完了 @ commit `2ce11742650d4dd1c87070a82f9ae816ec94d61c`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `tikv` / category: Storage & Database / maturity: Graduated。
- 主リポジトリは `tikv/tikv`。PD (`tikv/pd`) とクライアント群は別リポジトリなので write 時に混同しないこと。
- read 経路 (`kv_get`) と write 経路 (`prewrite`) の両方を `file:line` 付きでトレース済み。write ステージは read 経路をメインの図解に使うと分かりやすい。
- 非自明ポイント候補: (1) Engine トレイトによる RaftKv/RaftKv2 抽象、(2) 読みが Raft ログを通らないリース読みの非対称設計、(3) 4 CF (default/lock/write/raft) の MVCC レイアウト、(4) short_value 埋め込み最適化、(5) concurrency_manager + max_ts による async-commit/1PC。
- 採用事例は adopters ページ [7] と JD Cloud ケーススタディ [8] のみ確実。それ以外は卒業告知 [1] の引用に限定。捏造しない。
- 要二次確認: Incubating 昇格の正確な月 (出典で April/May 揺れ)。Deep Dive TiKV ドキュメント [10] を write 時にアーキ図の裏取りに使える。
