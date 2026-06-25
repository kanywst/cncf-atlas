# はじめに

> Litmus 3.x のインストールドキュメントで検証済み。コマンドは稼働中の Kubernetes クラスタと Helm を想定。

## 前提

- Kubernetes 1.17 以降。
- Helm 3 以降。
- 約 20GB の永続ボリューム (テスト用途なら 1GB で足りる)。

要件は [Litmus インストールドキュメント](https://docs.litmuschaos.io/docs/getting-started/installation) に基づく。

## インストール

```bash
helm repo add litmuschaos https://litmuschaos.github.io/litmus-helm/
kubectl create ns litmus
helm install chaos litmuschaos/litmus --namespace=litmus --set portal.frontend.service.type=NodePort
```

Helm チャートは MongoDB に依存する。ARM ホストでは互換性のある bitnami イメージへの差し替えが要ることがある。

## 最初の動く構成

ChaosCenter を起動し、その UI を開くまで。

1. 上記のとおりチャートを `litmus` namespace にインストールする。

2. コントロールプレーンの pod が ready になるまで待つ。

   ```bash
   kubectl get pods -n litmus
   ```

3. UI に到達する。リモートクラスタでは NodePort を外し、frontend service を port-forward する。

   ```bash
   kubectl port-forward svc/chaos-litmus-frontend-service 9091:9091 -n litmus
   ```

4. `http://localhost:9091` を開いてサインインする。ローカルクラスタ (minikube や kind) では UI endpoint に追加設定が要る。インストールドキュメントを参照。

## 動作確認

`litmus` namespace のコントロールプレーン pod がすべて Running か確認する:

```bash
kubectl get pods -n litmus
```

正常なインストールでは GraphQL サーバ、authentication、frontend、MongoDB の pod が Running になる。サインイン後は ChaosCenter ダッシュボードが開き、Chaos Infrastructure (agent) を対象クラスタに接続できる。

## 次に読むもの

HA・スケーリング・認証バックエンドなど本番運用は公式の [Litmus docs](https://docs.litmuschaos.io/docs/getting-started/installation) を参照。障害ライブラリは [litmuschaos/litmus-go](https://github.com/litmuschaos/litmus-go) に、共有可能な実験は [litmuschaos/chaos-charts](https://github.com/litmuschaos/chaos-charts) にある。
