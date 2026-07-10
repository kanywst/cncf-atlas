# status: higress

- [x] recon 完了 @ commit `bd9c4c5104727ef5dfe24e23d2ba4786795db828`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: higress / category: API Gateway / maturity: Sandbox。
- canonical repo は `higress-group/higress` (git remote 確認済)。go.mod の import path は `github.com/alibaba/higress/v2` のまま。
- pinned SHA は main の 2026-07-07 コミットで、release tag v2.2.3 (2026-06-25) の少し先。shallow clone のため `git describe` 不可。write 側で Overview / Internals に SHA を明記すること。
- CNCF Sandbox の正確な TOC 投票日は CNCF ブログ (2026-03-25 公表) からは特定できず。厳密な日付が要るなら cncf/sandbox の onboarding issue を追う (second pass 候補、必須ではない)。
- 採用事例は CNCF ブログ (S3) と ADOPTERS.md (S4) の二重確認済み。捏造なし。
- アーキ trace は Ingress → IngressConfig.List → convert* → Istio config → xDS の一本を file:line 付きで確定済み。Wasm プラグインパスも request-block で確定。
