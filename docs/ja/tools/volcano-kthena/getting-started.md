# はじめに

> pin したコミット `affd5be` で検証。コマンドは Go 1.26 と動作する Docker または Kubernetes 環境を想定。

## 前提

- ソースからビルドするなら Go 1.26 (`go.mod` は `go 1.26.0` を宣言)。
- ローカル一発起動パスにはコンテナランタイム。クラスタはスクリプトが用意する。
- 実デプロイには Volcano スケジューラを入れた Kubernetes クラスタ。`ModelServingSpec.SchedulerName` のデフォルトが `volcano` だから (`pkg/apis/workload/v1alpha1/model_serving_types.go:47`)。

## インストール

クラスタ不要の最短は一発起動スクリプト (`README.md:77`):

```bash
./hack/local-up-kthena.sh
```

`--help` でオプションを確認できる。ソースからビルドする場合:

```bash
make build
```

コンテナイメージは `make docker-build-all` で、router / controller / downloader / runtime の 4 イメージが作られる。

## 最初の動く構成

中核機能は、1 モデルを立てて router 経由の OpenAI 互換 API で叩くこと。

1. Kthena をローカルで起動する。

   ```bash
   ./hack/local-up-kthena.sh
   ```

2. `ModelBooster` (または `ModelServing`) を 1 つ apply し、controller にモデルを `ServingGroup` として立てさせる。`ModelBackend.ModelURI` は許可されたスキーム、例えば `hf://` を指定する (許可は `hf://` / `s3://` / `pvc://` / `ms://` のみ。`pkg/apis/workload/v1alpha1/model_booster_types.go:59`)。マニフェストは [クイックスタートガイド](https://github.com/volcano-sh/kthena/blob/main/docs/kthena/docs/getting-started/quick-start.md) に従う。

3. pod が ready になったら OpenAI 互換リクエストを router へ送る。

   ```bash
   curl http://<router-address>/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model": "<your-model>", "messages": [{"role": "user", "content": "hello"}]}'
   ```

## 動作確認

- 提供中モデルの一覧。router が直接応答する (`pkg/kthena-router/router/router.go:216-220`):

```bash
curl http://<router-address>/v1/models
```

- `ServingGroup` の pod がスケジュールされたか確認する。Volcano を入れていれば Volcano PodGroup を通じて gang として配置される (`pkg/model-serving-controller/controller/model_serving_controller.go:194`)。`/v1/chat/completions` が補完を返せば端から端までの経路が確認できる。

## 次に読むもの

- 完全なマニフェストは公式 [クイックスタートガイド](https://github.com/volcano-sh/kthena/blob/main/docs/kthena/docs/getting-started/quick-start.md)。
- エンジン別デプロイは [vLLM の Kthena 連携](https://docs.vllm.ai/en/stable/deployment/integrations/kthena/) と [Ascend NPU ガイド](https://docs.vllm.ai/projects/ascend/en/main/user_guide/deployment_guide/using_volcano_kthena.html)。
- スケーリングはリポの `examples/keda-autoscaling` と `examples/prometheus-autoscaler`、gang / network-topology-aware 配置は Volcano スケジューラのドキュメント。
