# はじめに

> trustee のタグ v0.20.0 付近 (コミット `af53e98`) で検証済み。コマンドは Docker と Docker Compose plugin が入った Linux ホスト、加えてクライアントをビルドする Rust ツールチェインを想定。

この手順では `docker compose` クラスタを使う。Key Broker Service (KBS)、Attestation Service (AS)、Reference Value Provider Service (RVPS) をまとめて動かす最も手早い方法である。実際の Trusted Execution Environment (TEE) ハードウェアは不要で、ビルトインの sample attester でクラスタを駆動できる。

## 前提

- Docker と Compose plugin (`docker compose version` が通ること)。
- `kbs-client` バイナリをビルドする Rust ツールチェイン (`cargo`)。
- `git` と trustee リポジトリのチェックアウト。

## インストール

リポジトリを clone してクラスタを起動する:

```bash
git clone https://github.com/confidential-containers/trustee.git
cd trustee
docker compose up -d
```

`setup` コンテナが `kbs/config/docker-compose/` 配下に admin 鍵と admin bearer token (`admin-token` を含む) を自動生成する。KBS は `127.0.0.1:8080` で待ち受ける。

クライアントをビルドしてインストールする (別シェルでリポジトリルートから実行):

```bash
make -C kbs cli
sudo make -C kbs install-cli
```

## 最初の動く構成

クラスタは既定で sample evidence を拒否するので、最初に resource policy を緩める。以下のコマンドは作業ディレクトリが `trustee` チェックアウトであることを想定する。

1. 緩い resource policy ですべてのリクエストを許可する。

   ```bash
   kbs-client config \
     --url http://127.0.0.1:8080 \
     --admin-token-file kbs/config/docker-compose/admin-token \
     set-resource-policy --allow-all
   ```

2. シークレットリソースをパス `default/test/dummy` にアップロードする。

   ```bash
   printf '1234567890abcde\n' > dummy_data
   kbs-client \
     --url http://127.0.0.1:8080 \
     config --admin-token-file kbs/config/docker-compose/admin-token \
     set-resource --resource-file dummy_data --path default/test/dummy
   ```

3. リソースを取得し直す。TEE の外では sample attester が使われ、ステップ 1 の緩いポリシーがこれを許可する。

   ```bash
   kbs-client --url http://127.0.0.1:8080 get-resource --path default/test/dummy
   ```

   成功するとリソースの内容 (base64 エンコード) が出力される。

## 動作確認

KBS の health エンドポイントを確認する。サーバが立っていれば HTTP 200 を返す:

```bash
curl -i http://127.0.0.1:8080/healthz
```

`trustee` チェックアウトから `docker compose ps` を実行しても確認できる。`kbs`、`as`、`rvps` のコンテナが up と表示されるはずである。

## 次に読むもの

- `kbs/quickstart.md` の KBS quickstart は、Ubuntu でのネイティブ (非コンテナ) ビルド、background-check mode、passport mode を扱う。
- `kbs/README.md` の KBS README は、デプロイモード、attestation バックエンド、TLS 設定を説明する。
- Kubernetes での本番デプロイは、プロジェクト Web サイト <https://confidentialcontainers.org/> から参照できる KBS operator を見ること。
