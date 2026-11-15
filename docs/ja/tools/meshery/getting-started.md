# はじめに

> [Quick Start Guide](https://docs.meshery.io/installation/quick-start) とコミット `68d542af` (`v1.0.79` の後) の `mesheryctl` のソースに基づく。このページのためにコマンドは実行していない。macOS か Linux、Docker、そして現在の kubeconfig context にある Kubernetes クラスタ (kind か minikube で足りる) を想定する。

## 前提

- 現在の context で `kubectl` から届く Kubernetes クラスタ。
- Meshery Server をクラスタ内ではなく手元のマシンで動かす場合は Docker。
- Web ブラウザ。CLI からでもサインインはブラウザのフローを通る。

## インストール

インストールスクリプトが `mesheryctl` をダウンロードし、Meshery を起動する。`PLATFORM` は Meshery Server をどこで動かすかを選ぶ。`kubernetes` なら現在の context のクラスタに配備し、`docker` ならローカルの Docker ホストで動かす ([Quick Start](https://docs.meshery.io/installation/quick-start))。

```bash
curl -L https://meshery.io/install | PLATFORM=docker bash -
```

Windows では、Quick Start は代わりに Scoop を使う。`scoop bucket add mesheryctl https://github.com/meshery/scoop-bucket.git` のあと、`scoop install mesheryctl` と `mesheryctl system start` を実行する。

## 最初の動く構成

目標は、普通の Kubernetes マニフェストを Meshery の design に変えて配備することである。

1. インストールスクリプトが Meshery Server を起動したままにしていなければ起動する。`--platform` は `mesheryctl` の context に設定された platform を上書きする (`mesheryctl/internal/cli/root/system/start.go:542`)。

    ```bash
    mesheryctl system start --platform docker
    ```

2. サインインする。`mesheryctl` がブラウザを開き、そこで Provider (Local か、リモートのもの) を選ぶ (`mesheryctl/internal/cli/root/system/login.go:37-49`)。

    ```bash
    mesheryctl system login
    ```

3. クラスタとの接続を確認する。クラスタの外で動かしている場合、サーバは `$HOME/.kube/config` にある context に接続する。既定では MeshSync はサーバ内に embedded で動くので、クラスタには何も入らない ([Quick Start](https://docs.meshery.io/installation/quick-start))。

    ```bash
    mesheryctl system check
    ```

4. 小さなマニフェストを `nginx.yaml` に書く。

    ```yaml
    apiVersion: v1
    kind: Namespace
    metadata:
      name: meshery-demo
    ---
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: nginx
      namespace: meshery-demo
    spec:
      replicas: 1
      selector:
        matchLabels:
          app: nginx
      template:
        metadata:
          labels:
            app: nginx
        spec:
          containers:
            - name: nginx
              image: nginx:1.27
    ```

5. design として取り込む。`-s "Kubernetes Manifest"` で、それがどの種類のファイルかを Meshery に伝える (`mesheryctl/internal/cli/root/design/import.go:50-57`)。

    ```bash
    mesheryctl design import -f nginx.yaml -s "Kubernetes Manifest" -n nginx-demo
    ```

6. 保存した design を配備する。これは design を `/api/pattern/deploy` に送る。[アーキテクチャ](./architecture) で追ったリクエストである (`mesheryctl/internal/cli/root/design/apply.go:52-58`、`:82`)。

    ```bash
    mesheryctl design apply nginx-demo
    ```

## 動作確認

クラスタ側からリソースがあることを確かめる。

```bash
kubectl get deployment -n meshery-demo nginx
```

Meshery UI では、MeshSync が報告すれば同じ Deployment がクラスタのインベントリに現れるはずである。ブラウザが開かなければ、UI を `http://localhost:9081` に転送する (`mesheryctl/internal/cli/root/system/dashboard.go:76-77`)。

```bash
mesheryctl system dashboard --port-forward
```

デモを片付けるには、`mesheryctl design undeploy nginx-demo` で design の配備を解除し、`mesheryctl system stop` で Meshery を止める。

## 次に読むもの

- [Installation](https://docs.meshery.io/installation): Helm によるクラスタ内配備と、対応する各プラットフォームの手順。
- [Kubernetes connection lifecycle](https://docs.meshery.io/guides/infrastructure-management/kubernetes-connection-lifecycle): 接続ごとに MeshSync を embedded と operator で切り替える方法。
- 公式 docs の [Architecture](https://docs.meshery.io/concepts/architecture) と [Logical Concepts](https://docs.meshery.io/concepts/logical): コンポーネントと概念の全一覧。
