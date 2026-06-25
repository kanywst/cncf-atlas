# はじめに

> コミット `658499d` の README クイックスタートで検証済み。コマンドはローカルマシンに Docker があり `kind` が使えることを想定。

## 前提

- [Go](https://golang.org/) は `go.mod` で固定されたバージョン (このコミットでは go 1.26)。
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) v1.19 以降。
- [kind](https://kind.sigs.k8s.io/) v0.14.0 以降。

## インストール

リポジトリには、ローカルに完全な Karmada とメンバークラスタを立てるスクリプトが付属する。

```bash
git clone https://github.com/karmada-io/karmada
cd karmada
hack/local-up-karmada.sh
```

このスクリプトは host クラスタを起動し、現行コードからコントロールプレーンをビルドしてデプロイし、メンバークラスタを作成して join する。成功すると環境への接続方法を出力する:

```text
Local Karmada is running.

To start using your Karmada environment, run:
  export KUBECONFIG="$HOME/.kube/karmada.config"
```

## 最初の動く構成

nginx Deployment をメンバークラスタへ配布する。コントロールプレーンのメイン kubeconfig である `karmada-apiserver` コンテキストを使う。

1. kubectl を Karmada コントロールプレーンに向ける。

```bash
export KUBECONFIG="$HOME/.kube/karmada.config"
kubectl config use-context karmada-apiserver
```

1. Deployment テンプレートと PropagationPolicy を作る。

```bash
kubectl create -f samples/nginx/deployment.yaml
kubectl create -f samples/nginx/propagationpolicy.yaml
```

サンプルポリシーは `nginx` Deployment を選び、レプリカを静的な重みで `member1` と `member2` に分割する (`samples/nginx/propagationpolicy.yaml`)。

## 動作確認

Karmada コントロールプレーンから Deployment の状態を確認する。メンバークラスタにログインする必要はない。

```bash
kubectl get deployment
```

期待される出力:

```text
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
nginx   2/2     2            2           20s
```

## 次に読むもの

- 本番向けのインストール (ローカルスクリプトの代わり) は `karmadactl init` コマンド (`pkg/karmadactl/cmdinit/cmdinit.go:121`) と [Karmada 公式サイト](https://karmada.io/) を参照。
- Kubernetes バージョン互換、HA、セキュリティ強化、スケーリングは [公式サイト](https://karmada.io/) からのドキュメントに従う。
