# はじめに

> bootc v1.16.2 で検証済み。コマンドは `podman` 入りの Linux ホストと root もしくは `sudo` を想定。

## 前提

- イメージをビルドするための `podman` (または `docker`/`buildah`) が入った Linux ホスト。
- `bootc install` は `--privileged` を要するため root か `sudo`。
- インストール先となる空きブロックデバイスか仮想マシンのディスク。インストールは対象デバイスを上書きする。

## インストール

bootc のバイナリを通常のホストに入れてイメージを指すのではない。bootc は bootc 互換のベースイメージに同梱されており、そのイメージの中から実行する。まず Fedora bootc などの既存ベースイメージから始める。

```bash
podman pull quay.io/fedora/fedora-bootc:42
```

## 最初の動く構成

中核の作業は、ブート可能な OS イメージをビルドし、bootc 互換であることを確認し、インストールすることだ。

1. 派生イメージを作る。`Containerfile` というファイルに以下を入れる。

   ```dockerfile
   FROM quay.io/fedora/fedora-bootc:42
   RUN dnf -y install vim && dnf clean all
   ```

2. `podman` でビルドし、自分のレジストリ向けにタグ付けする。

   ```bash
   podman build -t quay.io/examplecorp/exampleos:latest .
   ```

3. イメージが bootc 互換か確認する。`lint` は `containers.bootc=1` ラベルやカーネル配置などの要件を検査する。

   ```bash
   podman run --rm quay.io/examplecorp/exampleos:latest bootc container lint
   ```

4. イメージをディスクへインストールする。bootc はイメージ自身の中から `--privileged` で実行し、対象ブロックデバイス (ここでは VM の `/dev/vda`) を指定する。

   ```bash
   sudo podman run --rm --privileged --pid=host --ipc=host \
     -v /var/lib/containers:/var/lib/containers -v /dev:/dev \
     --security-opt label=type:unconfined_t \
     quay.io/examplecorp/exampleos:latest \
     bootc install to-disk /dev/vda
   ```

インストールされたシステムは `podman run` 呼び出しに使われた pull 仕様を記録し、以後の更新に使う。よって `quay.io/examplecorp/exampleos:latest` からインストールしたホストは、同じ参照から更新を fetch する。

## 動作確認

インストールしたシステムを起動したら、bootc から見たホスト状態を確認する。

```bash
sudo bootc status
```

出力は `BootcHost` オブジェクトで、`booted` イメージと `staged` / `rollback` エントリを示す。再起動せずに新しいイメージを fetch して queue するには次を実行する。

```bash
sudo bootc upgrade
```

新バージョンは `bootc status` で `staged` として現れ、次回 shutdown 時に適用される。即座に再起動して切り替えるには `sudo bootc upgrade --apply`、直前のデプロイメントを次回ブート向けに queue するには `sudo bootc rollback` を使う。

## 次に読むもの

- `install to-filesystem` など外部インストーラ向けを含むインストール方式: [bootc インストールドキュメント](https://bootc.dev/bootc/bootc-install.html)。
- bootc 互換ベースイメージの作り方と `lint` が課す要件: [bootc イメージドキュメント](https://bootc.dev/bootc/bootc-images.html)。
- 完全なリファレンスと更新モデル: [bootc 公式サイト・ドキュメント](https://bootc.dev/bootc/)。

## 出典

1. [bootc 公式サイト・ドキュメント](https://bootc.dev/bootc/)
2. [bootc ソース (コミット a7f95e7)](https://github.com/bootc-dev/bootc/tree/a7f95e743aa54a2f966edc1a0417ef6d509df9af)
