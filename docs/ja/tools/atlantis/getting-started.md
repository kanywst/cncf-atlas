# はじめに

> main ブランチのコミット `b7cea53` (リリース `v0.44.0` の直後) で検証。コマンドは Docker と Git が入った Linux / macOS シェル、および Terraform を含むリポジトリを持つ GitHub アカウントを前提とする。

## 前提

- Docker。ソースからビルドしたい場合は Go 1.26 ツールチェーン。
- Atlantis が振る舞う GitHub ユーザの personal access token。
- Terraform / OpenTofu 構成を含むリポジトリ。
- サーバを GitHub webhook に公開する手段 (お試しなら組み込みの `testdrive` が ngrok を自動で使う)。

## インストール

公式コンテナイメージを pull する:

```bash
docker pull ghcr.io/runatlantis/atlantis:latest
```

またはリポジトリのチェックアウトからバイナリをビルドする:

```bash
git clone https://github.com/runatlantis/atlantis.git
make -C atlantis build-service
./atlantis/atlantis version
```

`make build-service` は `CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o atlantis .` を実行し、`atlantis` バイナリをリポジトリルートに出力する (`Makefile:25-26`)。

## 最初の動作構成

実際の実行に最速で到達する方法は、対話的な `testdrive` サブコマンドだ。`main.go:54` で登録されている。デモリポジトリの fork、ngrok によるマシンの公開、webhook の接続を案内してくれる。

1. 案内付きのお試しを起動し、プロンプトに従う:

   ```bash
   ./atlantis/atlantis testdrive
   ```

2. 代わりに本番のサーバを動かすには、最小限のフラグを設定する。`--repo-allowlist` はセキュリティ上必須で、これがないとサーバは起動を拒否する (`cmd/server.go:1077`):

   ```bash
   docker run -p 4141:4141 ghcr.io/runatlantis/atlantis:latest server \
     --gh-user="$GITHUB_USER" \
     --gh-token="$GITHUB_TOKEN" \
     --gh-webhook-secret="$GITHUB_WEBHOOK_SECRET" \
     --repo-allowlist="github.com/your-org/*" \
     --atlantis-url="https://your-atlantis.example.com"
   ```

3. GitHub リポジトリの設定で `https://your-atlantis.example.com/events` (URL はインラインコードで示す。自分の `--atlantis-url` に置き換える) を指す webhook を追加する。content type を `application/json` にし、`--gh-webhook-secret` に渡したものと同じ secret を使い、pull request と issue comment のイベントを購読する。

4. Terraform ファイルを変更する Pull Request を開く。Atlantis は新しい Pull Request で autoplan し、その後 `atlantis apply` とコメントすればマージ前に変更を apply できる。

## 動作確認

サーバが起動し到達可能かを確認する。全フラグの一覧は次で表示される:

```bash
docker run --rm ghcr.io/runatlantis/atlantis:latest server --help
```

サーバが動作し webhook が配信されていれば、Pull Request を開いてから数秒以内に Atlantis の plan コメントが出るはずで、Pull Request の commit status に Atlantis のチェックが表示される。何も起きないときは、GitHub webhook の "Recent Deliveries" タブでレスポンスコードを、サーバログで振り分けられたイベントを確認する。

## 次に読むもの

公式ドキュメント <https://www.runatlantis.io> は、このページが省いた本番の関心事を扱っている。サーバ側リポジトリ設定と `atlantis.yaml`、カスタムワークフロー、team allowlist、Conftest によるポリシーチェック、高可用性のための Redis backend ロック、ユーザトークンの代替としての GitHub App インストールフローなどだ。
