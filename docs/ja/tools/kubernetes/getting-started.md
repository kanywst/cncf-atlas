# はじめに

> 学習用のローカルクラスタを想定し、基準コミット時点の `v1.36` 系に合わせている。コマンドは Docker が動く macOS または Linux を前提とする。

## 前提

- Docker (または `kind` が対応する別のコンテナランタイム)
- Kubernetes CLI である `kubectl`
- Docker コンテナの中でクラスタを動かす `kind`

## インストール

```bash
# kubectl (Linux amd64。他プラットフォームは公式ドキュメント参照)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# kind
go install sigs.k8s.io/kind@latest
```

## 最初の動く構成

クラスタを立ち上げてワークロードを 1 つ載せるまでの最短経路。

1. ローカルクラスタを作る。

```bash
kind create cluster --name demo
```

1. Deployment を動かして公開する。

```bash
kubectl create deployment hello --image=registry.k8s.io/echoserver:1.4
kubectl expose deployment hello --port=8080
```

1. スケジューラが Pod を配置し kubelet が起動する様子を見る。

```bash
kubectl get pods -o wide
```

期待される出力では Pod が `Running` へ遷移し、`NODE` 列にノードが割り当てられている。

## 動作確認

コントロールプレーンに到達でき、ノードが Ready かを確認する。

```bash
kubectl get nodes
kubectl get deployment hello
```

健全なクラスタはコントロールプレーンのノードを `Ready`、`hello` Deployment を `1/1` ready で報告する。Service をローカルポートへ port-forward して curl すれば、ワークロードがトラフィックを返すことを確認できる。

```bash
kubectl port-forward service/hello 8080:8080 &
curl http://localhost:8080
```

## 次に読むもの

コントロールプレーンの HA、RBAC と admission の強化、スケーリングといった本番運用は公式ドキュメント <https://kubernetes.io/docs/> を辿る。実クラスタのブートストラップは `kind` ではなく `kubeadm` (`cmd/kubeadm` 配下) がサポートされた経路だ。
