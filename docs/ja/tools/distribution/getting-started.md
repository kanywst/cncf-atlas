# はじめに

> `v3.1.1` のリリース系列である `registry:3` イメージで検証済み。コマンドはホストに Docker があることを想定する。

## 前提

- Docker がインストールされ稼働していること。レジストリは `registry` イメージのインスタンスであり、Docker の中で動く (deploying ドキュメント)。
- ローカルの空きポート 1 つ。例では `5000` を使う。

イメージ同梱のデフォルト設定は開発向けだ。ログレベルは `debug` で、OpenTelemetry のエクスポートが有効になっている。ローカルテストを超える用途では、その前段に TLS とアクセス制御の仕組みが必要になる (deploying ドキュメント)。

## インストール

ビルドするものは無い。公式イメージを動かす。

```bash
docker run -d -p 5000:5000 --restart=always --name registry registry:3
```

これでレジストリが `localhost:5000` で待ち受ける。この構成はテスト専用で、本番のレジストリは TLS で保護しなければならない (deploying ドキュメント)。

## 最初の動く構成

イメージをローカルレジストリに push し、また pull し戻す。これで blob upload と blob GET のパスを端から端まで動かす。

1. push する対象として、小さい公開イメージを pull する。

   ```bash
   docker pull ubuntu:16.04
   ```

1. ローカルレジストリ向けにタグ付けする。タグの先頭がホストとポートのとき、Docker は push 時にそれをレジストリの場所として扱う。

   ```bash
   docker tag ubuntu:16.04 localhost:5000/my-ubuntu
   ```

1. push する。これで POST/PATCH/PUT の blob upload セッションが走り、各 blob が digest チェックで確定される。

   ```bash
   docker push localhost:5000/my-ubuntu
   ```

1. ローカルのコピーを消し、自分のレジストリから pull してイメージが返ってくることを確かめる。

   ```bash
   docker image remove ubuntu:16.04
   docker image remove localhost:5000/my-ubuntu
   docker pull localhost:5000/my-ubuntu
   ```

## 動作確認

レジストリは OCI Distribution API を `/v2/` 以下に公開する。base チェックは `200` を返す。

```bash
curl -s http://localhost:5000/v2/
```

push が着地したかを確かめるには、リポジトリのタグを API 経由で一覧する。

```bash
curl -s http://localhost:5000/v2/my-ubuntu/tags/list
```

`my-ubuntu` とそのタグを含む JSON が返れば、blob が保存され、link され、返し配信されているということだ。

## 次に読むもの

ストレージドライバ (S3・GCS・Azure Blob)・TLS・認証・ロードバランサ配下での運用は、公式ドキュメント <https://distribution.github.io/distribution/> の configuration と deployment ガイドに従う。本番のレジストリは、Distribution 単体ではなく Harbor のようなより大きな製品のコンポーネントとして動かされることが多い。Distribution 自身は RBAC・スキャン・UI を含まないためだ。
