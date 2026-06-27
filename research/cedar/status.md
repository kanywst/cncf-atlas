# status: Cedar

- [x] recon 完了 @ commit `991bacf654bf089bd3eec65351581ed4686923d0`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は `cedar-policy/cedar` で確定。canonical な実装リポジトリ (Rust ワークスペース)。`cedar-spec` (Lean 形式仕様) と `cedar-examples` は別リポジトリで、deep-dive の主対象ではない。
- カテゴリは Identity & Policy。認可ポリシー言語であり、OPA / OpenFGA / SpiceDB と同じ棚。
- 代表操作トレースは `Authorizer::is_authorized` (api.rs:1116) から core authorizer/evaluator/partial_response の concretize まで完了。deny-trumps-allow は `partial_response.rs:122-138` の match に集約。
- 非自明設計は SymCC (記号コンパイラ)。書く段では「決定可能性 → SMT 検証 → 反例」の流れを 1 段落で。OPA との差別化に効く。
- バージョン注意: HEAD の in-tree version は 4.11.0 だが、リリースタグは v4.11.2 (2026-06-22) が最新。write 段では「pinned commit は v4.11.2 直後」と書く。
- 採用企業は AWS Open Source Blog (src 3) 由来のみ引用可: Cloudflare / MongoDB / StrongDM / Cloudinary / Janssen Project / AWS (Bedrock AgentCore Policy, Systems Manager)。ADOPTERS ファイルは無い。捏造しない。
- 次にやること: atlas-write で en/ja 6 セクション生成 → tools.ts 登録 → docs:build。
