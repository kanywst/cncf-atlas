# はじめに

> インストールコマンドはプロジェクトのインストールドキュメント由来で、`v6.4.x` ラインに対して検証済み。コマンドは、デプロイ可能なクラスタを指す `kubectl` context が動いていることを想定する。

## 前提

- Kubernetes クラスタと、あるネームスペースにワークロードを作成・変更する権限を持つ `kubectl` context。ローカルクラスタ (KIND・minikube・Docker Desktop) でよい。
- インストール済みでそのクラスタを指す `kubectl`。DevSpace は同じ kube-context を読む。
- DevSpace にイメージをビルドさせたい場合はコンテナイメージビルダ (ローカルの Docker か BuildKit、またはクラスタ内 kaniko)。

DevSpace はクラスタに何も入れない。単一のクライアント側バイナリである (インストールドキュメント)。

## インストール

いずれか 1 つを選ぶ。macOS または Linux の Homebrew:

```bash
brew install devspace
```

Linux でのバイナリ直接ダウンロード (AMD64):

```bash
curl -L -o devspace "https://github.com/loft-sh/devspace/releases/latest/download/devspace-linux-amd64" && sudo install -c -m 0755 devspace /usr/local/bin
```

Windows では `scoop install devspace`、またはインストールドキュメントの PowerShell ダウンロード。バイナリが PATH に載っていることを確認する:

```bash
devspace version
```

## 最初の動く構成

中核の仕事は、ライブ同期でクラスタに対してアプリを開発することだ。最短の実経路は、既存プロジェクト用に `devspace.yaml` を初期化し、dev セッションを開始することである。

1. プロジェクトディレクトリから `devspace.yaml` を生成する。対話的な `init` がプロジェクトを調べて config を書き、イメージのビルド方法とデプロイ方法を配線する。

   ```bash
   devspace init
   ```

1. 作業するネームスペースを選ぶ (DevSpace は現在の kube-context を使う):

   ```bash
   devspace use namespace my-dev-namespace
   ```

1. dev セッションを開始する。これは `dev` パイプラインを走らせる。イメージをビルドし、デプロイし、対象 Pod を dev pod に置換し、ヘルパーを注入し、双方向ファイル同期を開く。

   ```bash
   devspace dev
   ```

`devspace dev` は動かしたままにする。パイプラインの進行をストリームし、その後ファイル同期を有効にしたままセッションを開いて保持する。ローカルでファイルを編集すると、変更は再ビルドなしに動作中コンテナへ同期される。

## 動作確認

`devspace dev` の実行中に、dev pod がネームスペースで起動していることを確認する:

```bash
kubectl get pods -n my-dev-namespace
```

置換された開発用 Pod が Running で見えるはずだ。同期経路を端から端まで確認するには、コンテナ内でターミナルを開き、たった今ローカルで編集したファイルを探す:

```bash
devspace enter
```

正常なセッションでは、ファイルを編集するたびに sync ログがアップロード・ダウンロードされた変更を報告し、注入された `devspacehelper` バイナリがコンテナ内の `/tmp/devspacehelper` に存在する。セッションを止めると、DevSpace は Pod 置換を元に戻し、元のワークロードを復元する。

## 次に読むもの

`devspace.yaml` の完全なリファレンス (pipelines・imports・dev config・ビルド/デプロイのバックエンド)、本番と CI での利用、SSH やポートフォワーディングの設定は、公式ドキュメント <https://www.devspace.sh/docs/> を参照する。Pipelines リファレンス (<https://www.devspace.sh/docs/configuration/pipelines/>) が、[アーキテクチャ](./architecture) のページで説明した default ワークフローの上書きを扱う。
