# はじめに

> `v2.20.1` に準拠 ([3])。コマンドは稼働中の Kubernetes クラスタと、そこに向けて設定済みの `kubectl` を想定する。

## 前提

- Kubernetes クラスタと、cluster-admin 権限を持つ `kubectl`。
- チャートで入れる場合は `helm` v3 ([7])。
- スケール対象のワークロード (下記では Deployment を使う)。

## インストール

Helm で入れる ([7]):

```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace
```

またはリリース済みマニフェストを直接適用する ([7]):

```bash
kubectl apply --server-side -f https://github.com/kedacore/keda/releases/download/v2.20.1/keda-2.20.1.yaml
```

## 最初の動く構成

何かをスケールさせる最短経路。外部依存が要らない内蔵の `cron` scaler を使う。

1. スケール対象の Deployment を作る。

```bash
kubectl create deployment nginx --image=nginx --replicas=0
```

1. 毎日の時間帯に Deployment を 5 レプリカへ、時間外は 0 へ戻す `ScaledObject` を作る。

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: nginx-cron
spec:
  scaleTargetRef:
    name: nginx
  minReplicaCount: 0
  maxReplicaCount: 5
  triggers:
    - type: cron
      metadata:
        timezone: Etc/UTC
        start: 0 6 * * *
        end: 0 20 * * *
        desiredReplicas: "5"
```

1. 適用する。

```bash
kubectl apply -f scaledobject.yaml
```

## 動作確認

KEDA がリソースを作りワークロードを管理していることを確かめる。

```bash
kubectl get scaledobject nginx-cron
kubectl get hpa
```

`ScaledObject` が `READY` かつ `ACTIVE` を示し、`keda-hpa-nginx-cron` という HPA があれば KEDA が配線済みだ。0→1 の遷移は operator 自身が駆動し、1 レプリカ超のスケールは HPA が担う。

## 次に読むもの

HA・scaler の全カタログ・`TriggerAuthentication`・`ScaledJob` は公式の deploy / concepts ドキュメント ([7]) とプロジェクトリポジトリ ([1]) を参照。HTTP リクエストベースのスケールは HTTP add-on を見る ([8])。
