# はじめに

> v2.8.3 で検証済み。コマンドは稼働中の Kubernetes クラスタ、`kubectl`、Helm 3 を想定。

## 前提

- 管理権限のある Kubernetes クラスタ。
- そのクラスタに対して設定済みの `kubectl`。
- チャートのインストールに Helm 3。
- ノードのコンテナランタイムとその socket パスを把握していること (例: containerd は `/run/containerd/containerd.sock`)。

## インストール

チャートリポジトリを追加し、専用 namespace にインストールする。

```bash
helm repo add chaos-mesh https://charts.chaos-mesh.org
kubectl create ns chaos-mesh
helm install chaos-mesh chaos-mesh/chaos-mesh \
  --namespace=chaos-mesh \
  --set chaosDaemon.runtime=containerd \
  --set chaosDaemon.socketPath=/run/containerd/containerd.sock \
  --version 2.8.3
```

チャートは controller-manager、chaos-daemon DaemonSet、dashboard をデプロイする。デプロイ前に、チャート README が公式の前提条件と install-by-helm ガイドへのポインタを示している ([helm/chaos-mesh README](https://github.com/chaos-mesh/chaos-mesh/blob/master/helm/chaos-mesh/README.md))。

## 最初の動く構成

1. コンポーネントが動いているか確認する。

```bash
kubectl get pods -n chaos-mesh
```

1. ラベルセレクタにマッチする 1 つの Pod を kill する最小の PodChaos を用意する。`pod-kill.yaml` として保存する。

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill-example
  namespace: chaos-mesh
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - default
    labelSelectors:
      app: my-app
```

1. 実験を適用する。

```bash
kubectl apply -f pod-kill.yaml
```

## 動作確認

実験の状態を確認する。コントローラは選択と注入の状態をオブジェクトに記録する。

```bash
kubectl describe podchaos pod-kill-example -n chaos-mesh
```

`Selected` と `AllInjected` の condition、そして `default` namespace の対象 Pod が終了されていることを確認する。dashboard でも同じ実験とそのイベントタイムラインを確認できる。

## 次に読むもの

本番インストール、ランタイム設定、namespace スコープ、RBAC、セキュリティ強化は公式ドキュメントに従う ([Quick Start](https://chaos-mesh.org/docs/quick-start))。本番の install-by-helm ガイドはチャート README から参照されている。

## 出典

1. Chaos Mesh Quick Start: <https://chaos-mesh.org/docs/quick-start>
2. helm/chaos-mesh README: <https://github.com/chaos-mesh/chaos-mesh/blob/master/helm/chaos-mesh/README.md>
