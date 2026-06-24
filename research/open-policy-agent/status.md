# status: Open Policy Agent (OPA)

- [x] recon 完了 @ commit `f75131f0e5932d24a76e638021ec66a8f07630fc`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 確定: `open-policy-agent/opa`（単一バイナリ `opa`。Gatekeeper / Regal / conftest は別リポで OPA の上に乗る層。deep-dive 主対象はこのコアリポ）。
- pin: `f75131f0e5932d24a76e638021ec66a8f07630fc`（2026-06-18 main 先端）。tag は付いていない dev HEAD で `var Version = "1.18.0-dev"`（`v1/version/version.go:13`）。リリース済み最新は `v1.17.1`。write 段で安定版に触れるなら v1.17 系か 1.0 を基準にする。
- カテゴリ: Identity & Policy で確定。CNCF landscape の表記は Security & Compliance だが、本質は汎用ポリシー / authz エンジン（K8s 専用ではない）なので tools.ts バケットは Identity & Policy が適切。
- 端から端まで追ったパス: `rego.New`（`v1/rego/rego.go:1414`）→ `Eval`（`:1502`）→ `PrepareForEval`（`:1788`）→ `PreparedEvalQuery.Eval`（`:559`）→ `(*Rego).eval`（`:2309`）→ `topdown.Query.Iter`（`v1/topdown/query.go:565`）→ `(*eval).eval`（`v1/topdown/eval.go:404`）→ `evalStep`（`:461`）→ `biunify`（`:1134`）。全 anchor を pin commit で実地検証済み。
- 非自明な設計判断 2 つ: (1) ルート `rego/` `ast/` `topdown/` が `v1/*` への型エイリアス shim（OPA 1.0 の言語切替で import path を壊さないため）。(2) `evalStep`（`v1/topdown/eval.go:461` 付近）が tracing 有無でほぼ同一コードを 2 本持つ。コメントが「trace 時は `defined` bool が heap escape して数百万 alloc するため意図的に分けた」と明記（`eval.go:461-480` 付近）。write の「設計の妙」候補。
- 中核データ構造: `Term`（`v1/ast/term.go:315`）/ `Value` interface（`:61`、実装 `Var :1148` `Ref :1215` `Object :2130`）/ `Module`・`Rule`・`Head`・`Body`（`v1/ast/policy.go:193 / :227 / :245 / :263`）/ `bindings`（`v1/topdown/bindings.go:32`、adaptive array→map）/ `Store` interface（`v1/storage/interface.go:20`）。
- license: Apache-2.0 を実地確認（`LICENSE` 冒頭 "Apache License Version 2.0"、GitHub API `spdx_id: Apache-2.0`）。
- 採用シグナル（2026-06-23 GitHub API）: star 11,884 / fork 1,595 / watcher 131 / open issue 366。adopter は `ADOPTERS.md` と CNCF graduation 発表で裏取りした名前のみ（Netflix / Goldman Sachs / Pinterest / T-Mobile / Atlassian / Capital One ほか）。捏造なし。
- Apple 移籍（2025-08）は一次出典（創設者ノート）で確認済み。要一次裏取りの保留は解消。OPA 本体は CNCF ガバナンス下で不変。
- write 段の TODO: install 手順を openpolicyagent.org で現行バージョン整合チェック。サーバが 1.0 以降 localhost 既定バインドである点を install セクションで明示。
