# status: Falco

- [x] recon 完了 @ commit `5123e90e58ee8187f0c135fcdf273eecd07ae571`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: `falcosecurity/falco` で確定。検知エンジン (`userspace/engine/`) とアプリ層 (`userspace/falco/`) を含む中心実装。syscall キャプチャとフィルタ実行は外部 `falcosecurity-libs` (libsinsp) に依存し CMake で pin。
- pinned commit は master (2026-06-18)。安定最新タグは `0.44.1` (2026-06-11)。describe ではタグに届かないので「近いタグ = 0.44.1」と記録。
- カテゴリは Security & Compliance にマップ。
- 代表操作トレース済み: `process_events.cpp` の event loop から `falco_engine::process_event` を経て `indexable_ruleset` の event-type index、`evttype_index_ruleset::run_wrappers` のフィルタ実行、`outputs->handle_event` まで path:line で押さえた。
- 非自明な設計判断: event-type でインデックスしたルールセット (`indexable_ruleset.h`)。高頻度 syscall で全ルール線形評価を避ける。
- write 段階の宿題: ルールの YAML 文法 (condition/macro/list/exceptions) と plugin フレームワークの図示。falcosidekick の出力 fan-out も触れると良い。adopters は ADOPTERS.md 記述付きのものだけ使う (捏造禁止)。
