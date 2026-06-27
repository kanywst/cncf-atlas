# はじめに

> コミット `cdf66e2` の README の Quick Start で検証済み。コマンドは Python 3.10 以上 (pyproject.toml:37) と、Neo4j データベース用の Docker を想定。

## 前提

- Python 3.10 以上 (pyproject.toml:37)。
- Neo4j をローカルで動かすための Docker。
- 少なくとも 1 つのプロバイダの読み取り権限。本ガイドでは AWS を使う。

## インストール

```bash
pip install cartography
```

## 最初の動く構成

README の Quick Start (README.md:25-67) に沿った、クエリできるグラフまでの最短経路である。

1. Neo4j 5 community データベースを起動する。コンテナはブラウザ用ポート 7474 と Bolt プロトコル用ポート 7687 を公開し、ローカル用に認証を無効化する。

    ```bash
    docker run -d --publish=7474:7474 --publish=7687:7687 -v data:/data --env=NEO4J_AUTH=none neo4j:5-community
    ```

2. ブラウザで `http://localhost:7474` を開き、Neo4j が起動したことを確認する。

3. AWS 認証情報とデフォルトリージョンを設定する。例えば `AWS_PROFILE` と `AWS_DEFAULT_REGION`、または `~/.aws/config` で行う。

4. `--selected-modules aws` を渡して AWS だけを取り込む sync を実行する。このフラグは `build_sync(selected_modules)` に対応する (cli.py:2047-2049)。

    ```bash
    cartography --neo4j-uri bolt://localhost:7687 --selected-modules aws
    ```

## 動作確認

`http://localhost:7474` を開き、いま load したデータに対して Cypher クエリを実行する。次のクエリは README (README.md:64-66) のもので、インターネットに露出した EC2 インスタンスを列挙する。

```cypher
MATCH (instance:EC2Instance{exposed_internet: true})
RETURN instance.instanceid, instance.publicdnsname
```

sync が走っていれば、ラベルが無いというエラーではなく行が返る (露出インスタンスが無ければ空の結果)。コマンドラインの出力は各 sync ステージの開始もログに出す。

## 次に読むもの

- [full install guide](https://cartography-cncf.github.io/cartography/install.html) は他プロバイダ・他プラットフォームでの実行を扱う。
- [querying tutorial](https://cartography-cncf.github.io/cartography/usage/tutorial.html) と [data schema](https://cartography-cncf.github.io/cartography/usage/schema.html) はノードラベルと関係を説明する。
- [rules docs](https://cartography-cncf.github.io/cartography/usage/rules.html) はセキュリティチェック用の `cartography-rules` の実行を扱う。
