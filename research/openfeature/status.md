# status: OpenFeature

- [x] recon 完了 @ commit `80b9e9548163c1adbd28d45ca52364956e7fa08f` (tag `flagd/v0.16.0` / `core/v0.16.0`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 対象リポは参照バックエンド `open-feature/flagd` (Go, Apache-2.0)。プロジェクト本体 (仕様 + SDK 群) のうち、コードを追える主力としてこれを採用。spec (`open-feature/spec`) は markdown 中心のため副参照。
- カテゴリは「Developer Tools」で確定 (verbatim)。
- 代表 core operation: `ResolveBoolean` を gRPC ハンドラから JSONLogic 評価・go-memdb store 取得まで end-to-end でトレース済み (recon.md 内部実装の節)。
- 非自明な設計判断: store が hashicorp/go-memdb (7 index + ソース priority)、評価プロトコル 3 版の bufSwitchHandler 多重化。
- 次にやること (write 段): SDK 側の評価ライフサイクル (provider / hook / evaluation context) を仕様 (2) から補い、flagd と SDK の関係を図示。採用組織は CNCF ブログ (4) の eBay/Google/SAP/Spotify のみ引用、それ以上は足さない。
- build 未実行 (`make build` は workspace + Go toolchain 依存)。write/review 段で必要なら実行。
