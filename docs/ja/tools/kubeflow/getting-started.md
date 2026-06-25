# はじめに

> KFP `2.16.1` で検証済み。コマンドは稼働中の Kubernetes クラスタ、`kubectl`、`pip` 付きの Python を想定。

## 前提

- Kubernetes クラスタと、それに対して設定済みの `kubectl`。
- `kfp` SDK 用の `pip` 付き Python 3。
- これは認証なしの standalone デプロイで、本番ではなく KFP を試すためのもの。

## インストール

Kustomize で KFP standalone をデプロイする:

```bash
export PIPELINE_VERSION=2.16.1
kubectl apply -k "github.com/kubeflow/pipelines/manifests/kustomize/cluster-scoped-resources?ref=$PIPELINE_VERSION"
kubectl wait --for condition=established --timeout=60s crd/applications.app.k8s.io
kubectl apply -k "github.com/kubeflow/pipelines/manifests/kustomize/env/dev?ref=$PIPELINE_VERSION"
```

SDK をインストールする:

```bash
pip install kfp==2.16.1
```

## 最初の動く構成

1. SDK から API サーバに到達できるよう UI と API を port-forward する。

```bash
kubectl -n kubeflow port-forward svc/ml-pipeline-ui 8080:80
```

UI は `http://localhost:8080` で到達できる。

1. 最小のパイプラインを記述・コンパイル・投入する。

```python
from kfp import dsl, compiler, Client


@dsl.component
def say(msg: str):
    print(msg)


@dsl.pipeline(name="hello")
def hello_pipeline(text: str = "hi"):
    say(msg=text)


compiler.Compiler().compile(hello_pipeline, "hello.yaml")
Client(host="http://localhost:8080").create_run_from_pipeline_package("hello.yaml")
```

## 動作確認

`http://localhost:8080` を開いて run が現れ succeeded に至るのを確認する。あるいは KFP の Pod が ready かを確認する:

```bash
kubectl -n kubeflow get pods
```

## 次に読むもの

認証付き・マルチユーザ・本番デプロイは公式の [KFP standalone インストールガイド](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/) と [Kubeflow Pipelines overview](https://www.kubeflow.org/docs/components/pipelines/overview/) に従う。ローカルのバックエンド開発はリポジトリの `CLAUDE.md` が `make -C backend kind-cluster-agnostic` による Kind ベースのデプロイを説明している。
