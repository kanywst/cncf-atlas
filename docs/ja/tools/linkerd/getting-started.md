# はじめに

> `edge-26.6.3` リリース系列 (コミット `7977d50`) で検証済み。コマンドは稼働中の Kubernetes クラスタと動作する `kubectl` を想定。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ。
- CRD とクラスタスコープのリソースをインストールできる権限。
- PATH に通った `linkerd` CLI (下記でインストール)。

## インストール

公式スクリプトで CLI をインストールし、PATH に追加する。

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://run.linkerd.io/install | sh
export PATH=$HOME/.linkerd2/bin:$PATH
linkerd version --client
```

## 最初の動く構成

メッシュ化されたワークロードまでの最短経路。各ステップは CLI でマニフェストを出力し、`kubectl` で適用する。

1. クラスタが Linkerd をホストできるか確認する。

   ```bash
   linkerd check --pre
   ```

1. CRD を入れ、続いてコントロールプレーンを入れる。

   ```bash
   linkerd install --crds | kubectl apply -f -
   linkerd install | kubectl apply -f -
   ```

1. コントロールプレーンが正常になるまで待つ。

   ```bash
   linkerd check
   ```

1. 既存ワークロードの Pod spec にサイドカーを注入してメッシュ化する。

   ```bash
   kubectl get deploy <app> -o yaml | linkerd inject - | kubectl apply -f -
   ```

`linkerd inject` のステップは、クライアント側から見た proxy-injector の契約である。inject アノテーションを付与し、mutating webhook が admission 時に Pod を `linkerd-proxy` サイドカーでパッチするようにする。

## 動作確認

`linkerd check` を実行し、すべてのチェックが緑のステータスを返すことを確認する。ワークロードが実際にメッシュ化されているかは、Pod を列挙して各 Pod が ready なコンテナを 2 つ (アプリと `linkerd-proxy`) 報告することで確認する。

```bash
kubectl get pods -l app=<app>
```

`viz` 拡張をインストールし (`linkerd viz install | kubectl apply -f -`)、`linkerd viz dashboard` を実行すると、メッシュ化されたワークロードの成功率・リクエストレート・レイテンシをリアルタイムで表示できる。

## 次に読むもの

本番のインストール経路は Helm である。`linkerd-crds` と `linkerd-control-plane` チャートが CLI の `install` ステップを置き換え、Flux や Argo による GitOps デリバリに適合する。高可用性・証明書ローテーション・マルチクラスタミラーリングについては、このクイックスタートではなく公式 Linkerd ドキュメントを参照すること。

## 出典

- 出典 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- 出典 12: [Linkerd vs Istio (Buoyant)](https://www.buoyant.io/linkerd-vs-istio)
