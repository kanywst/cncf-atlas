# はじめに

> 公式 quick start と、コミット `b4e4b23` 時点のリポジトリの `solutions/setup-dev-environment/local-up.sh` に基づく。以下のコマンドはこのページを書く際に実行していない。`kind` 用に Docker が使えるローカルマシンを前提とする。

## 前提

- [kind](https://kind.sigs.k8s.io/)。Kubernetes 1.25 以上のクラスタを作れること (`solutions/setup-dev-environment/README.md`)。
- [kubectl](https://kubernetes.io/docs/tasks/tools/)。
- [clusteradm](https://github.com/open-cluster-management-io/clusteradm)。hub のインストールとクラスタの参加を行う OCM の CLI。

## インストール

プロジェクトのインストールスクリプトで `clusteradm` を入れる ([Quick Start](https://open-cluster-management.io/docs/getting-started/quick-start/)):

```bash
curl -L https://raw.githubusercontent.com/open-cluster-management-io/clusteradm/main/install.sh | bash
```

quick start は続けて `local-up.sh` を実行する。kind クラスタを 3 つ (`hub`、`cluster1`、`cluster2`) 作り、hub をインストールし、3 つすべてを managed cluster として参加させて受け入れる。hub 自身は `local-cluster` として参加する。

```bash
curl -L https://raw.githubusercontent.com/open-cluster-management-io/OCM/main/solutions/setup-dev-environment/local-up.sh | bash
```

スクリプトが何をしているかを、managed cluster 1 つ分の手順で示す (`local-up.sh:17-69`):

```bash
kind create cluster --name hub
kind create cluster --name cluster1

# hub に Cluster Manager をインストール
clusteradm init --wait --context kind-hub

# bootstrap トークン付きの join コマンドを表示
clusteradm get token --context kind-hub

# 表示された "clusteradm join ..." を cluster1 に対して実行する。付けるフラグ:
#   --cluster-name cluster1 --force-internal-endpoint-lookup --wait --context kind-cluster1

# hub でクラスタを受け入れる (hub 管理者側のハンドシェイク)
clusteradm accept --clusters cluster1 --wait --context kind-hub
```

`clusteradm join` は bootstrap 資格情報で managed cluster に klusterlet をインストールする。`clusteradm accept` は CSR を承認し、ManagedCluster の `hubAcceptsClient` を true にする ([clusteradm `accept`](https://github.com/open-cluster-management-io/clusteradm/blob/f02a8843627b968be48b0feb2f8c8004424d090b/pkg/cmd/accept/exec.go#L99-L118))。[アーキテクチャ](./architecture)で説明した hub 側の 2 ステップにあたる。

## 最初の動く構成

ManifestWork で nginx の Deployment を `cluster1` に送る。hub の `cluster1` namespace に作る:

```yaml
apiVersion: work.open-cluster-management.io/v1
kind: ManifestWork
metadata:
  name: nginx
  namespace: cluster1
spec:
  workload:
    manifests:
      - apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: nginx-deployment
          namespace: default
        spec:
          replicas: 2
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
                  image: nginx:1.14.2
                  ports:
                    - containerPort: 80
```

```bash
kubectl --context kind-hub apply -f nginx-work.yaml
```

リポジトリ自身の例は、`solutions/deploy-manifests/manifests/nginx.yaml` を使って同じことを CLI で行う (`solutions/deploy-manifests/README.md`):

```bash
clusteradm create work nginx -f manifests/nginx.yaml --cluster cluster1
```

## 動作確認

hub で managed cluster の一覧を出す。スクリプトの最後もこのコマンドで、README に出力の形が載っている:

```bash
kubectl --context kind-hub get managedclusters
```

```text
NAME            HUB ACCEPTED   MANAGED CLUSTER URLS      JOINED   AVAILABLE   AGE
cluster1        true           https://127.0.0.1:45325   True     True        116s
cluster2        true           https://127.0.0.1:45325   True     True        98s
local-cluster   true           https://127.0.0.1:45325   True     True        78s
```

work エージェントが ManifestWork を適用したかを確認する。中の全マニフェストが適用されると `Applied` condition が `True` になる (`pkg/work/spoke/controllers/manifestcontroller/manifestwork_reconciler.go:196-226`):

```bash
kubectl --context kind-hub get manifestwork nginx -n cluster1 \
  -o jsonpath='{.status.conditions[?(@.type=="Applied")].status}'
kubectl --context kind-cluster1 get deployment nginx-deployment -n default
```

## 次に読むもの

- ラベルやスコアでクラスタを選ぶには、`ManagedClusterSet` を作り、`ManagedClusterSetBinding` で namespace に bind し、そこに `Placement` を書く。フィールドは[内部実装](./internals)にある。
- 1 つの ManifestWork を Placement が選んだ全クラスタに展開するには `ManifestWorkReplicaSet` を使う。
- 基準コミットの `solutions/` には、Argo CD の pull 配信、Cluster API、Helm チャート、Kueue の admission check、複数 hub、KubeFed からの移行の実例がある。
- 本番向けのインストール、アップグレード、add-on のドキュメントは[プロジェクトサイト](https://open-cluster-management.io/docs/)にある。
