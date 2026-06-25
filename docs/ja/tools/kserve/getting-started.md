# 入門

> `v0.19.0` で検証。コマンドはローカルの `kind` クラスタと、`Standard` モードで予測モデルをサービスすることを前提とする。

## 前提

- Kubernetes クラスタ。ローカル検証なら [`kind`](https://kind.sigs.k8s.io) と Docker。
- そのクラスタに対して設定済みの `kubectl`。
- storage-initializer が公開オブジェクトストレージからサンプルモデルを取得できる外向きネットワーク。

## インストール

正確なインストールアセット名はリリースごとに変わるので、使うバージョンについては公式の [KServe Quickstart Guide](https://kserve.github.io/website/docs/getting-started/quickstart-guide) に従う。大筋の流れはどのリリースでも同じ。

```bash
kind create cluster
```

リポにはモードフラグ付きのインストールスクリプトが同梱される (`hack/kserve-install.sh`)。Standard モードは Knative 非依存の軽量オプション:

```bash
./hack/kserve-install.sh --standard
```

スクリプトはサーバレスモード向けの `--knative`、KEDA ベース autoscaling 向けの `--keda` も受け付ける。quickstart guide は選んだリリース向けに同じ手順を 1 つの `curl ... | bash` インストールでまとめている。

## 最初の動く構成

scikit-learn iris モデルをサービスする。以下のマニフェストはリポ同梱のサンプル `hack/release/smoke-test-data/sklearn-iris.yaml` に対応する。

1. `InferenceService` を作る。

```yaml
apiVersion: "serving.kserve.io/v1beta1"
kind: "InferenceService"
metadata:
  name: "sklearn-iris"
spec:
  predictor:
    sklearn:
      storageUri: "gs://kfserving-examples/models/sklearn/1.0/model"
```

1. 適用する。

```bash
kubectl apply -f sklearn-iris.yaml
```

KServe はモデルフォーマットから scikit-learn の `ServingRuntime` を選び、`storageUri` からモデルを `/mnt/models` にダウンロードする storage-initializer init container を注入し、Deployment・Service・HPA を作る。

## 動作確認

リソースが `Ready` を報告するまで待ち、URL を読む:

```bash
kubectl get inferenceservice sklearn-iris
```

`READY` カラムが `True` になり、`URL` カラムが埋まるはず。printer column は CRD 定義に由来する (`pkg/apis/serving/v1beta1/inference_service.go:140-147`)。そこから quickstart guide のプロトコル例に従って、その URL に推論リクエストを送る。

## 次に読むもの

- バージョン固定のインストールコマンドと完全な推論リクエストは [KServe Quickstart Guide](https://kserve.github.io/website/docs/getting-started/quickstart-guide)。
- Standard / Knative / ModelMesh モードの本番インストールは KServe Admin Guide (リポ `README.md` からリンク)。
- `LLMInferenceService` のパスは [v0.15 生成 AI アナウンス](https://www.cncf.io/blog/2025/06/18/announcing-kserve-v0-15-advancing-generative-ai-model-serving/)。
