# はじめに

> 公式の [Strimzi Quickstarts](https://strimzi.io/quickstarts/) に準拠。コマンドは稼働中の Kubernetes クラスタと `kubectl` を想定。

## 前提

- Kubernetes クラスタ (ローカル検証なら minikube、kind、OKD のいずれでも可)
- そのクラスタに接続できるよう設定された `kubectl`

## インストール

namespace を作り、そこに Cluster Operator をインストールする。インストールバンドルはリポジトリの `install/cluster-operator/` 配下にある RBAC、Deployment、CRD の YAML である。

```bash
kubectl create namespace kafka
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
```

## 最初の動く構成

稼働する Kafka クラスタへの最短経路: Operator をインストールし、`Kafka` カスタムリソースをデプロイして、Operator に reconcile させる。

1. Cluster Operator の Deployment が ready になるのを待つ。

   ```bash
   kubectl wait deployment/strimzi-cluster-operator --for=condition=Available --timeout=300s -n kafka
   ```

1. リポジトリ同梱の examples を使い、単一ノードの KRaft Kafka クラスタをデプロイする。

   ```bash
   kubectl apply -f examples/kafka/ -n kafka
   ```

1. クラスタが ready になるのを待つ。Operator が reconcile チェーンを最後まで回し、`Kafka` リソースの status に readiness を報告する。

   ```bash
   kubectl wait kafka/my-cluster --for=condition=Ready --timeout=300s -n kafka
   ```

## 動作確認

Operator pod と Kafka pod が起動しており、`Kafka` リソースが `Ready` を報告していることを確認する。

```bash
kubectl get pods -n kafka
kubectl get kafka my-cluster -n kafka -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
```

正常なクラスタでは broker と controller の pod が `Running` で、condition の status が `True` になる。Operator はポート 8080 で `/healthy`、`/ready`、`/metrics` も公開する。

## 次に読むもの

HA、TLS と認証、`KafkaNodePool` でのスケーリング、Cruise Control でのリバランスといった本番運用の話題は、公式の [Strimzi ドキュメント](https://strimzi.io/) と [Quickstarts](https://strimzi.io/quickstarts/) を参照。
