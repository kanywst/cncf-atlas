# はじめに

> etcd v3.6 の quickstart に基づく [5] [6] [7]。コマンドは Linux amd64 とシェルを想定。

## 前提

- `wget` と `tar` が使える Linux amd64 ホスト。
- localhost でポート 2379 (クライアント) と 2380 (peer) が空いていること。

## インストール

リリースの tarball をダウンロードし、バイナリをパスに置きます。

```bash
ETCD_VER=v3.6.0
wget https://github.com/etcd-io/etcd/releases/download/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz
tar xzf etcd-${ETCD_VER}-linux-amd64.tar.gz
sudo mv etcd-${ETCD_VER}-linux-amd64/etcd* /usr/local/bin/
etcd --version && etcdctl version
```

コンテナで動かす場合、公式イメージは `gcr.io/etcd-development/etcd` (primary)、`quay.io/coreos/etcd` が secondary ミラーです [7]。

## 最初の動く構成

単一メンバーの etcd を動かし、キーを保存します。

1. サーバを起動します。フラグなしだとクライアントは 2379、peer は 2380 で待ち受けます。

```bash
etcd &
```

1. `etcdctl` でキーを書きます。

```bash
etcdctl put greeting "Hello, etcd"
```

期待される出力:

```text
OK
```

1. 読み戻します。

```bash
etcdctl get greeting
```

期待される出力:

```text
greeting
Hello, etcd
```

## 動作確認

エンドポイントの health コマンドでメンバーの正常性を確認します。

```bash
etcdctl endpoint health
```

正常なメンバーは、エンドポイントが healthy であることと応答時間を報告します。

## 次に読むもの

上記の単一メンバー構成はローカル用途専用です。複数メンバークラスタの運用、TLS と RBAC の有効化、ストレージクォータの設定、バックアップと compaction などの本番運用は、公式ドキュメント [etcd.io/docs](https://etcd.io/docs/v3.6/) を参照してください。単一メンバーを実データストアとして運用してはいけません。障害耐性のためクラスタは奇数のメンバーが必要です。
