# はじめに

> `pack` v0.40.7 で検証。`pack build` はローカルの Docker デーモンにイメージを生成するため、Docker が動いていることを前提とする。

## 前提

- ローカルで Docker が動いていること。
- `pack` CLI がインストール済みであること (下記)。

## インストール

```bash
brew install buildpacks/tap/pack
```

## 最初の動作セットアップ

実行可能なイメージへの最短経路は、Paketo builder でアプリディレクトリをビルドし、そのまま実行することだ。

1. アプリのソースディレクトリで、Paketo builder を使ってイメージをビルドする。

   ```bash
   pack build my-app --builder paketobuildpacks/builder-jammy-base
   ```

2. 生成されたイメージを実行する。

   ```bash
   docker run -d -p 8080:8080 -e PORT=8080 my-app
   ```

公式チュートリアルをサンプルアプリで追うなら、同梱の Java サンプルを sample builder でビルドする。

```bash
pack build sample-app --path samples/apps/java-maven --builder cnbs/sample-builder:resolute
```

## 動作確認

- `pack builder suggest` で候補 builder を一覧表示する。
- `pack config default-builder <builder>` で既定 builder を設定すると `--builder` を省略できる。
- `docker run` の後、マップしたポートで応答していることを確認する (`http://localhost:8080`)。

## 次に読むもの

- Paketo builder のリファレンスと本番 builder: [paketo.io/docs/howto/builders](https://paketo.io/docs/howto/builders/)。
- 公式のアプリ開発者向けチュートリアルと概念: [buildpacks.io docs](https://buildpacks.io/docs/for-app-developers/tutorials/basic-app/)。

## 出典

1. [Getting Started / How to Use Paketo Builders (Paketo Buildpacks)](https://paketo.io/docs/howto/builders/)
2. [Basic App チュートリアル (buildpacks.io docs)](https://buildpacks.io/docs/for-app-developers/tutorials/basic-app/)
