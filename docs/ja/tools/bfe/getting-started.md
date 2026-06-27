# はじめに

> v1.8.2 (コミット `d8d6dcb`) で検証済み。コマンドは Go 1.22 以上と `make` が入った Unix 系シェルを想定。

## 前提

- Go 1.22 以上 (`go.mod` は `go 1.22` を宣言)。
- `make` と `git`。
- `go build` がモジュールを取得するためのネットワークアクセス。`make prepare` は条件 DSL のパーサを再生成するため `goyacc` をインストールする。

## インストール

リポジトリを clone し `make` でビルドする。デフォルトターゲットは `prepare`、`compile`、`package` を実行し、バイナリと同梱設定のコピーを `output/` 配下に生成する。

```bash
git clone https://github.com/bfenetworks/bfe.git
cd bfe
make
```

## 最初の動く構成

`package` ステップはバイナリを `output/bin/bfe`、設定を `output/conf` に配置する (`Makefile:112-115`)。その同梱設定でサーバを起動する。

1. ビルド出力ディレクトリへ移動する。

    ```bash
    cd output/bin
    ```

2. `-c` に設定ルート、`-l` にログディレクトリを指定して BFE を起動する。これらのフラグは `bfe.go:40-41` で定義されている。

    ```bash
    ./bfe -c ../conf -l ../log
    ```

3. トラフィックを処理せず設定を検証だけしたい場合は `-t` を使う。これは `bfe.go:46` のテスト設定フラグで、設定をロードして終了する。

    ```bash
    ./bfe -t -c ../conf
    ```

## 動作確認

- 起動成功時は `main` で初期化されるロガーを通じて `bfe[version:...] start` がログに出る (`bfe.go:99`)。
- `./bfe -v` はバージョン文字列を表示して終了する (`bfe.go:62-65`)。
- `./bfe -t -c ../conf` は設定が正しければクリーンに終了する。不正な設定では `bfe: configuration file ... test failed` を表示する (`bfe.go:107`)。

同梱の `conf/bfe.conf` は設定済みの HTTP/HTTPS ポートで待ち受ける。ルートを backend に向けたら HTTP リスナーへリクエストを送り、転送を確認できる。

## 次に読むもの

- README は公式 Docker イメージ `bfenetworks/bfe` を `docker run` で動かす方法を説明している (出典 [2])。
- 大規模な設定管理にはコントロールプレーンのリポジトリ (API-Server, Conf-Agent, Dashboard) を使う (出典 [7])。
- Kubernetes では ingress-bfe コントローラをデプロイする (出典 [7])。
- baidu/bfe-book がルーティング・条件 DSL・ロードバランスの詳細リファレンスである (出典 [4])。
