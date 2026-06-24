# はじめに

> Dapr v1.18.1 (ランタイムはコミット `9f2dcfd9`) で検証。コマンドは Docker が動くセルフホスト構成を想定。

## 前提

- Docker (既定の `dapr init` がコントロールプレーンのコンテナをここに展開する)。
- Dapr CLI (`dapr/cli`)。下記でインストールする。

## インストール

CLI を入れてからランタイムを初期化する。init はサイドカーイメージを取得し、placement・scheduler・Redis のコンテナを Docker に起動する。

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash
dapr init
```

## 最初の動く構成

最短経路は、任意のプロセスをサイドカー付きで動かし、サービス呼び出し API 経由で叩くことだ。

1. アプリをサイドカー付きで起動する。末尾のコマンドは自分のものに置き換える。ここではアプリの代わりに Python の HTTP サーバを置く。

```bash
dapr run --app-id myapp --app-port 8080 -- python3 -m http.server 8080
```

1. サイドカー経由でアプリを呼ぶ。ランタイムは既定で HTTP ポート `3500` を待ち受けるので、app ID `myapp` へのサービス呼び出しは下記になる。ホストはローカルサイドカーで `localhost:3500` として指す。

```bash
curl http://127.0.0.1:3500/v1.0/invoke/myapp/method/
```

サイドカーは app ID で宛先を解決し、resiliency ポリシを適用し、`--app-port` で待つアプリへ呼び出しを転送する (`pkg/api/http/directmessaging.go:97`)。

## 動作確認

- ランタイムバージョンの確認: `daprd --version` がビルドバージョンを表示して終了する (`cmd/daprd/app/app.go:65`)。
- 動作中の Dapr アプリとサイドカーの一覧: `dapr list`。
- コントロールプレーンのコンテナ確認: `docker ps` に `dapr init` が作った placement・scheduler・Redis のコンテナが見えるはず。

## 次に読むもの

Kubernetes では `dapr init -k` で injector・operator・sentry・placement・scheduler を入れ、Pod に `dapr.io/enabled: "true"` を付けるとサイドカーが注入される。HA モード・mTLS 強化・ビルディングブロック API リファレンスなど本番運用は公式ドキュメント [docs.dapr.io](https://docs.dapr.io/) が扱う。
