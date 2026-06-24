# status: istio

- [x] recon 完了 @ commit `58e9892e6a60d635c1f661c95f0004f52867b379`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo resolution: 主実装は `istio/istio` (Go, istiod)。Envoy は外部、ambient の ztunnel は `istio/ztunnel` (Rust) で別リポ。deep-dive の中心は `istio/istio` で確定。
- pin は master HEAD。`VERSION` は 1.31 (未リリース)、直近リリースタグ 1.30.1。write 時にバージョン表記をどうするか要判断。
- 代表オペレーションは xDS push パス (ConfigUpdate から debounce, PushContext 構築, pushQueue, pushXds, xds.Send)。図にするなら制御プレーン側のみで完結。
- 非自明設計は PushContext の不変スナップショット + debounce の二段。write でここを掘ると差別化できる。
- 採用事例は公式 case study 4社 (eBay/Airbnb/Salesforce/T-Mobile) のみ URL 付きで確定。これ以外は捏造しない。
- ベンチ系 (ambient vs Cilium) は全て vendor ソースなので write では「Istio 側主張」と明示すること。
