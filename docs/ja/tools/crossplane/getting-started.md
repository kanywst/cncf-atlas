# はじめに

> [Get started docs](https://docs.crossplane.io/latest/get-started/) と `cluster/` 以下の Helm chart に基づく。コマンドは稼働中の Kubernetes クラスタと、使える `kubectl` と `helm` を想定。

## 前提

- Kubernetes クラスタ (ローカルの `kind` クラスタでよい)。
- そのクラスタに向けて設定済みの `kubectl`。
- `helm` v3。

## インストール

```bash
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update
helm install crossplane crossplane-stable/crossplane \
  --namespace crossplane-system --create-namespace
```

## 最初の動く構成

最小で動く構成は、Crossplane core・provider または function・XRD・Composition・XR を備えたクラスタである。エンジンの動作を確認する最短ループは、CLI で pipeline をローカルに render することで、クラウドの認証情報は要らない。

1. Crossplane の pod が動いていることを確認する。

    ```bash
    kubectl get pods -n crossplane-system
    ```

2. 自前の API を定義し function pipeline にマップする XRD と Composition を適用し、その型の XR を作る。Composition の `spec.pipeline` は `PipelineStep` のリストで、各々が function を参照する。

3. apply 前に CLI で pipeline をローカルにプレビューする。これは reconciler が実行するのと同じ function pipeline を走らせ、生成されるリソースを表示する。

    ```bash
    crossplane render xr.yaml composition.yaml functions.yaml
    ```

v2 では composition が Crossplane の managed リソースだけでなく任意の Kubernetes リソースを生成できるので、composed の出力に `Deployment` やデータベースオペレータの `Cluster` のようなオブジェクトを含められる。

## 動作確認

Crossplane の deployment が available であること、インストール済みパッケージが healthy であることを確認する。

```bash
kubectl get pods -n crossplane-system
kubectl get providers,functions,configurations
```

healthy なパッケージは `INSTALLED` と `HEALTHY` が `True` になる。XR を適用したら、その型に対して `kubectl get` で確認し、status conditions の `Synced` と `Ready` をチェックする。

## 次に読むもの

provider 設定・RBAC・`xpkg.crossplane.io` 経由のパッケージ署名・operations などの本番運用は、[公式ドキュメント](https://docs.crossplane.io/latest/) と [What's New in v2](https://docs.crossplane.io/latest/whats-new/) を参照。
