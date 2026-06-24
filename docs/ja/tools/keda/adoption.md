# 採用事例・エコシステム

## 誰が使っているか

CNCF の graduation アナウンスが以下の本番採用組織を挙げている ([4])。コア repo に `ADOPTERS.md` は無く、listed-user の名簿は `keda.sh` 側で管理されている ([1], `README.md:66-68`)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| FedEx | Graduation 時に挙がった本番 KEDA ユーザ | [4] |
| Grafana Labs | Graduation 時に挙がった本番 KEDA ユーザ | [4] |
| KPMG | Graduation 時に挙がった本番 KEDA ユーザ | [4] |
| Reddit | Graduation 時に挙がった本番 KEDA ユーザ | [4] |
| Xbox | Graduation 時に挙がった本番 KEDA ユーザ | [4] |
| Zapier | Graduation 時に挙がった本番 KEDA ユーザ | [4] |

同じアナウンスは 45 以上の組織が KEDA を本番運用していると述べている ([4])。

## 採用のシグナル

2026-06-22 に `gh api repos/kedacore/keda` で観測 ([1]):

- GitHub stars: 10,310
- forks: 1,441
- contributors: 約 455

Graduation 時点でプロジェクトは scaler 60+ と認証プロバイダ 9 を報告していた ([4])。pin したソースでは scaler の build switch がおよそ 78 ケースある ([2], `pkg/scaling/scalers_builder.go:123`)。

## エコシステム

- **HPA**: Kubernetes External Metrics API 経由でネイティブ統合。KEDA が HPA オブジェクトを作成・管理する。
- **イベントソース**: Prometheus, Kafka, RabbitMQ, NATS, AWS SQS/Kinesis/CloudWatch, Azure Service Bus/Event Hub/Queue, GCP Pub/Sub を含む 70+ の内蔵 scaler ([2], `pkg/scaling/scalers_builder.go:123`)。
- **認証**: `TriggerAuthentication` で Vault・Azure Key Vault・Pod Identity に対応 ([2], `apis/keda/v1alpha1/triggerauthentication_types.go:75`)。
- **HTTP add-on**: `kedacore/http-add-on` が KEDA を拡張し、HTTP ワークロードをリクエスト量でスケールさせる ([8])。
- **ダウンストリーム**: OpenShift は KEDA を Custom Metrics Autoscaler として `openshift/kedacore-keda` で同梱する ([9])。

## 代替候補

| 代替 | 違い |
| --- | --- |
| ネイティブ HPA + metrics adapter (例: Prometheus Adapter) | KEDA は 70+ scaler を内蔵しゼロスケールを足す。素の HPA は 1 レプリカ未満に落とせない |
| Knative Serving | HTTP/リクエスト駆動のゼロスケールに強い。KEDA はより広い汎用イベントソースを扱う |
| Cluster Autoscaler / Karpenter | これらはノードをスケールする。KEDA は Pod をスケールするのでレイヤーが違い、併用が一般的 |
| クラウド固有のマネージドオートスケーラ | KEDA はクラウド横断でベンダー中立 ([4]) |
