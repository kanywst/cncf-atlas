# はじめに

> ドキュメント基準コミット `fe36ad62` の `VERSION` は `1.20.0-dev`。ローカルで試すなら最新の安定リリースを使う。コマンドは Docker・`kubectl`・`kind` を入れた Linux ホストを想定。バージョン整合は [Cilium Getting Started](https://docs.cilium.io/en/stable/gettingstarted/) で確認すること。

## 前提

- CNI を入れられる Kubernetes クラスタ。試すだけなら `kind` が最速。
- そのクラスタに到達できる設定済みの `kubectl`。
- `PATH` 上の `cilium` CLI (`cilium-cli`)。
- Cilium が使う eBPF 機能に足る新しさの Linux カーネル。要件は公式ドキュメントに列挙されている。

## インストール

`cilium` CLI を入れ、それでクラスタに Cilium をインストールする。`kind` クラスタの場合、Cilium がネットワーキングを担えるようデフォルト CNI 無しで作成する。

```bash
kind create cluster --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
networking:
  disableDefaultCNI: true
EOF

cilium install
```

Helm によるインストールパスもサポートされる。chart の値は公式ドキュメントを参照。

## 最初の動く構成

1. 現在のクラスタコンテキストに Cilium をインストールする。

   ```bash
   cilium install
   ```

1. コントロールプレーンと datapath の起動を待つ。

   ```bash
   cilium status --wait
   ```

1. 組み込みの接続テストを実行する。テスト用ワークロードをデプロイし、pod 間とサービストラフィックを検証する。

   ```bash
   cilium connectivity test
   ```

## 動作確認

`cilium status` はエージェント DaemonSet・operator・Hubble の健全性を報告する。正常なインストールではエージェントと operator が `OK` と表示される。

```bash
cilium status
```

`cilium connectivity test` は datapath が正しくルーティング・適用できていれば合格サマリで終わる。`kubectl -n kube-system get pods -l k8s-app=cilium` でエージェント pod の稼働も確認できる。

## 次に読むもの

kube-proxy 置換、透過暗号化 (WireGuard/IPsec)、ClusterMesh、BGP、Hubble 可観測性といった本番運用は、公式の [Cilium ドキュメント](https://docs.cilium.io/en/stable/gettingstarted/) を辿ること。カーネル要件、datapath モード、強化策はここでは扱わない。
