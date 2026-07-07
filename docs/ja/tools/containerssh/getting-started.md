# はじめに

> 公式 examples の quick-start を使う (出典 9)。コマンドは Docker と SSH クライアントが入った Unix シェルを想定。

## 前提

- Docker と Docker Compose。quick-start は ContainerSSH とそのコンテナバックエンドをローカルで動かす。
- Git。examples リポジトリを clone するため。
- SSH クライアント。

## インストール

quick-start では何もビルドしない: examples リポジトリが公式 image を pull する `docker-compose` スタックを同梱している。clone して quick-start ディレクトリに入る (出典 9)。

```bash
git clone https://github.com/ContainerSSH/examples.git
cd examples/quick-start
```

代わりにソースからバイナリをビルドするなら Go を使う: リポジトリルートで `go build ./cmd/containerssh`。公式 image は `containerssh/containerssh` だ。

## 最初の動く構成

quick-start はダミーの認証サーバとダミーの設定サーバを含み、全体が 1 台のマシンで動く。これはテスト専用の構成だ: 同梱の認証サーバは任意のパスワードを通す。公開してはいけない。

1. スタックを起動する。

    ```bash
    docker-compose up -d
    ```

2. SSH で接続する。サンプルの認証サーバは任意のパスワードを通すので、効くのはユーザ名だ。`busybox` で繋ぐと BusyBox コンテナに入り、`foo` はデフォルトのゲスト image を使う (出典 7)。

    ```bash
    ssh foo@localhost -p 2222
    ```

3. 切断すると、その接続のコンテナは削除される。再接続すると新しいものが得られる。

4. 後片付けする。

    ```bash
    docker-compose down
    docker-compose rm
    docker image rm containerssh/containerssh-guest-image
    ```

## 動作確認

- `ssh foo@localhost -p 2222` が成功すると、ホストではなくコンテナ内のシェルプロンプトに着く。`hostname` や `cat /etc/os-release` を実行すると、自分のマシンではなくゲスト image を反映する。
- 接続中にホストで `docker ps` を実行する。`containerssh_connection_id`, `containerssh_ip`, `containerssh_username` のラベルが付いたコンテナが見えるはず (`internal/docker/handler_network.go:88-95`)。切断すると消える。
- host key 未設定でバイナリを直接動かすと、初回起動時に一時 host key を生成して設定ファイルへ書き戻す (`generateHostKeys`, `main.go:238`)。関連する CLI フラグは `-config`, `-dump-config`, `-licenses`, `-healthcheck` (`getArguments`, `main.go:145`)。

## 次に読むもの

- ダミーの認証・設定サーバはプレースホルダだ。実運用では自分の認証・設定 webhook を書く。そのリクエスト/レスポンス形状は公式ドキュメント (出典 6) が扱う。
- honeypot デプロイ (バイナリ監査ログと強い `session` モード隔離を含む) は honeypot ユースケースガイド (出典 8) を参照。
- Kubernetes をバックエンドにする、監査ログをオブジェクトストレージへアップロードする、メトリクスを取るといった本番の関心事は、この quick-start ではなく公式ドキュメント (出典 6) に従う。
