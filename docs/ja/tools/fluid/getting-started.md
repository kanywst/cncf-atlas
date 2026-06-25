# はじめに

> Fluid ドキュメントの `v1.0.x` 系を基準。コマンドは動作する Kubernetes クラスタと Helm 3 を想定。

## 前提

- スケジュール可能なノードを 1 つ以上持つ Kubernetes クラスタ。
- そのクラスタに対して設定済みの `kubectl`。
- ローカルにインストール済みの Helm 3。
- マウントするリモートデータソース (オブジェクトストアのバケット・HDFS・公開データセットの URL)。

## インストール

chart リポジトリを追加し、Fluid を専用 namespace にインストールする。CRD とコントローラ・CSI ドライバ・webhook が展開される。

```bash
helm repo add fluid https://fluid-cloudnative.github.io/charts
helm repo update
helm install fluid fluid/fluid -n fluid-system --create-namespace
```

## 最初の動く構成

中核の仕事はこうだ。データセットを宣言し、ランタイムを与え、アプリ Pod がキャッシュ経由でそれを読む。

1. under-file-system のマウント点を指す `Dataset` を作る。

```yaml
apiVersion: data.fluid.io/v1alpha1
kind: Dataset
metadata:
  name: demo
spec:
  mounts:
    - mountPoint: https://mirrors.bit.edu.cn/apache/spark/
      name: spark
```

1. 同名の `AlluxioRuntime` を作る。名前の一致が両者をバインドする鍵である。

```yaml
apiVersion: data.fluid.io/v1alpha1
kind: AlluxioRuntime
metadata:
  name: demo
spec:
  replicas: 1
  tieredstore:
    levels:
      - mediumtype: MEM
        path: /dev/shm
        quota: 2Gi
```

1. 両方を apply し、データセットのバインドを待つ。

```bash
kubectl apply -f dataset.yaml -f runtime.yaml
kubectl get dataset demo
```

ランタイムコントローラが setup を終えると、データセットは `Bound` フェーズに達し、`demo` という名の PersistentVolumeClaim が生える。その PVC をアプリ Pod でマウントすれば、キャッシュ経由でデータを読める。

## 動作確認

```bash
kubectl get dataset demo -o jsonpath='{.status.phase}'
kubectl get pvc demo
kubectl get pods -n fluid-system
```

正常な構成では、データセットのフェーズが `Bound`、`demo` PVC がバインド済み、`fluid-system` で Fluid のコントローラ・CSI ドライバ・webhook の Pod が動いている。任意で `DataLoad` リソースを作ると、ジョブ実行前にキャッシュへデータを先読みできる。

## 次に読むもの

階層ストアのチューニング、他のランタイム (JuiceFS・JindoCache・ThinRuntime)、データ操作 (`DataLoad`・`DataMigrate`・`DataBackup`)、HA やメトリクスといった本番運用は [Fluid ドキュメント](https://fluid-cloudnative.github.io/docs) を参照。リポジトリの `samples/` ディレクトリにエンジン別の実行可能な例がある。
