# status: Microcks

- [x] recon 完了 @ commit `24db0541f684f55def3eb1aa3277cf5b78526855`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `microcks` / category: `Developer Tools` / maturity: `Incubating`。
- tagline (en): Turn your OpenAPI, AsyncAPI, gRPC, GraphQL, SOAP, and Postman artifacts into running mocks and contract tests in seconds.
- tagline (ja): OpenAPI/AsyncAPI/gRPC/GraphQL/SOAP/Postman の仕様から、動くモックと契約テストを数秒で生成する CNCF Incubating のツール。
- pin した HEAD はタグ `1.15.0-rc1` の直前 commit。write 段では最新安定版 `1.14.0` を基準バージョンとして言及するのが無難。
- 核となる説明軸: import 時に `dispatchCriteria` 文字列を事前計算して実行時は MongoDB 完全一致検索で応答を選ぶ対称設計 (`RestInvocationProcessor` と `OpenAPIImporter`)。
- 薄い箇所 / 二次調査候補: async minion (Quarkus) のテスト実行フローは未トレース。gRPC/GraphQL/SOAP のモック経路も REST と別 controller なので write 前に必要なら 1 本追う。MCP サーバ公開 (`McpController`) は新機能で深掘り余地あり。
- 採用は `ADOPTERS.md` に出典リンク付きで多数。write では出典が強いもの (J.B. Hunt, Société Générale, BNP Paribas, Amadeus, GSMA) を優先。
