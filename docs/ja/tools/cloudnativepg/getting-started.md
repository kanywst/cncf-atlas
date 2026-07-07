# はじめに

> `main` のマニフェスト `cnpg-1.30.0-rc1.yaml` で検証済み。コマンドは稼働中の Kubernetes クラスタと設定済みの `kubectl` を想定。

## 前提

- 稼働中の Kubernetes クラスタ (この手順ではローカルの kind や minikube で十分)。
- クラスタに到達できる `kubectl`。クラスタスコープのリソースを apply する権限が必要。
- デフォルトの StorageClass。`Cluster` が PersistentVolume を確保するために必要。

## インストール

operator マニフェストを適用する。この例では `main` に同梱されたリリース候補マニフェストを使う。本番では使いたい安定ラインの releases ページの YAML を使うこと。

```bash
kubectl apply --server-side -f \
  https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/main/releases/cnpg-1.30.0-rc1.yaml
```

operator Deployment のロールアウト完了を待つ:

```bash
kubectl rollout status deployment \
  -n cnpg-system cnpg-controller-manager
```

## 最初の動く構成

1. 3 インスタンスの `Cluster` 定義を `cluster-example.yaml` に書く:

    ```yaml
    apiVersion: postgresql.cnpg.io/v1
    kind: Cluster
    metadata:
      name: cluster-example
    spec:
      instances: 3
      storage:
        size: 1Gi
    ```

2. 適用する:

    ```bash
    kubectl apply -f cluster-example.yaml
    ```

3. Pod の起動を観察する。operator は管理対象オブジェクトすべてに `cnpg.io/cluster` ラベルを付ける:

    ```bash
    kubectl get pods -l cnpg.io/cluster=cluster-example
    ```

   primary 1 つと replica 2 つ、計 3 Pod が `Running` に到達するはずだ。

## 動作確認

`cnpg` kubectl プラグイン (`cmd/kubectl-cnpg` からビルドされる `kubectl-cnpg` バイナリ) を入れ、クラスタ状態を問い合わせる:

```bash
kubectl cnpg status cluster-example
```

健全なクラスタは primary が 1 つ、replica インスタンスがストリーミング中、`Cluster in healthy state` のサマリを報告する。リソースから直接確認することもできる:

```bash
kubectl get cluster cluster-example
```

reconcile が落ち着けば `STATUS` 列は `Cluster in healthy state` になる。

## 次に読むもの

- barman-cloud プラグイン経由のオブジェクトストレージへのバックアップと PITR (point-in-time recovery、特定時点復旧)。
- 高可用性のチューニング: 同期レプリケーション quorum (`minSyncReplicas` / `maxSyncReplicas`) と `FailoverQuorum` リソース。
- `Pooler` CRD (PgBouncer) によるコネクションプーリングと、生成される Prometheus `PodMonitor` による監視。

これらの本番運用は[公式ドキュメント](https://cloudnative-pg.io/documentation/)を参照。
