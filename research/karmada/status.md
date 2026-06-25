# status: Karmada

- [x] recon 完了 @ commit `658499d7080640f78c3d9f5cbf9db58428a902a3`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録 (category: Orchestration & Scheduling)
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決済み: `karmada-io/karmada`。Go / Apache-2.0 / CNCF Incubating で確定。
- 近いタグは `v1.19.0-alpha.0`、stable は `v1.18.0`。pin は master HEAD (alpha 以降のコミット)。
- 中核ストーリー: テンプレート → detector → ResourceBinding → scheduler (filter/score/select/assign) → binding controller が Work 生成 → execution controller がメンバークラスタへ適用。write 段はこの 1 本を主軸にできる。
- 推し設計: Lua Resource Interpreter (任意 CRD 対応)、Push/Pull モード、execution space namespace。
- adopters 実名は `karmada.io/adopters` のみが一次情報。ADOPTERS.md には実名なし。捏造しないこと。
- 次にやること: write 段で en/ja 6 セクション。install 節は karmadactl init / Helm / operator の 3 経路を示す (cmdinit.go:121)。
