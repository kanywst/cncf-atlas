# status: Meshery

- [x] recon 完了 @ commit `68d542afa9e40e15e3d032bf3ed1d10eb2347b62`
- [x] sources 整理
- [x] write: en 6 セクション
- [x] write: ja 6 セクション
- [x] tools.ts に登録 (card から昇格)
- [x] `npm run docs:build` グリーン
- [x] markdownlint clean

## メモ

- pin は master HEAD (2026-11-15)。最新リリース v1.0.79 の後に 569 コミット。ページでは「v1.0.79 以降の master」と書く
- カテゴリは App Definition & GitOps から Provisioning & Infrastructure へ移す。landscape の Provisioning / Automation & Configuration に対応 (Crossplane、OpenTofu と同じ扱い)
- maturity は tools.ts 上 Sandbox のままだったので Incubating に直す
- 代表オペレーションは design deploy (`/api/pattern/deploy` → stage chain → planner → `k8s.Deploy`)。深掘りは関係性評価 (Rego / Go の 2 エンジン)
- 薄いところ: adopter は ADOPTERS.md の社名リストだけで用途が無い。TOC も adopter インタビュー未提出を指摘。stars は CNCF ブログ (ほぼ 15,000) と GitHub API (12,203) で食い違うので API 値を使う
- Kanvas の帰属 (どの org、OSS か) は一次情報で確定できず。ページでは extension とだけ書く
- write 済み: docs/tools/meshery, docs/ja/tools/meshery。tools.ts は card から昇格 (tier/repo 削除、category を Provisioning & Infrastructure、maturity を Incubating に)
- review 済み: em dash なし、本文の出典付け直し (README 引用、adapter の記述を docs 出典に)
- Getting Started のコマンドは未実行。実機で通すのは次の課題
