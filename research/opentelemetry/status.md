# status: OpenTelemetry

- [x] recon 完了 @ commit `415d3dcae73b37a8e3cf490452949a72589ae650`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 対象は中核実装の Collector (`open-telemetry/opentelemetry-collector`)。プロジェクト全体 (仕様 + 各言語 SDK) とは別物なので write 時に範囲を明示する
- 近いタグは `v0.154.0` (beta module-set)。stable module は `v1.60.0`。HEAD は v0.154.0 リリース後の main commit
- 代表オペレーション: `service/internal/graph/graph.go` の `Build` -> `createNodes` -> `createEdges` -> `buildComponents` (逆トポロジカル順で配線)
- 非自明な設計: `internal/fanoutconsumer/traces.go` の MutatesData ベースの clone 最小化 + `capabilitiesNode` の OR 畳み込み
- 採用個社名は未確定 (core repo に ADOPTERS 無し)。write で個社を出すなら CNCF ケーススタディの出典を別途確保すること。捏造禁止
- CNCF 卒業日に表記ゆれあり: CNCF project page は 2026-05-11、発表 (press/blog) は 2026-05-21。両方明記済み
