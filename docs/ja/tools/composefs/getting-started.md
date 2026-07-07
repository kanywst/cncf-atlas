# はじめに

> commit `298edd6` のソース (meson version `1.0.8`, `src/meson.build:4`) で検証済み。コマンドは C ツールチェインを備えた Linux ホストを想定。マウントには root と、overlayfs・EROFS を備えたカーネルが必要。

## 前提

- Linux マシン。composefs は Linux カーネル機能 (overlayfs、EROFS、任意で fs-verity) の合成であり、他所では動かない。
- ビルドツール: `meson`、`ninja`、C コンパイラ、加えて `libcrypto` (OpenSSL) ヘッダと `pkg-config`。fs-verity ヘッダ (`libfsverity-dev`) と `libfuse3-dev` は任意。Debian/Ubuntu ではパッケージ一式が `hacking/installdeps.sh` にあり、Fedora では `dnf builddep composefs` でまかなえる。
- イメージをマウントするには root 権限。`mkcomposefs` でのイメージ作成に権限は不要。

## インストール

meson と ninja でソースからビルドする:

```bash
git clone https://github.com/containers/composefs
cd composefs
meson setup build
ninja -C build
```

ツールは `build/tools/` に生成される: `mkcomposefs`、`mount.composefs`、`composefs-info`、`composefs-dump`。`mount -t composefs` がヘルパを `PATH` で見つけられるようにするには、`meson install -C build` でシステム全体にインストールする。

## 最初の動く構成

以下はディレクトリからコンテンツアドレスのバッキングストアと EROFS メタデータイメージを作り、中身を確認する。いずれの手順も root を必要としない。

1. サンプルのソースツリーを作る。

    ```bash
    mkdir -p /tmp/cfs-src/dir
    echo hello > /tmp/cfs-src/file.txt
    echo world > /tmp/cfs-src/dir/other.txt
    ```

2. イメージのビルドとバッキングストアの充填を 1 ステップで行う。`--digest-store` は 64 バイトを超える通常ファイルを、その fs-verity ダイジェストを名前としてストアにコピーし、小さいファイルはインライン化する。

    ```bash
    ./build/tools/mkcomposefs --digest-store=/tmp/cfs-store \
      /tmp/cfs-src /tmp/image.cfs
    ```

3. イメージの fs-verity ダイジェストを表示する。検証のために固定するのはこの値。

    ```bash
    ./build/tools/mkcomposefs --print-digest-only /tmp/cfs-src
    ```

4. `basedir` をバッキングストアに向けてイメージをマウントする (root が必要)。ヘルパを直接使う:

    ```bash
    sudo ./build/tools/mount.composefs -o basedir=/tmp/cfs-store \
      /tmp/image.cfs /mnt
    ```

## 動作確認

マウントせずにイメージの内容を一覧する。各パスとそのバッキングオブジェクトまたは symlink 先が表示される:

```bash
./build/tools/composefs-info ls /tmp/image.cfs
```

バッキングストアが完全かを確認するには、参照されているのにストアから欠けているオブジェクトが無いか調べる:

```bash
./build/tools/composefs-info missing-objects --basedir=/tmp/cfs-store /tmp/image.cfs
```

手順 4 でマウントした場合、`/mnt` 下のファイルを読むと元の内容が返るはず。overlayfs を通じてバッキングストアから供給される。

## 次に読むもの

- `man/` のページ (`mkcomposefs.md`、`mount.composefs.md`、`composefs-info.md`、`composefs-dump.md`) が、整合性強制に使う `verity`・`noverity`・`digest` マウントオプションを含め、全フラグを解説する。
- [README](https://github.com/containers/composefs) は形式のバージョニングと、イメージを再作成すれば同じダイジェストが得られる再現性の保証を説明する。
- より高レベルの利用は、Rust クレート [composefs-rs](https://github.com/containers/composefs-rs) や containers/storage の Go ラッパーを参照。
