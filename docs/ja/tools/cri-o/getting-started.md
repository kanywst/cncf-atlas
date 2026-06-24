# はじめに

> コミット `68f2617` の `1.37.0` 開発線で検証。コマンドは root 権限を持つ Linux ホストを想定。

## 前提

- OCI ランタイム: runc または crun (`README.md:113-119`)。
- conmon (コンテナ監視プロセス) (`README.md:113-119`)。
- Pod ネットワーク用の CNI plugins (`README.md:113-119`)。
- ソースからビルドする場合のみ Go `1.26.3` 以降 (`go.mod:1`)。

## インストール

CRI-O はパッケージと bundle tarball を提供する。OBS リポジトリと bundle 方式はプロジェクトの [install.md](https://github.com/cri-o/cri-o/blob/main/install.md) に記載されている。パッケージ名やリポジトリ URL はバージョン依存なので、自分のディストリビューションに合わせてそれに従う。

代わりにソースからデーモンをビルドするなら、Makefile が `bin/crio` を生成する (`Makefile:183,212-213`):

```bash
git clone https://github.com/cri-o/cri-o
cd cri-o
make binaries
```

## 最初の動く構成

CRI-O は kubelet が駆動するデーモンで、エンドユーザ CLI はない。最短の実構成は、デーモンを動かし Kubernetes ノードをそのソケットに向けることだ。

1. `crio` デーモンを (root で) 起動する。Unix ソケットで待ち受け、既定パスは `unix:///var/run/crio/crio.sock`。

```bash
sudo crio
```

1. kubelet を CRI エンドポイントフラグでそのソケットに向ける:

```bash
kubelet --container-runtime-endpoint=unix:///var/run/crio/crio.sock
```

クラスタ全体のブートストラップ向けに、リポジトリはチュートリアルを同梱する。kubeadm 用の `tutorials/kubeadm.md`、kind 用の `tutorials/crio-in-kind.md` だ。

## 動作確認

CRI クライアント `crictl` で動作中のソケットと話す。リポジトリの `tutorials/crictl.md` が扱う。version 呼び出しでデーモンが CRI に応答することを確認できる:

```bash
crictl --runtime-endpoint unix:///var/run/crio/crio.sock version
```

正常なデーモンはランタイム名とバージョンを返す。続けて `crictl info` と `crictl pods` でランタイム状態と動作中の sandbox を見られる。

## 次に読むもの

`crio.conf` モデル、runtime handler、CNI 設定、Kubernetes とのバージョン整合など本番運用は、[リポジトリ](https://github.com/cri-o/cri-o) と [install.md](https://github.com/cri-o/cri-o/blob/main/install.md) からたどれる公式ドキュメントを参照。CRI-O のマイナーバージョンは Kubernetes のマイナーバージョンに合わせ続けること。
