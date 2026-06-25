# はじめに

> 公式の [getting started](https://istio.io/latest/docs/setup/getting-started/) に沿う。コマンドは稼働中の Kubernetes クラスタと設定済みの `kubectl` を想定。

## 前提

- Kubernetes クラスタ (kind や minikube などローカルでよい)。
- そのクラスタを指す `kubectl`。
- PATH 上の `istioctl` (下記のダウンロードスクリプトで入る)。

## インストール

Istio をダウンロードし、`istioctl` を PATH に追加する。

```bash
curl -L https://istio.io/downloadIstio | sh -
cd istio-*
export PATH=$PWD/bin:$PATH
```

例を追えるだけの機能を有効にする `demo` profile で制御プレーンを install する。

```bash
istioctl install --set profile=demo -y
```

## 最初の動く構成

1. namespace にラベルを付け、新規 Pod に Envoy サイドカーが自動注入されるようにする。

```bash
kubectl label namespace default istio-injection=enabled
```

1. その namespace にワークロードを deploy する。以後 `default` に作られる Pod にはサイドカーが付く。

```bash
kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml
```

1. 各 Pod がアプリと注入された `istio-proxy` の 2 コンテナを持つことを確認する。

```bash
kubectl get pods
```

起動後、各 Pod の READY 列は `2/2` になるはず。

## 動作確認

制御プレーンとプロキシが設定で一致しているか確認する。

```bash
istioctl proxy-status
```

各プロキシは xDS のサブプロトコルである CDS (Cluster Discovery Service)・LDS (Listener Discovery Service)・EDS (Endpoint Discovery Service)・RDS (Route Discovery Service) で `SYNCED` を示すはず。`STALE` は push が未 ACK の意味。設定問題を事前に洗い出すには `istioctl analyze` も使える。

## 次に読むもの

本番では公式ドキュメントの [ambient データプレーン](https://istio.io/latest/docs/)、制御プレーンの高可用性、証明書管理と外部 CA 連携、スケーリング指針を参照。`demo` ではなく本番向け install profile を使うこと。`demo` は運用ではなく機能を試すための調整がされている。
