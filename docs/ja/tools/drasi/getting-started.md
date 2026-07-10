# はじめに

> コミット `62b10c7` (タグ `0.10.0` から 18 コミット先) のソースで検証済み。コマンドは `kubectl` で到達できる Kubernetes クラスタと、`curl` の使えるシェルを想定する。

## 前提

- `kubectl` の現在のコンテキストに設定された Kubernetes クラスタ。Drasi はそこにコンポーネントをインストールする。
- CLI インストーラを取得する `curl` (または `wget`)。インストーラは GitHub からリリースバイナリをダウンロードする (`cli/installers/install-drasi-cli.sh`)。
- `drasi init` の間に Drasi のコンテナイメージを pull するためのネットワークアクセス。

## インストール

Drasi は `drasi` CLI を通して使う。リポジトリには、対応するリリースバイナリを `/usr/local/bin` にダウンロードするインストーラスクリプトが同梱されている (`cli/installers/install-drasi-cli.sh:15`, `install-drasi-cli.sh:117`)。

```bash
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh | /bin/bash
```

CLI を用意したら、現在の `kubectl` コンテキストであるクラスタに Drasi プラットフォームをインストールする。`drasi init` がインストールコマンドである (`cli/cmd/init.go`)。

```bash
drasi init
```

## 最初の動く構成

最短の動く経路は、Source と Continuous Query、そしてクエリ出力を表示する Reaction である。リポジトリにはこの形に沿った例のリソースが `cli/` の下にある (`cli/test-source.yaml`, `cli/test-query.yaml`)。

1. 変更を観測したいシステムに接続する Source を apply する。PostgreSQL Source は監視するテーブルを指定する (`cli/test-source.yaml`)。`drasi apply` はリソースを作成・更新する (`cli/cmd/apply.go`)。

```bash
drasi apply -f source.yaml
```

1. 何を観測するかを定義する Continuous Query を apply する。クエリは Cypher で、id で Source を購読し、出力の形を返す (`cli/test-query.yaml`)。

```yaml
kind: ContinuousQuery
apiVersion: v1
name: query1
spec:
  mode: query
  sources:
    subscriptions:
      - id: foo
  query: >
    MATCH
      (i:Item {Category: '1'})
    RETURN
      i.ItemId AS Id,
      i.Name as Name,
      i.Category as Category
```

```bash
drasi apply -f query.yaml
```

1. 出力を観測する Reaction を apply する。チュートリアルは、クエリが追加・更新・削除する行を表示するデバッグ Reaction を使う。

```bash
drasi apply -f reaction.yaml
```

## 動作確認

Drasi が管理しているリソースを一覧し、クエリが動いていることを確認する。

```bash
drasi list query
```

続いてクエリを describe して、その状態と現在の結果集合を見る (`cli/cmd/describe.go`)。

```bash
drasi describe query query1
```

ソーステーブルでクエリのパターン (ここでは `Category` が `1` の `Item`) にマッチする行を変更すると、デバッグ Reaction が対応する追加・更新・削除の結果を表示する。`drasi describe` が正常な状態を示していれば、Source はブートストラップ済みで、クエリがライブの変更を評価している。

## 次に読むもの

公式の Getting Started チュートリアルは、Source・Continuous Query・デバッグ Reaction の一連の流れを Kubernetes 上で歩く (<https://drasi.io/drasi-kubernetes/getting-started/>)。ドキュメントサイト (<https://drasi.io/>) は、プリビルトの Source と Reaction、Continuous Query 言語、本番運用の how-to ガイドをカバーする。カスタム統合については、Source と Reaction の SDK がリポジトリの `sources/sdk` と `reactions/sdk` にある。
