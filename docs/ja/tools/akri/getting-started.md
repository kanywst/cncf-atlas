# はじめに

> Akri の Helm chart (タグ v0.13.8 の近傍) に対して検証。コマンドは稼働中の Kubernetes クラスタと設定済みの `kubectl` を前提とする。

## 前提

- Kubernetes クラスタ、v1.33 以降 (出典 6)。
- そのクラスタを指す `kubectl`。
- `helm` (v3)。

## インストール

Akri の Helm リポジトリを追加し、コア構成要素 (Controller と Agent のみ) を導入する。

```bash
helm repo add akri-helm-charts https://project-akri.github.io/akri/
helm install akri akri-helm-charts/akri
```

## 最初の動作構成

udev Discovery Handler と、USB ビデオデバイスを発見してデバイスごとに nginx broker をスケジュールする Configuration を有効化する。

1. udev ハンドラと Configuration を有効にしてリリースを install (または upgrade) する。

    ```bash
    helm install akri akri-helm-charts/akri \
        --set udev.discovery.enabled=true \
        --set udev.configuration.enabled=true \
        --set udev.configuration.discoveryDetails.udevRules[0]='KERNEL=="video[0-9]*"' \
        --set udev.configuration.brokerPod.image.repository=nginx
    ```

2. Configuration CRD が作られたことを確認する。

    ```bash
    kubectl get akric
    ```

3. 発見デバイスごとに 1 つできる Instance を watch する (short name は `akrii`)。

    ```bash
    kubectl get akrii
    ```

## 動作確認

Controller と Agent の Pod が動いており、発見デバイスに対して broker がスケジュールされたことを確認する。

```bash
kubectl get pods -o wide
```

USB ビデオデバイスが見つかれば `kubectl get akrii` に Instance が現れ、そのデバイスが見えるノードに broker Pod がスケジュールされる。一致するデバイスがなければ Configuration は存在するが Instance は作られない。これは想定どおりの挙動である。

## 次に読むもの

公式ドキュメント <https://docs.akri.sh/> は、他の Discovery Handler (ONVIF、OPC UA)、gRPC プロトコルに対する独自ハンドラの実装、broker と Service の設定、capacity 調整やメトリクスといった本番の関心事を扱う。
