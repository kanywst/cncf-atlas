# はじめに

> v2.6.2 の manifest で検証済み。コマンドは稼働中の Kubernetes クラスタと動作する `kubectl` を想定する。

## 前提

- Kubernetes 1.23 以降。
- Node に Pod CIDR を割り当てるため Node IPAM コントローラを有効にする。kubeadm なら `kubeadm init` で `--pod-network-cidr <cidr>` を渡す。
- 各 Node で Open vSwitch (OVS) カーネルモジュールが利用可能であること (多くのディストリでは Antrea Agent の init コンテナがロードする)。

## インストール

固定タグのリリース manifest を適用する。本ディープダイブは v2.6.2 を使う:

```bash
kubectl apply -f https://github.com/antrea-io/antrea/releases/download/v2.6.2/antrea.yml
```

これは upstream にドキュメントされたリリースインストール手順と一致する (`docs/getting-started.md:79`)。

## 最初の動く構成

1. Antrea manifest を適用する (Controller の Deployment と Agent の DaemonSet が `kube-system` に入る)。

    ```bash
    kubectl apply -f https://github.com/antrea-io/antrea/releases/download/v2.6.2/antrea.yml
    ```

2. Agent DaemonSet が全 Node で ready になるまで待つ。

    ```bash
    kubectl -n kube-system rollout status ds/antrea-agent
    ```

3. Pod を 2 つ動かし、IP が付き相互到達できることを確認する。

    ```bash
    kubectl run web --image=nginx
    kubectl run client --image=busybox --command -- sleep 3600
    kubectl get pods -o wide
    ```

リリースではなく `main` を追う場合は、チェックインされた manifest が公開されている (`docs/getting-started.md:86`):

```bash
kubectl apply -f https://raw.githubusercontent.com/antrea-io/antrea/main/build/yamls/antrea.yml
```

## 動作確認

Controller と各 Node の Agent が動いているか確認する:

```bash
kubectl -n kube-system get pods -l app=antrea
```

各 Agent Pod は全コンテナ ready で `Running` のはずで、`antrea-controller` Deployment は ready replica 1 を報告する。上で作ったテスト Pod は `kubectl get pods -o wide` で Pod CIDR からの IP を示すはずである。

## 次に読むもの

- クラスタ固有の注意点や IPsec / 暗号化設定は Antrea Getting started ([出典 7](https://antrea.io/docs/main/docs/getting-started))。
- データプレーン内部は Antrea Architecture and Design ([出典 9](https://github.com/antrea-io/antrea/blob/main/docs/design/architecture.md))。
- 本番のポリシー、送信元 IP 制御、フローエクスポートはリポジトリ `docs/` の Antrea NetworkPolicy / Egress / Flow Aggregator ガイド。
