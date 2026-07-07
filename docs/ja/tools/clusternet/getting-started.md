# はじめに

> commit `e8b5a0c` の `src/hack/local-running.sh` にあるチャートコマンドで検証済み。手順は親クラスタ 1 つと子クラスタ 1 つ以上、加えて `kubectl` と `helm` がパスに通っていることを想定。

## 前提

- Kubernetes クラスタ 2 つ (親 1 つ、子 1 つ)。リリースが対応するバージョンであること。Clusternet `v0.18.x` は Kubernetes `>=v1.30` を要求する ([README](https://github.com/clusternet/clusternet))。ローカル試用には [kind](https://kind.sigs.k8s.io/) クラスタで十分。
- 各クラスタのコンテキストを設定した `kubectl`。
- チャートをインストールするための `helm` (v3)。
- 子が登録のためにダイヤルアウトするので、親 API サーバのアドレスが子から到達可能であること。

## インストール

公式の Helm チャートリポジトリを追加する (`src/hack/local-running.sh:116`)。

```bash
helm repo add clusternet https://clusternet.github.io/charts
helm repo update
```

## 最初の動く構成

以下の手順は `src/hack/local-running.sh` を踏襲している。親の手順は親コンテキストに対して、agent の手順は子コンテキストに対して実行する。

1. 親側の 3 コンポーネントを `clusternet-system` namespace にインストールする (`src/hack/local-running.sh:122`, `src/hack/local-running.sh:129`, `src/hack/local-running.sh:134`)。

    ```bash
    helm install clusternet-hub -n clusternet-system --create-namespace clusternet/clusternet-hub
    helm install clusternet-scheduler -n clusternet-system --create-namespace clusternet/clusternet-scheduler
    helm install clusternet-controller-manager -n clusternet-system --create-namespace clusternet/clusternet-controller-manager
    ```

2. 子が登録に使う bootstrap token を作成する (`src/hack/local-running.sh:124`)。これはサンプルの token を親に適用する。

    ```bash
    kubectl apply -f https://raw.githubusercontent.com/clusternet/clusternet/main/manifests/samples/cluster_bootstrap_token.yaml
    ```

3. agent が `parentURL` として必要とする親 API サーバのアドレスを調べる。

    ```bash
    kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'
    ```

4. `clusternet-agent` を子クラスタにインストールし、親と手順 2 の bootstrap token を指定する (`src/hack/local-running.sh:138`)。URL は手順 3 の値に置き換える。

    ```bash
    helm install clusternet-agent -n clusternet-system --create-namespace \
      --set parentURL=https://PARENT-APISERVER:PORT \
      --set registrationToken=07401b.f395accd246ae52d \
      clusternet/clusternet-agent
    ```

## 動作確認

親クラスタで、登録された子クラスタを一覧する。ManagedCluster CRD の短縮名は `mcls`。

```bash
kubectl get mcls -A
```

登録に成功した子は、専用の namespace 内に ManagedCluster として現れる。その後、親で Subscription を作成してワークロードを配布できる。`src/examples/replication-scheduling` と `src/examples/static-dividing-scheduling` のサンプルマニフェストが両方のスケジューリング戦略を示す。

## 次に読むもの

- [クイックスタートチュートリアル](https://clusternet.io/docs/quick-start/) は `kind` と 3 つの子クラスタで Clusternet をローカル構築する。その裏のスクリプトが `src/hack/local-running.sh`。
- インストールオプション、sync モード、`extraArgs.cluster-sync-mode` の値 (`Push`、`Pull`、`Dual`) は公式ドキュメントを参照 ([Introduction](https://clusternet.io/docs/introduction/))。
- 親 API サーバが bootstrap-token 認証に対応しない場合 (例: k3s) は、公式の Helm インストールドキュメントに従い ServiceAccount token を代わりに使う。
