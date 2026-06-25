# はじめに

> ドキュメント基準コミット `4d117aa` で検証済み。コマンドは `README.md:33-46` に従い Kubernetes 1.20+ クラスタと Prometheus を想定。

## 前提

- Kubernetes クラスタ、バージョン 1.20 以上。
- クラスタ内で動く Prometheus (OpenCost が使用量メトリクスをクエリする)。
- Helm。唯一サポートされるインストール手段。standalone マニフェストは撤去された (`README.md:33`)。

## インストール

```bash
helm repo add opencost https://opencost.github.io/opencost-helm-chart
helm repo update
helm install opencost opencost/opencost
```

## 最初の動く構成

実際にコストを計算する最短経路。上の Helm インストールが推奨ルートだ。デプロイせずローカルでエンジンを動かすには、Prometheus にポートフォワードしてバイナリをそれに向ける。

1. クラスタ内の Prometheus サービスをワークステーションにフォワードする。

```bash
kubectl port-forward svc/prometheus-server 9080:80
```

1. そのエンドポイントを指定し、ソースからコストモデルを実行する。

```bash
PROMETHEUS_SERVER_ENDPOINT="http://127.0.0.1:9080" go run ./cmd/costmodel/main.go
```

API は既定でポート `9003` を listen する。

## 動作確認

window を指定して allocation API をクエリする。`window` パラメータは必須 (`pkg/costmodel/aggregation.go:337`)。

```bash
curl "http://127.0.0.1:9003/allocation?window=1d&aggregate=namespace"
```

正常な構成なら namespace をキーとした JSON の按分セットが返る。他のエンドポイントは `/allocation/summary`・`/assets`・`/cloudCost`・`/metrics`。

## 次に読むもの

- sharded / HA Prometheus では `PROMETHEUS_SERVER_ENDPOINT` を Thanos Query・Cortex・Mimir などのグローバルクエリ先に向ける。単一の Prometheus pod を指すと結果が不完全になる (`README.md:46`)。
- [OpenCost ドキュメント](https://www.opencost.io/docs/) が Helm 設定・Prometheus 連携・UI など、ここで繰り返さない本番運用をカバーする。
