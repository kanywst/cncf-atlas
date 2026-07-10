# はじめに

> 3.10 系チャートの Helm インストールに基づく。コマンドは稼働中の Kubernetes クラスタ、`kubectl`、`helm` 3 を想定。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ。
- OCI チャートを pull できる Helm 3。

## インストール

先に CRD を入れ、次に本体チャートを入れる。公式ドキュメントは Helm を推奨している ([Install with Helm](https://www.getambassador.io/docs/emissary/latest/topics/install/helm))。

```bash
helm install emissary-crds \
  --namespace emissary --create-namespace \
  oci://ghcr.io/emissary-ingress/emissary-crds-chart --version=3.10.0 \
  --set enableLegacyVersions=false --wait

helm install emissary \
  --namespace emissary \
  oci://ghcr.io/emissary-ingress/emissary-ingress --version=3.10.0 \
  --set waitForApiext.enabled=false --wait
```

## 最初の動く構成

最小ルーティングには `getambassador.io/v3alpha1` の 3 リソースが要る。待受ポート用の `Listener`、`Host`、そしてパスからサービスへの `Mapping` である ([Quick Start](https://emissary-ingress.dev/docs/3.10/quick-start/))。

1. `Listener`・`Host`・`Mapping` を定義する。

   ```yaml
   apiVersion: getambassador.io/v3alpha1
   kind: Listener
   metadata:
     name: emissary-listener
     namespace: emissary
   spec:
     port: 8080
     protocol: HTTP
     securityModel: INSECURE
     hostBinding:
       namespace:
         from: ALL
   ---
   apiVersion: getambassador.io/v3alpha1
   kind: Host
   metadata:
     name: wildcard-host
     namespace: emissary
   spec:
     hostname: "*"
     requestPolicy:
       insecure:
         action: Route
   ---
   apiVersion: getambassador.io/v3alpha1
   kind: Mapping
   metadata:
     name: quote-backend
     namespace: emissary
   spec:
     hostname: "*"
     prefix: /backend/
     service: quote
   ```

1. マニフェストを適用する。

   ```bash
   kubectl apply -f routing.yaml
   ```

## 動作確認

ポッドが Running で、サービスに外部アドレスが付いたことを確認し、ゲートウェイ越しにリクエストを送る。

```bash
kubectl get pods -n emissary
kubectl get svc -n emissary emissary-ingress
curl http://<external-ip>/backend/
```

## 次に読むもの

`emissary-apiext` 変換 webhook の起動待ちを含む手動 YAML インストール手順は [yaml-install](https://www.getambassador.io/docs/emissary/latest/topics/install/yaml-install) を参照。TLS・認証・レート制限・スケーリングなど本番運用は [emissary-ingress.dev](https://emissary-ingress.dev/docs/3.10/quick-start/) の公式ドキュメントを参照。
