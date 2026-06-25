# status: Chaos Mesh

- [x] recon 完了 @ commit `8c13a9fb8d69a4299af99de9ddc9370c61ebf247`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## 確定事項

- repo: `chaos-mesh/chaos-mesh`、Go、Apache-2.0、CNCF Incubating。
- カテゴリ: Chaos Engineering (指定どおり verbatim)。
- pin は `main` の開発版。直近リリースタグは `v2.8.3` (2026-06-10)。本文では「v2.8.3 系」と書き、pin commit は recon の通り明記する。
- 代表オペレーションのトレース: StressChaos の Apply。records reconciler -> stresschaos impl -> daemon gRPC `ExecStressors` -> cgroup attach 後に stress-ng resume。

## tagline 案

- en: Kubernetes-native chaos engineering that injects pod, network, IO, time, and kernel faults through CRDs.
- ja: CRD でポッド・ネットワーク・IO・時刻・カーネルの障害を注入する Kubernetes ネイティブのカオスエンジニアリング基盤。

## 次にやること

- write 段: 6 セクション bilingual。非自明設計 (pause -> cgroup attach -> SIGCONT の順序) と TimeChaos/JVMChaos の差別化を軸にする。
- 採用事例は ADOPTERS.md の自己申告である点を断る。production 断定は避ける。
- install 最小手順は Helm (`helm install chaos-mesh helm/chaos-mesh --namespace=chaos-mesh`) と公式 quick-start を併記。
