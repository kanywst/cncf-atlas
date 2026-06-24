# 採用事例・エコシステム

## 誰が使っているか

以下の組織はプロジェクトの [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) に記載されている。クラウドプロバイダと一部は [CNCF 卒業アナウンス](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/) でも名指しされている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Alibaba Cloud | クラウド基盤 | [CNCF アナウンス](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/) |
| Scaleway | クラウドサービス | [CNCF アナウンス](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/) |
| Gojek | CaraML MLOps プラットフォーム | [CNCF アナウンス](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/) |
| Red Hat | OpenShift Serverless | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| IBM | Cloud Code Engine | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| Google Cloud | Cloud Run for Anthos | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| VMware | Tanzu Application Platform、Event Broker | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| Bloomberg L.P. | データサイエンスプラットフォーム | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| Box | 内部 serverless PaaS | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| KA-NABELL | EC プラットフォーム | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |
| KubeSphere | OpenFunction の serving 層 | [ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD) |

ADOPTERS.MD には Cisco、Cloudera、Optum、WP Engine、Sinch、Tata Communications、Telekom Deutschland と SVA、さらに Cerebrium、Run:ai、Runhouse、deepc.ai といった AI 推論ユーザも記載されている。

## 採用のシグナル

- `knative/serving`: スター 6,063、フォーク 1,227、作成 2018-01-24 ([GitHub API](https://api.github.com/repos/knative/serving)、2026-06-23 観測)。
- コントリビュータ規模はおよそ 300 以上。GitHub contributors API が 1 ページ 1 コントリビュータ (匿名含む) で page=336 までページネーションすることから推定 (2026-06-23 観測)。
- 比較として `knative/eventing` は同日でスター 1,550。スターは Serving に集中している。
- 2025-09-11 から CNCF Graduated ([CNCF プロジェクトページ](https://www.cncf.io/projects/knative/))。

## エコシステム

- ネットワーキング層: Istio、Contour、Kourier、Gateway API 実装が ingress を提供する。
- cert-manager はオプションの `certificate` reconciler 経由で統合する (`cmd/controller/main.go:80`)。
- メトリクスとトレースの方向性は OpenTelemetry である ([CNCF アナウンス](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/))。
- `knative/eventing` と CloudEvents が Serving と並んでイベント駆動軸を担う。
- OpenFunction (KubeSphere) は Knative Serving の上に FaaS 層を構築する ([ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD))。

## 代替候補

Knative は queue-proxy が計測するライブのリクエスト並行数または RPS でスケールし、activator でリクエストをバッファして Revision をゼロに出し入れする。代替候補は主に「何のシグナルでスケールするか」で異なる。

| 代替 | 違い |
| --- | --- |
| KEDA | 外部イベントソースやキュー長でスケールし、HPA と組んでゼロに到達する ([ThinhDA](https://thinhdanggroup.github.io/keda-knative-kubenetes/)) |
| Kubernetes HPA | CPU/メモリでスケール。単体では 1→N でゼロ不可 ([ThinhDA](https://thinhdanggroup.github.io/keda-knative-kubenetes/)) |
| OpenFaaS | RPS ベースで 1 インスタンスずつ増設する軽量 FaaS ([CNCF ブログ](https://www.cncf.io/blog/2020/04/13/serverless-open-source-frameworks-openfaas-knative-more/)) |
| OpenWhisk、Fission、Fn | 独自ランタイムを持つ隣接 FaaS プラットフォーム ([CNCF ブログ](https://www.cncf.io/blog/2020/04/13/serverless-open-source-frameworks-openfaas-knative-more/)) |
