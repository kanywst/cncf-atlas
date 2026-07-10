# はじめに

> コミット `0d8b1c0` の `charts/artifact-hub` Helm チャートで確認。マネージド利用はブラウザだけで足りる。

## 前提

- マネージド利用: Web ブラウザ。公開するなら `artifacthub.io` のアカウント。
- 自己ホスト: Kubernetes クラスタ、Helm、PostgreSQL データベース (チャートで同梱デプロイも外部利用も可能)。

## インストール

最速の使い方は公開インスタンス `artifacthub.io` で、インストール不要。自前で動かすなら公式 Helm チャートをデプロイする:

```bash
helm repo add artifact-hub https://artifacthub.github.io/helm-charts
helm install artifact-hub artifact-hub/artifact-hub
```

チャートの `db-migrator` Job がインストール時に Tern migration を自動適用する (`charts/artifact-hub/templates/db_migrator_install_job.yaml`)。

## 最初の動く構成

Artifact Hub の中核の仕事は、リポジトリを索引してそのパッケージを検索可能にすることだ。動いているインスタンスで:

1. インスタンスにサインインし、control panel を開く。
2. リポジトリを追加し、その kind (例: Helm) と URL を選ぶ。リポジトリガイドに従う。

   ```bash
   helm repo add my-charts https://example.com/charts
   ```

その後 tracker は次回の実行でリポジトリを走査し、各パッケージを登録する。変わっていないリポジトリは digest 比較でスキップされる (`internal/tracker/tracker.go:41`)。

## 動作確認

公開前に、`ah` CLI でリポジトリのメタデータを検証する:

```bash
ah lint
```

`ah lint` がクリーンなら、そのリポジトリのメタデータは tracker に受理される。自己ホストでは、`hub` サーバが別ポートで Prometheus メトリクスを公開しており (`cmd/hub/main.go:101`)、これをスクレイプして健全性を確認できる。

## 次に読むもの

高可用性、データベース構成、tracker と scanner の設定といった本番の懸念は、プロジェクトの `docs/architecture.md` と [リポジトリガイド](https://artifacthub.io/docs/topics/repositories/) を参照する。デプロイレベルのチューニングは Helm チャートの values が扱う。
