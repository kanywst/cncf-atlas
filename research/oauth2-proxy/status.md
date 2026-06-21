# status: OAuth2 Proxy

- [x] recon 完了 @ commit `10b68716e53644a8fa0cbbaf156bf67ef93a017d`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pinned commit は v7.15.3 (2026-06-09) の後の master。タグそのものではない点を write 時に注意。
- category = Identity & Policy / maturity = Sandbox (CNCF 2025-10-02 受理)。
- 代表操作の trace は `Proxy` -> `getAuthenticatedSession` -> provider.Authorize、ログインは `OAuthStart`/`OAuthCallback`。非自明設計は redis ストアの per-session ticket secret (`pkg/sessions/persistence/ticket.go`)。
- named adopter の一次ソースは未確定。CNCF 申請の contributor 所属 (Microsoft/OpenAI/Adobe/Morgan Stanley) は採用組織とは別物として扱う。捏造しない。
