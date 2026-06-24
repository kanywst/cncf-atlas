# はじめに

> `v1.23.0` で検証済み。コマンドはクラウド側に既存の Kubernetes クラスタ、エッジ側に root 権限を持つ別マシンがあることを想定。

## 前提

- クラウドホストから到達できる稼働中の Kubernetes クラスタと、有効な kubeconfig。
- クラウドホストの 10000 番ポートに到達できる別のエッジマシン。
- クラウドホストとエッジノードの両方に `keadm` CLI。

## インストール

`keadm` はリリースページから入手するか、ソースからビルドする。

```bash
git clone https://github.com/kubeedge/kubeedge.git
cd kubeedge
make all WHAT=keadm
```

インストーラ CLI は `init`・`gettoken`・`join` を提供する (`keadm/cmd/keadm/app/cmd/cloud/init.go:51`, `keadm/cmd/keadm/app/cmd/edge/join.go:61`)。

## 最初の動く構成

1. クラウドホストでクラスタに対し `cloudcore` をブートストラップする。`keadm init` が Helm 経由でインストールする。

```bash
keadm init --advertise-address="<cloud-host-ip>"
```

1. `cloudcore` が生成した join トークンを読む。

```bash
keadm gettoken
```

1. エッジノードで、クラウドホストの CloudHub ポート (10000) を指定し、手順 2 のトークンを渡してクラスタに参加する。

```bash
keadm join \
  --cloudcore-ipport="<cloud-host-ip>:10000" \
  --token="<token-from-gettoken>"
```

これによりノード上で `edgecore` がインストール・起動される (`keadm/cmd/keadm/app/cmd/edge/join.go:61`)。

## 動作確認

クラウドホストから、エッジノードが Kubernetes ノードとして現れるはずだ。

```bash
kubectl get nodes
```

エッジノードでは、エージェントが動いていることを確認し、クラウドへの keepalive ping をログで見る。

```bash
systemctl status edgecore
journalctl -u edgecore
```

健全なエッジノードは `kubectl get nodes` で `Ready` を報告し、`edgehub` がクラウドリンク越しに定期 keepalive を送るためその状態を保つ (`edge/pkg/edgehub/process.go:106-128`)。

## 次に読むもの

公式の [keadm install guide](https://kubeedge.io/docs/setup/install-with-keadm) が TLS 証明書、QUIC と WebSocket、`cloudcore` の HA、デバイス管理のセットアップを扱う。本番強化は上の最小フローではなくそちらを使う。
