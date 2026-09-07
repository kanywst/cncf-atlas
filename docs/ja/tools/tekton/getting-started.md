# はじめに

> コマンドはコミット `9dec5e4b` 時点の `docs/install.md` の手順に従い、2026-09-07 に `kind` クラスタで実行して確認した。稼働中の Kubernetes クラスタと、cluster-admin 権限でそこに届く `kubectl` を前提とする。

## 前提

- Kubernetes クラスタ。Tekton `v0.61.x` 以降は Kubernetes 1.28 以上を要求する (`README.md`)。このページの内容ならローカルの kind や minikube で足りる。
- そのクラスタに対して設定済みの `kubectl`。カスタムリソース定義と ClusterRole を作れる権限が要る。
- step が pull するレジストリへの外向き通信。

## インストール

```bash
kubectl apply --filename https://infra.tekton.dev/tekton-releases/pipeline/latest/release.yaml
```

これで `tekton-pipelines` 名前空間、8 つのカスタムリソース定義、そして 4 つの Deployment (`tekton-pipelines-controller`、`tekton-pipelines-webhook`、`tekton-events-controller`、`tekton-pipelines-remote-resolvers`) が作られる。latest を追うのではなくバージョンを固定したい場合は、`latest` を `previous/<version>` に置き換える (例: `previous/v1.16.0`)。

それらが ready になるまで待つ。

```bash
kubectl get pods --namespace tekton-pipelines --watch
```

`tekton-pipelines-controller` と `tekton-pipelines-webhook` が `Running` になり、全コンテナが ready になるのを確認する。webhook が ready になる前に実行を作らないこと。デフォルト値の付与と検証を担当しているので、立ち上がる前に投げた実行は拒否される。

## 最初に動く構成

一連の流れをまるごと通す最小のものは、タスクをインラインで書いた `TaskRun`。`Task` オブジェクトもパイプラインも workspace も要らない。

1. step を 2 つ持つ `TaskRun` を作る。[内部実装](./internals) で説明した順序制御の仕組みが実際に効いているところを、あとで確認できる。

```bash
cat <<'EOF' | kubectl create -f -
apiVersion: tekton.dev/v1
kind: TaskRun
metadata:
  generateName: hello-
spec:
  taskSpec:
    steps:
      - name: first
        image: docker.io/library/busybox
        command: ["echo"]
        args: ["step one"]
      - name: second
        image: docker.io/library/busybox
        script: |
          echo "step two, running after step one"
EOF
```

`apply` ではなく `kubectl create` を使うのは、`generateName` の名前をサーバー側に割り当てさせるため。

1. 実行を眺める。コントローラがこの `TaskRun` に対して Pod を 1 つ作る。

```bash
kubectl get taskrun --watch
```

1. ログを読む。各 step はその Pod の中のコンテナで、名前は `step-first` と `step-second` になる。

```bash
POD=$(kubectl get taskrun -o jsonpath='{.items[-1:].status.podName}')
kubectl logs "$POD" --container step-first
kubectl logs "$POD" --container step-second
```

## 動作確認

`TaskRun` が `SUCCEEDED=True` に到達していればよい。

```bash
kubectl get taskrun -o 'custom-columns=NAME:.metadata.name,SUCCEEDED:.status.conditions[0].status,REASON:.status.conditions[0].reason'
```

結果だけでなく [内部実装](./internals) で説明した仕掛けそのものを見たいなら、Tekton が組み立てた Pod を覗く。

```bash
kubectl get pod "$POD" -o jsonpath='{range .spec.containers[*]}{.name}{"\t"}{.command}{"\n"}{end}'
```

どの step コンテナもコマンドが `/tekton/bin/entrypoint` になっていて、元のコマンドは `-entrypoint` と `--` の後ろの引数に入っている。`prepare` という名前の init コンテナが、そのバイナリを共有ボリュームにコピーした張本人。init コンテナがもう 1 つ `place-scripts` として出てくるのは、この例の 2 番目の step が `command` ではなく `script` を使っているため。その script をディスクに書き出す役。

`TaskRun` が pending のまま止まる場合、原因はたいてい webhook が ready でない、イメージが pull できない、Pod がスケジュールできない、のいずれか。1 つ目は `kubectl describe taskrun`、残りは `kubectl describe pod "$POD"` に出る。

## 次に読むもの

このページで入るのはエンジンだけ。実用にはイベントから実行を作る Triggers が要るし、パイプラインの生成物に署名したいなら Chains も要る。どちらも同じプロジェクトの別インストール。タスクの境界を越えてデータを渡す仕組みである workspace は、タスクが 2 つになった時点で必要になる。高可用性・`enable-api-fields` の設定・名前空間ごとの既定値・リモート解決の設定といった本番向けの話題は[公式ドキュメント](https://tekton.dev/docs/)にある。
