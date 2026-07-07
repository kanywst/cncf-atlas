# はじめに

> `v0.9.1` で検証済み。コマンドは稼働中の Kubernetes クラスタと、それを指す `kubectl`、加えて手元の `helm` v3 と `git` を想定。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ (Clusterpedia を動かすホスト)。
- ローカルにインストールした `helm` v3、`git`、`kubectl`。
- インポートしたいメンバークラスタ 1 つ以上の認証情報 (kubeconfig、または apiserver URL とトークンかクライアント証明書)。

## インストール

公式のインストール経路は Helm チャートを使う。これは Bitnami の PostgreSQL サブチャートに依存する。まずチャートを clone して依存を解決する。

```bash
git clone https://github.com/clusterpedia-io/clusterpedia-helm.git
helm dependency build ./clusterpedia-helm
```

## 最初の動く構成

1. デフォルトの PostgreSQL ストレージで Clusterpedia をインストールする。`PediaCluster` CRD を作成するため `installCRDs=true` を指定し、PersistentVolume がバインドするよう DB をノードに固定する。

    ```bash
    helm install clusterpedia ./clusterpedia-helm \
      --namespace clusterpedia-system \
      --create-namespace \
      --set installCRDs=true \
      --set persistenceMatchNode=<your-node-name>
    ```

2. コンポーネントの起動を待つ。apiserver、clustersynchro-manager、controller-manager、PostgreSQL pod が見えるはず。

    ```bash
    kubectl -n clusterpedia-system get pods
    ```

3. メンバークラスタを `PediaCluster` として記述する。これを `pediacluster.yaml` として保存し、インポートするクラスタの apiserver アドレスと認証情報を埋める。

    ```yaml
    apiVersion: cluster.clusterpedia.io/v1alpha2
    kind: PediaCluster
    metadata:
      name: cluster-example
    spec:
      apiserver: "https://10.30.43.43:6443"
      caData:
      tokenData:
      syncResources:
        - group: apps
          resources:
            - deployments
        - group: ""
          resources:
            - pods
    ```

4. 適用してクラスタを登録し、同期を開始する。

    ```bash
    kubectl apply -f pediacluster.yaml
    ```

5. クラスタが同期されていることを確認する。`STATUS` 列に synchro の稼働が表示されるはず。

    ```bash
    kubectl get pediaclusters
    ```

## 動作確認

Clusterpedia は Aggregated API として登録されるので、既存の kubeconfig を通じてクエリできる。提供するリソース API グループを一覧する:

```bash
kubectl get --raw "/apis/clusterpedia.io/v1beta1/resources/apis/apps" | jq
```

インポート済みの全クラスタを横断して Deployment を検索するには、Clusterpedia のリソースエンドポイントにクエリを投げ、返る items を読む:

```bash
kubectl get --raw "/apis/clusterpedia.io/v1beta1/resources/apis/apps/v1/deployments" | jq '.items | length'
```

## 次に読むもの

- [Installation](https://clusterpedia.io/docs/installation/): 本番向けストレージの選択肢と高可用性。
- [Import Clusters](https://clusterpedia.io/docs/usage/import-clusters/): 認証オプションと、Karmada などのプラットフォームからの自動インポート。
- [Sync Cluster Resources](https://clusterpedia.io/docs/usage/sync-resources/): 収集するリソースの選択方法 (`syncAllCustomResources` を含む)。
