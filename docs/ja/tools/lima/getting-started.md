# はじめに

> Lima v2.1.x を基準。コマンドはハードウェアハイパーバイザが利用できる macOS または Linux ホストを想定。

## 前提

- 仮想化をサポートする macOS / Linux / NetBSD / Windows ホスト。
- macOS/Linux では Homebrew、もしくはリリースバイナリ、もしくはソースからビルドする Go ツールチェーン (`go 1.25.x`)。

## インストール

```bash
brew install lima
```

Linux ではリリースバイナリを使うか、`make` でソースからビルドできる。クローンから `make limactl` で `limactl` と `lima` バイナリを生成し、`make native` でプラグイン・guestagent・ドライバまでビルドする。

## 最初の動く構成

1. 既定インスタンスを起動する。イメージをダウンロードして Linux VM を起動し、ホームディレクトリを read-only でマウントし、ポートを自動転送する。

```bash
limactl start
```

1. ゲスト内のシェルを開く。`lima` コマンドは `limactl shell default` のラッパ。

```bash
lima uname -a
```

1. 同梱の nerdctl ラッパでホストからコンテナを動かす。

```bash
nerdctl.lima run --rm hello-world
```

## 動作確認

ホストからインスタンスの状態を確認する:

```bash
limactl list
```

正常なインスタンスは `STATUS` が `Running` で、SSH ポートが割り当てられている。バックエンドを明示的に選ぶには `--vm-type` を渡す。例えば macOS では `limactl start --vm-type=vz`。

## 次に読むもの

- インスタンスごとの設定は `limactl edit` で編集する。ファイルは `~/.lima/<name>/lima.yaml` で `LimaYAML` スキーマに従う。
- マウント・ネットワーク・ドライバ・YAML リファレンスは [Lima ドキュメント](https://lima-vm.io/docs/) を参照。
- 他のディストロや事前設定済み構成は `templates/` 配下のテンプレートを使う。

## 出典

1. [lima-vm/lima README](https://github.com/lima-vm/lima) (Homebrew インストール), 参照 2026-06-24。
2. [Lima ドキュメント](https://lima-vm.io/docs/), 参照 2026-06-24。
3. Lima ソース (コミット [`9a3f1c4`](https://github.com/lima-vm/lima/commit/9a3f1c443389c673eb619f7b1922b1a4d8e4fd16)), 参照 2026-06-24。
