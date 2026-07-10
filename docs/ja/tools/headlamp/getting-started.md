# はじめに

> `v0.43.0` で検証済み。コマンドは、稼働中の Kubernetes クラスタ、そのクラスタ向けに設定済みの `kubectl`、Helm 3 を想定する。

## 前提

- 到達可能な Kubernetes クラスタと、それを指す `kubectl`。
- ここで示すクラスタ内インストール用の Helm 3。
- `kube-system` にサービスアカウントと ClusterRoleBinding を作れる権限 (最初のトークン用)。

## インストール

Headlamp の Helm リポジトリを追加し、チャートを `kube-system` にインストールする。

```bash
helm repo add headlamp https://kubernetes-sigs.github.io/headlamp/
helm install my-headlamp headlamp/headlamp --namespace kube-system
```

クラスタではなくローカルマシンで使うなら、Headlamp はデスクトップアプリ (Linux/macOS/Windows) としても [ダウンロードページ](https://headlamp.dev/) から出荷される。デスクトップアプリはローカルの kubeconfig を直接読む。

## 最初の動く構成

クラスタ内デプロイを役立てるには 2 つ要る。ブラウザから到達する手段と、ログイン用のトークンだ。以下は両方への最短経路である。

1. Headlamp のサービスを自分のマシンへ port-forward する。

   ```bash
   kubectl port-forward -n kube-system service/headlamp 8080:80
   ```

1. サービスアカウントを作り、cluster-admin 権限を与える (最初の確認以上の用途では RBAC で絞ること)。

   ```bash
   kubectl -n kube-system create serviceaccount headlamp-admin
   kubectl create clusterrolebinding headlamp-admin \
     --serviceaccount=kube-system:headlamp-admin --clusterrole=cluster-admin
   ```

1. そのアカウント用のトークンを発行する。

   ```bash
   kubectl create token headlamp-admin -n kube-system
   ```

1. ブラウザで `http://localhost:8080` を開き、トークンを貼り付けてログインする。

## 動作確認

ログインすると Headlamp はクラスタの namespace とワークロードを一覧する。バックエンドプロキシが端から端まで動いていることの手早い確認として、`kube-system` の Pod ビューを開く。Pod が読み込まれれば、フロントがバックエンドに到達し、バックエンドがトークンを付け、リバースプロキシが kube-apiserver へ転送して一覧を返した、ということだ。代わりに認可エラーで空のビューになる場合、トークンは有効だがアカウントに権限がない。アクセスを強制するのは Headlamp ではなくクラスタだからである。

## 次に読むもの

OIDC ログイン (Dex、Keycloak、Azure Entra ID、EKS)、ingress と base-URL の設定、サイドカーによるプラグイン管理、Cluster Inventory ベースのマルチクラスタ検出といった本番運用は、公式ドキュメント <https://headlamp.dev/docs/latest/installation/> に従うこと。プラグインを作るなら、`@kinvolk/headlamp-plugin` SDK と `pluginctl` CLI から始める。
