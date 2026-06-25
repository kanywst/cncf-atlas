# はじめに

> 公式クイックスタートに基づく。コマンドは `LoadBalancer` プロバイダを持つ稼働中の Kubernetes クラスタと動作する `kubectl` を想定。

## 前提

- Kubernetes クラスタ (kind・minikube・マネージドのいずれか)。
- そのクラスタに向けて設定済みの `kubectl`。
- Envoy が外部アドレスを得るための `LoadBalancer` Service 実装 (クラウド LB、ローカルでは MetalLB / `cloud-provider-kind`)。

## インストール

公式クイックスタートは Contour・Envoy・CRD・`LoadBalancer` Service を 1 つのマニフェストで `projectcontour` namespace に展開する:

```bash
kubectl apply -f https://projectcontour.io/quickstart/contour.yaml
```

これで Contour Deployment・Envoy DaemonSet・`LoadBalancer` Service・`HTTPProxy` CRD が作成される。Helm チャート (例: `bitnami/contour`) も代替の導入経路である。

## 最初の動く構成

1. サンプルワークロードをデプロイし Service として公開する。

    ```bash
    kubectl create deployment hello --image=nginxdemos/hello:plain-text --port=80
    kubectl expose deployment hello --port=80
    ```

2. ホストをその Service にルーティングする `HTTPProxy` を作る。

    ```yaml
    apiVersion: projectcontour.io/v1
    kind: HTTPProxy
    metadata:
      name: hello
    spec:
      virtualhost:
        fqdn: hello.local
      routes:
        - conditions:
            - prefix: /
          services:
            - name: hello
              port: 80
    ```

3. 適用する。

    ```bash
    kubectl apply -f hello-httpproxy.yaml
    ```

## 動作確認

Envoy Service の外部アドレスを調べ、設定したホストヘッダ付きでリクエストを送る:

```bash
kubectl -n projectcontour get service envoy -o wide
curl -H 'Host: hello.local' http://<envoy-external-ip>/
```

正常な構成ならサンプルアプリの応答とともに HTTP 200 が返る。`HTTPProxy` が valid かも確認できる:

```bash
kubectl get httpproxy hello -o wide
```

`STATUS` 列が `valid` になっていればよい。

## 次に読むもの

TLS・TLS 委譲・マルチチームのルート inclusion・Gateway API サポート・外部認可・レートリミットは <https://projectcontour.io/docs/main/> を参照。HA・Envoy のスケーリング・ハードニングといった本番運用はそこで扱われており、ここでは再ドキュメント化しない。
