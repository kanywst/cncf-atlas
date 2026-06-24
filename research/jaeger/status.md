# status: Jaeger

- [x] recon 完了 @ commit `d5e2ccd4705e1ae200baf7438c09a64ded5dd78e`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 直近タグ `v2.19.0` (2026-06-03)。pin した commit はその後の `docs: fix typos` (#8786)。タグ無しの depth-1 clone なので `git describe` は不可、リリース日付から v2.19.0 を直近と判定。
- v1 と v2 でアーキテクチャが全く違う。write 時は v2 (OTel Collector ベース) を主、v1 (Agent/Collector/Query 分離) は歴史節で触れる程度に。
- 代表操作は OTLP 受信 → storageexporter → tracestore.Writer → in-memory リングバッファ で確定。図にするなら receiver → pipeline → exporter → storage extension の流れ。
- 採用事例はケーススタディ/トーク付きの 5 社 (Uber/Grafana Labs/Logz.io/Ticketmaster/Weaveworks) + Red Hat に限定。ADOPTERS の他社は出典が会社サイトのみなので write では深追いしない。
- storageexporter が StabilityLevelDevelopment な点は v2 移行が途上である証左として書ける。
