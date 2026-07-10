# はじめに

> コミット `2487a24` (タグ `v2.9.0` の近傍) の README で検証済み。コマンドは NVIDIA GPU ノードと Helm を備えた Kubernetes クラスタを想定。

## 前提

NVIDIA device-plugin 経路では、README が次を挙げる (`README.md:94-102`):

- NVIDIA ドライバ >= 440
- `nvidia-docker` バージョン > 2.0
- containerd・Docker・CRI-O のいずれかで NVIDIA を既定ランタイムに設定
- Kubernetes >= 1.23
- glibc >= 2.17 かつ < 2.30
- Linux カーネル >= 3.10
- Helm > 3.0

## インストール

GPU ノードにラベルを付けて HAMi の管理対象を絞り、チャートを `kube-system` にインストールする (`README.md:104-134`):

```bash
kubectl label nodes <node-name> gpu=on

helm repo add hami-charts https://project-hami.github.io/HAMi/
helm repo update

helm install hami hami-charts/hami -n kube-system
```

## 最初の動く構成

共有 GPU までの最短経路は、ラベル付きノード 1 台とチャート、そして同梱の例 Pod だ。

1. スケジューラと device plugin が動いているか確認する。

   ```bash
   kubectl get pods -n kube-system
   ```

`hami-scheduler` と `hami-device-plugin` の両方が `Running` になるまで待つ。

1. メモリとコアの予算付きで GPU 1 枚を要求する例ワークロードを投入する。

   ```bash
   kubectl apply -f examples/nvidia/default_use.yaml
   ```

この例 Pod は `nvidia.com/gpu: 1`、`nvidia.com/gpumem: 3000`、`nvidia.com/gpucores: 30` を要求するので、3000MB とコア 30% に制限された物理 GPU 1 枚を取る (`examples/nvidia/default_use.yaml`)。

## 動作確認

Pod がスケジュールされ動いているか確認する:

```bash
kubectl get pod gpu-pod
```

コンテナ内では、`nvidia-smi` のようなツールがカード全体ではなく制限されたメモリを報告する。HAMi-core が注入された `CUDA_DEVICE_MEMORY_LIMIT` を強制するためだ。クラスタ全体の GPU 使用量はスケジューラモニタが公開し、既定ポートは `31993` (`README.md:152-158`):

```text
http://<scheduler-ip>:31993/metrics
```

## 次に読むもの

スケジューリングポリシー (binpack・spread・topology-aware・dynamic MIG)、Volcano と Koordinator の連携、WebUI、HA やベンダごとのセットアップといった本番設定は、公式ドキュメント <https://project-hami.io/docs/> を参照。Helm インストールの完全ガイドは <https://project-hami.io/docs/get-started/deploy-with-helm/> にある。
