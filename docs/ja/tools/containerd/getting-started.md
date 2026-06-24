# はじめに

> 2.x 系 (pin コミット `e96fd14b8`) で検証。コマンドは root 権限のある Linux ホストを想定し、containerd と並べて runc と CNI plugins を入れる前提。

## 前提

- root または sudo が使える Linux ホスト。
- `PATH` 上に runc (containerd が exec する既定の OCI ランタイム)。
- コンテナネットワークが必要なら CNI plugins を導入。

## インストール

公式リリースバイナリ、runc、CNI plugins を GitHub releases から入れる。デーモンバイナリは `containerd`、デバッグ CLI は `ctr`、runc shim は `containerd-shim-runc-v2` である。

```bash
# containerd を展開 (VERSION は入れたいリリースに置換)
tar Cxzvf /usr/local containerd-VERSION-linux-amd64.tar.gz

# runc
install -m 755 runc.amd64 /usr/local/sbin/runc

# CNI plugins
mkdir -p /opt/cni/bin
tar Cxzvf /opt/cni/bin cni-plugins-linux-amd64-VERSION.tgz
```

## 最初の動く構成

コンテナを動かす最短経路は、既定設定を生成し、デーモンを起動し、`ctr` でイメージを pull して実行することである。

1. 既定設定を生成する。

   ```bash
   mkdir -p /etc/containerd
   containerd config default > /etc/containerd/config.toml
   ```

2. デーモンを起動する (本番では同梱の systemd unit を使う。ここでは確認用にフォアグラウンドで動かす)。

   ```bash
   containerd
   ```

3. 別シェルでイメージを pull して実行する。

   ```bash
   ctr image pull docker.io/library/hello-world:latest
   ctr run docker.io/library/hello-world:latest test
   ```

`hello-world` のバナーが表示され、`Hello from Docker!` で始まる行で終わるはずである。

## 動作確認

デーモンがソケットで応答し、把握している内容を一覧できるか確かめる。

```bash
ctr version
ctr namespace list
ctr container list
```

デーモンが `/run/containerd/containerd.sock` で到達可能なら、`ctr version` はクライアントとサーバの一致するバージョンを表示する。Go プログラムからは `client.New("/run/containerd/containerd.sock")` で接続する。

## 次に読むもの

Kubernetes では、kubelet が CRI ソケット `/run/containerd/containerd.sock` 経由で containerd を使う。CRI プラグインは `config.toml` で設定する。systemd 連携、レジストリ認証、snapshotter 選択、隔離ランタイムといった本番運用は、[公式サイト](https://containerd.io/) と [runtime-v2 README](https://github.com/containerd/containerd/blob/main/core/runtime/v2/README.md) を参照。
