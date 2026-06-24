# status: Vitess

- [x] recon 完了 @ commit `792474356c3f7d220092534e768ce9989996ab98`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pinned commit は `main` の HEAD でリリースタグ無し。`versionName=25.0.0-SNAPSHOT`、直近リリースタグは `v24.0.1` (2026-05-07)。write 段では「v25 開発中の main を pin」と書くこと。
- 代表トレースは VTGate の SELECT 実行パス (`Executor.Execute` から `Route.TryExecute` のシャード fan-out)。write でフロー図 (mermaid) を起こすと効く。
- 非自明設計は Vindex 抽象 (シャードキーを主キーから分離、secondary lookup vindex)。
- 採用事例は `ADOPTERS.md` と CNCF 告知のみ引用。捏造禁止を厳守済み。
- 未深掘り: VReplication / VStream (MoveTables・Reshard の実体)、vttablet 側のクエリ consolidation、トポロジ watch。write で必要なら `go/vt/vttablet/` と `go/vt/vtgate/vstream*` を追う。
