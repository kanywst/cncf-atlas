# はじめに

> container2wasm v0.8.x 基準。コマンドは Docker Buildx と WASI ランタイムが使える Linux または macOS ホストを想定する。

## 前提

- Buildx 付きの Docker (変換は BuildKit を通る)。
- 出力を実行する WASI ランタイム (たとえば wasmtime)。
- ソースから `c2w` をビルドするなら Go ツールチェインと `make`。リリースページにビルド済みバイナリもある。

## インストール

```bash
make
sudo make install
```

`make` は `c2w` と `c2w-net` のバイナリをビルドし (`Makefile:16`, `Makefile:19`)、`sudo make install` がそれらを `PATH` に置く。あるいはプロジェクトのリリースページからリリースバイナリを取得する。

## 最初の動く構成

1. コンテナイメージを `.wasm` ファイルに変換する。Docker Buildx を回すので初回は時間がかかる。

```bash
c2w ubuntu:22.04 out.wasm
```

1. 出力を WASI ランタイムで実行する。`.wasm` がエミュレート Linux を起動し、コンテナ内でコマンドを走らせる。

```bash
wasmtime out.wasm uname -a
```

1. ホストディレクトリをゲストにマッピングする。WASI ファイルシステムがそれを見せ、エミュレータが 9p でマウントする。

```bash
wasmtime --mapdir /mnt/share::/tmp/share out.wasm cat /mnt/share/from-host
```

既定の amd64 ではなく riscv64 を狙うなら `--target-arch` を渡す。

```bash
c2w --target-arch=riscv64 riscv64/ubuntu:22.04 out.wasm
```

ブラウザ向けには `--to-js` で JavaScript と Wasm のアセットを出力する。

```bash
c2w --to-js alpine:3.20 /tmp/out-js/htdocs/
```

## 動作確認

`wasmtime out.wasm uname -a` が Linux カーネルの文字列を出せば、エミュレータが起動し、runc がコンテナを立ち上げ、その中でコマンドが走ったことになる。既定の最適化モードは wizer の事前起動スナップショットを使うため (`Dockerfile:29`)、起動時はカーネルブートを飛ばしてスナップショットから再開し、最初の出力行はすぐに現れるはずだ。ネットワークにはホスト側の `c2w-net` ヘルパーが要る。WASI にはソケットが無いためだ。

## 次に読むもの

- [README](https://github.com/container2wasm/container2wasm/blob/main/README.md) が対応ランタイム・ブラウザ出力・`c2w-net` によるネットワークを説明している。
- 再配布前にライセンスの注意を確認すること。生成 `.wasm` には LGPL-2.1 ほかのライセンスのエミュレータコードが同梱される。
- 本プロジェクトは実験的で CNCF Sandbox 段階だ。性能と安定性はそれ相応に扱うこと。

## 出典

1. [container2wasm README](https://github.com/container2wasm/container2wasm/blob/main/README.md), 参照 2026-06-26。
2. container2wasm ソース (コミット [`74662a2`](https://github.com/container2wasm/container2wasm/commit/74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd)), 参照 2026-06-26。
