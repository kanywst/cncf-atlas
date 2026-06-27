# status: BFE

- [x] recon 完了 @ commit `d8d6dcb5c49e586f19b433acfee57fb57412ea7a`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は `bfenetworks/bfe` (CNCF Sandbox の forward engine リポジトリ)。コントロールプレーン (api-server / conf-agent / dashboard) と ingress は別リポジトリなので、本ディープダイブはデータプレーン中心で書く。
- カテゴリは API Gateway を選択。L7 エッジロードバランサ / リバースプロキシで、Traefik・Emissary・Contour と同じ枠が最も近い。Service Mesh & Networking はメッシュ寄りなので外した。
- 代表操作は `ReverseProxy.ServeHTTP` (`bfe_server/reverseproxy.go:663`) を端から端まで追った。非自明な設計は condition DSL (goyacc 文法、`bfe_basic/condition/`)。
- 採用事例は `ADOPTERS.md` の自己申告ベース。write 時は GitHub シグナル (stars 6,249 / forks 942 / contributors 約 102、2026-06-26) を併記する。
- pinned commit は develop HEAD で v1.8.2 リリース直後。タグ commit ではない点を write 側で明記すること。

## tagline 案

- EN: A memory-safe Layer 7 load balancer from Baidu that routes traffic with a human-readable condition DSL.
- JA: 人間が読めるルーティング DSL でトラフィックを捌く、Baidu 生まれのメモリ安全な L7 ロードバランサ。
