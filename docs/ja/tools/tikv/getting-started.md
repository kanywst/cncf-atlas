# はじめに

> コミット `2ce1174` (タグ `v9.0.0-beta.2.pre` 近傍) のソースで検証済み。ビルドコマンドは Unix 系ホストを想定。

## 前提

ビルドツールチェインはリポジトリの `AGENTS.md` に記載されている。

- `git`
- `rustup` (プロジェクトは `rust-toolchain.toml` で nightly を固定。channel は `nightly-2026-01-30`)
- `make`
- `cmake` (gRPC に必要)
- `awk`
- `protoc` (protocol buffer コンパイラ)
- C++ コンパイラ。gcc 5+ または clang (gRPC に必要)

稼働中の TiKV クラスタには Placement Driver (`tikv/pd` の `pd-server`) も必要である。TiKV は単体では動かない。

## インストール

サーバをソースからビルドする。Makefile がツールチェインを固定しフラグを設定するので、`cargo` を直接叩くより Makefile を優先する。

```bash
git clone https://github.com/tikv/tikv.git
cd tikv
make build
```

`make build` はデバッグバイナリを、`make release` は最適化済みバイナリを生成する。サーババイナリは `cmd/tikv-server`、運用 CLI は `cmd/tikv-ctl` から作られる。

## 最初の動く構成

最短の実クラスタは、ループバックインターフェース上の PD 1 台と TiKV 1 台である。TiKV は起動時に PD へ登録するので、PD を先に起動する。

ステップ 1: 単一ノードの Placement Driver を起動する。client URL のデフォルトはポート `2379`。

```bash
pd-server --name=pd1 \
  --data-dir=pd1 \
  --client-urls="http://127.0.0.1:2379" \
  --peer-urls="http://127.0.0.1:2380"
```

ステップ 2: TiKV ノードを起動し、PD を指す。

```bash
tikv-server --pd-endpoints="127.0.0.1:2379" \
  --addr="127.0.0.1:20160" \
  --data-dir=tikv1
```

TiKV のリッスンアドレスのデフォルトはポート `20160`。ここからクライアントライブラリ (`client-rust`・`client-go`・`client-java`・`client-python`) または TiDB 経由で読み書きする。

## 動作確認

運用 CLI で PD 経由にクラスタを問い合わせる。

```bash
tikv-ctl --pd 127.0.0.1:2379 cluster
```

正常なクラスタはクラスタ ID を表示する。PD が `127.0.0.1:20160` のアドレスに store を報告していることで、TiKV プロセスの登録も確認できる。

## 次に読むもの

マルチノード配置・HA・TLS・保存時暗号化・監視・チューニングは公式 TiKV ドキュメントに従う [10]。本番クラスタでは、各バイナリを手動で起動するのではなく、プロジェクトのツールチェイン経由の配置が文書化されている。

## 出典

- [4] [tikv/tikv README](https://github.com/tikv/tikv)
- [10] [TiKV Documentation](https://tikv.org/docs/latest/concepts/overview/)
