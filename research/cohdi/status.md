# status: CoHDI

- [x] recon 完了 @ commit `761a00ba43d29524f21082cf157f1d4d361e465e` (tag `v0.2.0`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 正本リポジトリは `CoHDI/composable-resource-operator`。CoHDI org には他に `composable-dra-driver`、`dynamic-device-scaler`、`cohdi-chart` (Helm)、`cohdi-manager-mock` (テスト用 CDI モック) がある。write 段で「3 コンポーネントのうちの 1 つ」と明示すること。
- カテゴリは Orchestration & Scheduling。DRA / scheduler / autoscaler 連携でハードウェア合成をオーケストレーションする位置づけ。
- 採用組織は ADOPTERS.md 記載の NTT / NEC / Fujitsu(Fsas) / IBM Research のみ引用可。OpenShift / Rancher は "will include" の予定段階なので断定しない。
- 内部実装の注意: `fm/client.go:195` の `OptionStatus[:1]` は空文字で panic し得る。`README.md:181-187` にマージコンフリクトマーカー残存。深掘り (oss-deepdive 系) に回すなら候補。
- getting-started は `make install` -> `make deploy IMG=...` の後、環境変数 (`DEVICE_RESOURCE_TYPE`, `CDI_PROVIDER_TYPE`, `FTI_CDI_API_TYPE`) と Secret `credentials` の設定が必須。実 CDI ファブリックが無い検証は `cohdi-manager-mock` を使う旨を write 段で補足。
- 次にやること: atlas-write で en/ja 6 セクションを起こす。
