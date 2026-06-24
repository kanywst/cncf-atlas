# status: Envoy

- [x] recon 完了 @ commit `6a45c7d9fee960d6457c44205faf6307157efc24`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: 主実装は `envoyproxy/envoy` (C++ / Bazel)。`api` (xDS protobuf)、`mobile` (Envoy Mobile) は同リポ内サブツリー。data-plane-api は読み取りミラー。deep-dive は本リポでよい。
- 近いタグは `v1.38.2`、pinned HEAD は `1.39.0-dev` 開発線上。write 時は「最新安定は 1.38 系」と書く。
- 代表オペレーションは HTTP リクエスト受信 -> ルート確定までを `conn_manager_impl.cc` で固定済み。write の architecture セクションはこの path:line を流用する。
- 非自明設計は thread-local ロックフリーモデル (`thread_local_impl.h`)。write の hook に使える。
- ADOPTERS ファイルなし。採用名は Lyft / Google / Apple / Microsoft / eBay / Istio のみ (出典付き)。これ以上は捏造しない。
- 次: atlas-write で en/ja 6 セクションを起こし tools.ts 登録 -> build/lint。
