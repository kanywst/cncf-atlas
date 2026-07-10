# はじめに

> コミット `65d975b` (最寄りタグ `v2.8.8`) の `flux bootstrap github` フローに基づく。コマンドは動作する `kubectl` コンテキストと GitHub アカウントを想定する。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ。
- GitHub アカウントと repo スコープの personal access token。
- `flux` CLI (下でインストール)。

## インストール

```bash
brew install fluxcd/tap/flux
```

Makefile は同じバイナリをソースから `CGO_ENABLED=0 go build -ldflags="-s -w -X main.VERSION=..." -o ./bin/flux ./cmd/flux` でビルドする (`Makefile:57`)。

## 最初の動く構成

最短経路は `flux bootstrap github` だ。必要ならリポジトリを作成し、`flux-system` にコントローラをインストールし、自己同期する `Kustomization` を commit する (`cmd/flux/bootstrap_github.go:39`)。

1. クラスタが Flux の前提を満たすか確認する。

   ```bash
   flux check --pre
   ```

1. GitHub token を export する。Flux は `GITHUB_TOKEN` 環境変数から読む (`cmd/flux/bootstrap_github.go:115`)。

   ```bash
   export GITHUB_TOKEN=<your-token>
   ```

1. ブートストラップする。リポジトリ作成、コントローラのインストール、同期構成の commit を行う。デフォルトのリコンサイル間隔は 1 分だ。

   ```bash
   flux bootstrap github \
     --owner=<organization> \
     --repository=<repository name> \
     --path=clusters/my-cluster
   ```

## 動作確認

コントローラが健全で、同期オブジェクトがリコンサイルしているか確認する。

```bash
flux check
flux get kustomizations
```

`flux-system` Kustomization は最新の commit リビジョンとともに `Ready` 条件を報告するはずだ。内部的には、ブートストラップは期待リビジョンを `status.lastAttemptedRevision` と照合して同じシグナルを待つ (`pkg/bootstrap/bootstrap.go:268`)。

## 次に読むもの

ここから先は、クラスタパス配下に Kubernetes マニフェストを commit すれば自動でリコンサイルされる。HA、マルチテナンシ、image automation、SOPS による secret 復号など本番運用は [fluxcd.io](https://fluxcd.io/) の公式ドキュメントを参照。
