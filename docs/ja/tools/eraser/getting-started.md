# はじめに

> コミット `20576a24` (タグ `v1.5.0-beta.0` 付近、安定最新は `v1.4.1`) のソースで検証。コマンドは CRI ランタイム (containerd か CRI-O) を使う Kubernetes クラスタと Helm を想定。

## 前提

- ノードが containerd や CRI-O などの CRI ランタイムを使う Kubernetes クラスタ。Eraser は CRI API 経由でイメージを削除するため。
- cluster-admin 権限の `kubectl`。CRD がクラスタスコープのため。
- 下記チャートインストール用の Helm。

## インストール

チャートリポジトリを追加し、Eraser を専用 namespace にインストールする (`src/charts/eraser/README.md:10-23`)。

```bash
helm repo add eraser https://eraser-dev.github.io/eraser/charts
helm repo update
helm install -n eraser-system eraser eraser/eraser --create-namespace
```

これで `eraser-controller-manager` がデプロイされ、`ImageList` と `ImageJob` の CRD が登録される。

## 最初の動く構成

マニュアルモードである。削除するイメージを名指しし、実行中コンテナが使っていない各ノードから Eraser が削除するのを見る。

1. コントローラが動いているか確認する。

   ```bash
   kubectl get pods -n eraser-system
   ```

1. `ImageList` を apply する。リソース名は `imagelist` でなければならず、他の名前は無視される (`src/controllers/imagelist/imagelist_controller.go:139-144`)。ノードに存在し実行中でないと分かっているイメージ (例: `docker.io/library/alpine:3.7.3`) を使う。

   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: eraser.sh/v1
   kind: ImageList
   metadata:
     name: imagelist
   spec:
     images:
       - docker.io/library/alpine:3.7.3
   EOF
   ```

1. Eraser はノード 1 台につき 1 つのワーカー Pod を fan-out する `ImageJob` を作る。それらが現れて完了するのを見る。

   ```bash
   kubectl get imagejob
   kubectl get pods -n eraser-system -w
   ```

特定リストではなく非実行イメージをすべて削除するには、`spec.images` の唯一のエントリを `*` にする。これが prune パスを起動する (`src/pkg/remover/helpers.go:99-126`)。

## 動作確認

`ImageList` の status を見る。ノードごとの結果を success / failed / skipped のカウントに集計する (`src/api/v1/imagelist_types.go:26-39`)。

```bash
kubectl get imagelist imagelist -o jsonpath='{.status}'
```

詳細を見るには remover Pod のログを読む。削除されたイメージは `removed image`、実行中コンテナが保持するイメージは `image is running` を出して残され、存在しないイメージは `image is not on node` を出す (`src/pkg/remover/helpers.go:84-96`)。

```bash
kubectl logs -n eraser-system -l imagejob-owner=imagelist-controller
```

## 次に読むもの

Eraser が全ノードのイメージを Trivy で定期スキャンし脆弱性閾値超えを削除するスキャンモード、ノードフィルタ、除外リスト、`ImageProvider` interface によるカスタムスキャナ、OTLP メトリクスは、公式ドキュメント <https://eraser-dev.github.io/eraser/docs/> を参照。[クイックスタート](https://eraser-dev.github.io/eraser/docs/quick-start) が同じ初回実行をカバーし、`src/charts/eraser/README.md` のチャートパラメータでデプロイを調整できる。
