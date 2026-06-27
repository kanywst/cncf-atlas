# はじめに

> v0.6.0 で検証済み。コマンドは root 権限のある Linux ホストと、eBPF/XDP をサポートする比較的新しいカーネルを想定する。ビルドには Rust 1.85.0 以降 (edition 2024) が必要だ。

## 前提

- Linux ホスト (eBPF と XDP は Linux カーネル機能。bpfman は macOS や Windows では動かない)。
- Rust ツールチェーン 1.85.0 以降 ([rustup](https://rustup.rs) から)。
- `sudo` または root (eBPF プログラムのロードはカーネルに触れる)。
- アタッチ先のネットワークインターフェース名 (例: `eth0`)。`ip link` で確認できる。

## インストール

リポジトリをクローンし、workspace をビルドし、同梱スクリプトでバイナリと systemd ユニットをインストールする。

```bash
git clone https://github.com/bpfman/bpfman.git
cd bpfman
cargo build
sudo ./scripts/setup.sh install
```

`cargo build` は `bpfman` CLI と `bpfman-rpc` サーバをコンパイルする。`setup.sh install` はバイナリを `/usr/sbin/` にコピーし、systemd サービスファイルをインストールする (実行すると全ステップを表示する)。

## 最初の動く構成

事前ビルド済みの `xdp_pass` プログラムを OCI (Open Container Initiative) イメージからロードし、インターフェースにアタッチし、最後に削除する。v0.6.0 では load と attach は別ステップだ。`load` がプログラム id を返し、その id を `attach` に渡す。

1. bytecode イメージをロードする。これはプログラムをカーネルに置くだけで、まだアタッチしない。

    ```bash
    sudo bpfman load image --image-url quay.io/bpfman-bytecode/xdp_pass:latest \
        --programs xdp:pass --application XdpPassProgram
    ```

2. 前のコマンドが表示したプログラム id を控え、インターフェースにアタッチする。`<PROGRAM_ID>` をその id に、`eth0` を自分のインターフェースに置き換える。

    ```bash
    sudo bpfman attach <PROGRAM_ID> xdp --iface eth0 --priority 35
    ```

3. 終わったらアンロードする。これでデタッチされ、カーネルから取り除かれる。

    ```bash
    sudo bpfman unload <PROGRAM_ID>
    ```

## 動作確認

bpfman が管理しているプログラムを一覧し、設定したアプリケーション名で自分のものが出るか確認する。

```bash
sudo bpfman list programs --application XdpPassProgram
```

ロードしたプログラムが id・型 (`xdp`)・名前とともに 1 行表示されるはずだ。`unload` 後は同じコマンドで一覧に出なくなる。

## 次に読むもの

gRPC サーバ、Kubernetes operator と CRD (Custom Resource Definition)、socket activation による権限分離、独自 bytecode イメージのビルドについては、公式ドキュメント [bpfman.io](https://bpfman.io/main/) と起動ガイド [Launching bpfman](https://bpfman.io/v0.6.0/getting-started/launching-bpfman/) を参照。
