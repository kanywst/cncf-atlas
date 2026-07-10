# はじめに

> `v1.9.0` で検証。コマンドは稼働中の Kubernetes クラスタと Helm v3.5+ を想定。

## 前提

- Kubernetes クラスタ (新しめのバージョン。古い doc では CRD conversion 都合で 1.13+ が下限)。
- Helm v3.5 以降。
- クラスタに向けて構成済みの `kubectl`。

## インストール

```bash
helm repo add openkruise https://openkruise.github.io/charts/
helm repo update
helm install kruise openkruise/kruise --version 1.9.0 \
  --namespace kruise-system --create-namespace
```

## 最初の動く構成

中核機能を動かす最短経路は、`InPlaceIfPossible` で CloneSet をロールし、イメージ変更を挟んでも Pod が生き残るのを観察すること。

1. CloneSet を作る。

   ```bash
   cat <<'EOF' | kubectl apply -f -
   apiVersion: apps.kruise.io/v1alpha1
   kind: CloneSet
   metadata:
     name: sample
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: sample
     template:
       metadata:
         labels:
           app: sample
       spec:
         containers:
           - name: main
             image: nginx:1.25.0
     updateStrategy:
       type: InPlaceIfPossible
   EOF
   ```

1. 別ターミナルで Pod を監視する。

   ```bash
   kubectl get pod -l app=sample -w
   ```

1. さらに別ターミナルで image だけを変える。

   ```bash
   kubectl patch cloneset sample --type='merge' \
     -p '{"spec":{"template":{"spec":{"containers":[{"name":"main","image":"nginx:1.25.3"}]}}}}'
   ```

Pod は名前と IP を保ったまま、`RESTARTS` が増え `AGE` はリセットされない。Pod が再作成されるのではなく、コンテナが in-place で再起動するため。

## 動作確認

両コンポーネントの稼働を確認する。

```bash
kubectl -n kruise-system get deploy kruise-controller-manager
kubectl -n kruise-system get daemonset kruise-daemon
```

patch 後、Pod の in-place 状態 annotation を見る。

```bash
kubectl get pod -l app=sample \
  -o jsonpath='{.items[0].metadata.annotations.apps\.kruise\.io/inplace-update-state}'
```

revision と、完了判定に使うコンテナごとの更新状態が記録されている。

## 次に読むもの

HA、webhook 強化、feature gate、CRD ごとの設定など本番運用は、公式の [Installation](https://openkruise.io/docs/installation) と [CloneSet](https://openkruise.io/docs/user-manuals/cloneset) ドキュメント、および [InPlace Update](https://openkruise.io/docs/core-concepts/inplace-update) コンセプトページを参照。
