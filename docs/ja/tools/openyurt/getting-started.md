# はじめに

> `v1.7.0` で検証済み。コマンドは既存のクラウド Kubernetes クラスタ、`kubectl`、`helm` を想定。

## 前提

- クラウドで動く Kubernetes コントロールプレーン。OpenYurt は Kubernetes 1.34 まで認証済み (`README.md:53`)。
- そのクラスタに対して構成済みの `kubectl`。
- コントロールプレーンのコンポーネントを入れる `helm`。
- apiserver に到達でき、エッジノードとして join する 1 台以上のエッジマシン。

## インストール

OpenYurt のインストールは 2 部構成だ。まずクラウドにコントロールプレーンのコンポーネント、次にエッジノード。コントロールプレーンは同梱の Helm chart (`charts/yurt-manager`, `charts/yurthub`) で入れる。

```bash
helm repo add openyurt https://openyurtio.github.io/charts
helm repo update
helm upgrade --install yurt-manager openyurt/yurt-manager --namespace kube-system
```

## 最初の動く構成

1. クラウドクラスタに Yurt-Manager のコントローラと Webhook を入れる (上記の `helm upgrade --install`)。

1. `yurtadm` でエッジノードを join する。エッジマシン上でクラウドの apiserver を指して実行する。

   ```bash
   yurtadm join <apiserver-host>:<port> \
     --token=<bootstrap-token> \
     --node-type=edge
   ```

1. 後でノードを切り離すには、そのノードで `yurtadm reset` を実行する。join と reset のコマンドは `pkg/yurtadm/cmd/` 配下にある。

## 動作確認

エッジノードがクラウドのコントロールプレーンに登録されたか確認する。

```bash
kubectl get nodes -o wide
```

join したノードがエッジラベル付きで現れるはずだ。YurtHub がノードで static pod として動いているか、`kube-system` の Yurt-Manager pod が健全かを確認する。

```bash
kubectl -n kube-system get pods | grep -E 'yurt-manager|yurt-hub'
```

## 次に読むもの

公式の 2 部構成インストールガイドがコントロールプレーンコンポーネントとノード join を詳説する: [OpenYurt インストール概要](https://openyurt.io/docs/installation/summary)。YurtHub が切断中にどうキャッシュを返すかは [YurtHub コアコンセプト](https://openyurt.io/docs/next/core-concepts/yurthub) を参照。HA コントロールプレーン、証明書管理、Raven によるリージョン間ネットワークなど本番運用は upstream のドキュメントにある。
