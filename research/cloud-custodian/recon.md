# recon: Cloud Custodian (c7n)

調査メモ。出典は URL 付き。コードは clone した `src/` の実ファイルを読んで `path:line` を残す。

## 基本情報

- repo: `cloud-custodian/cloud-custodian`
- pinned commit: `3d8a56261c07aeaba52bc635f7fd17c55daa3f72` (2026-06-22) / 近いタグ: `0.9.51.0` (`c7n/version.py:2` が `version = "0.9.51"`、PyPI/GitHub Release は `0.9.51.0` 2026-05-28)
- 言語 / ビルド: Python (`requires-python = "<4.0.0,>=3.10.2"`、`pyproject.toml:6`) / `uv` + `pyproject.toml` (`uv.lock` 同梱、`Makefile` あり)
- エントリポイント: `custodian = "c7n.cli:main"` (`pyproject.toml` の `[project.scripts]`)
- ライセンス: Apache-2.0。検証済み。`LICENSE` が Apache 2.0 本文、`pyproject.toml:5` が `license = "Apache-2.0"`、各ソース先頭が `# SPDX-License-Identifier: Apache-2.0` (例 `c7n/policy.py:2`)
- CNCF 成熟度: Incubating (Sandbox 2020-06-25、Incubating 2022-09-14)
- カテゴリ (本タスク指定): Security & Compliance
- 規模 (gh API, 2026-06-24): stars 6,014 / forks 1,625 / open issues 1,676 / contributors ページ最終ページ 418 (`per_page=1` の Link ヘッダ `rel="last"` より約 418 名) / repo 作成 2016-03-01

## 歴史の素材

- 2016 年、Capital One 社内で Kapil Thangavelu が作成。クラウド移行初期の「アドホックなスクリプト群」を、統一されたメトリクスとレポートを持つ軽量で柔軟なツールに統合する目的。出典: [CNCF blog 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/)
- リポジトリ自体は 2016-03-01 作成 (gh API `created_at`)。
- CNCF Sandbox 受理: 2020-06-25 (Capital One が寄贈)。出典: [CNCF projects page](https://www.cncf.io/projects/cloud-custodian/)
- CNCF Incubating 昇格: 2022-09-14、TOC 投票で承認。昇格時点で contributors 350+ / 組織 130+ / GitHub stars 4.3K / ダウンロード 150M+。出典: [CNCF blog 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/)
- パッケージング: PyPI に `c7n` プレフィックスのモジュール群、Docker Hub `cloudcustodian/c7n` でも配布。出典: [PyPI c7n](https://pypi.org/project/c7n/) / [Docker Hub](https://hub.docker.com/r/cloudcustodian/c7n)

## アーキテクチャの素材

ポリシーは YAML DSL。`resource` (対象クラウドリソース型) + `filters` (絞り込み条件) + `actions` (実行操作) + 任意の `mode` (実行モード) で記述する。プラグインレジストリでリソース型・フィルタ・アクションを文字列キーに束ねるのが中核。

トップレベル構成 (`src/c7n/`):

- `cli.py` / `commands.py`: CLI (argparse)。サブコマンド `run` / `report` / `schema` / `validate` など。
- `policy.py`: `Policy` 本体と実行モード (`pull` / `lambda` / `cloudtrail` 他) のレジストリ。
- `query.py`: `QueryResourceManager` / `TypeInfo` / `ResourceQuery`。クラウド API 呼び出しとリソース列挙。
- `manager.py`: `ResourceManager` 基底。`filter_resources` でフィルタを順次適用。
- `filters/` `actions/`: フィルタ・アクションの基底と汎用実装 (`value` フィルタなど)。
- `registry.py`: `PluginRegistry` (文字列→クラスの単純マップ + entry_point ロード)。
- `schema.py`: 登録済みリソース/フィルタ/アクションから JSON Schema を動的生成 (`generate()` `schema.py:359`)。
- `resources/`: AWS リソース実装 120 ファイル (`c7n/resources/*.py`)。
- `tools/c7n_*`: プロバイダ・周辺ツール。`c7n_azure` `c7n_gcp` `c7n_kube` `c7n_oci` `c7n_openstack` `c7n_tencentcloud` `c7n_awscc`、通知 `c7n_mailer`、マルチアカウント `c7n_org`、IaC スキャン `c7n_left`、Terraform `c7n_terraform` など。

実行モード (`mode.type`) は `execution` レジストリに登録される (`policy.py`)。`pull` が既定 (`policy.py:1230` で `mode` 未指定なら `{'type': 'pull'}`)。`lambda` 系 (`cloudtrail` `periodic` `config-rule` `guard-duty` など) は AWS Lambda 上でイベント駆動実行する `ServerlessExecutionMode`。

## 内部実装の素材

代表操作 = `custodian run policy.yml` を pull モードで end to end に追う。

1. エントリポイント `c7n.cli:main` (`pyproject.toml` scripts)。argparse で `run` サブコマンドを解決 (`c7n/cli.py:8` で `import argparse`)。
2. `commands.run(options, policies)` (`c7n/commands.py:290`)。policy を順に `policy()` 呼び出し、例外は捕捉して継続、失敗があれば exit code 2 (`c7n/commands.py:306-320`)。
3. `Policy.__call__` (`c7n/policy.py:1374`)。`run = __call__` (`c7n/policy.py:1392`)。pull のような非サーバレスモードでは `mode.run()` を呼ぶ (`c7n/policy.py:1388`)。
4. `PullMode.run` (`c7n/policy.py:315`)。`is_runnable()` で condition を評価 (`c7n/policy.py:316`) → `resource_manager.resources()` でリソース取得 (`c7n/policy.py:330`) → `resources.json` 出力 (`c7n/policy.py:351`) → dryrun ならアクション省略 (`c7n/policy.py:356`) → 各アクション `a.process(resources)` 実行 (`c7n/policy.py:364`)。
5. `QueryResourceManager.resources` (`c7n/query.py:526`)。キャッシュ確認 → `self.source.resources(query)` でフェッチ → `augment()` でタグ等を補完 (`c7n/query.py:542-545`) → `filter_resources()` 適用 (`c7n/query.py:551`) → `check_resource_limit` でサーキットブレーカ (`c7n/query.py:555`)。
6. `ResourceManager.filter_resources` (`c7n/manager.py:102`)。フィルタを順に `f.process(resources, event)` で適用、空集合になれば打ち切り (`c7n/manager.py:107-113`)。
7. 実 API 呼び出しは `ResourceQuery.filter` (`c7n/query.py:66`) → `_invoke_client_enum` (`c7n/query.py:49`)。`TypeInfo.enum_spec` の `(describe_op, jmespath_path, extra_args)` を使い、boto3 paginator で全件取得 → jmespath で配列を抽出 (`c7n/query.py:50-62`)。EC2 なら `enum_spec = ('describe_instances', 'Reservations[]', None)` (`c7n/resources/ec2.py:128`)。

中核データ構造:

- `Policy` (`c7n/policy.py:1168`): YAML 1 ブロックをラップ。`resource_manager` `conditions` `ctx` を保持。`execution_mode` プロパティで `mode.type` を解決 (`c7n/policy.py:1229`)。
- `PluginRegistry` (`c7n/registry.py:5`): 文字列→クラスの単純マップ。`register()` がクラスデコレータ兼用で `klass.type = name` を設定 (`c7n/registry.py:48-68`)。リソース/フィルタ/アクション/モード/ソース全てこれで束ねる。
- `QueryResourceManager` + `TypeInfo` (`c7n/query.py:452` / `c7n/query.py:796`): リソース型のメタモデル。`service` `enum_spec` `id` `filter_name` `filter_type` `arn_type` `config_type` 等を宣言的に持つ (例 `c7n/resources/ec2.py:125-147`)。`source_mapping` で `describe` / `config` ソースを切替 (`c7n/resources/ec2.py:154-157`)。
- `Filter` / `ValueFilter` (`c7n/filters/core.py:198`): `process(resources, event)` がフィルタの基底契約 (`c7n/filters/core.py:206`)。`FilterRegistry` は `value` `or` `and` `not` `event` `reduce` `list-item` を既定登録 (`c7n/filters/core.py:124-132`)。`Action` 基底は `c7n/actions/core.py:46`。
- 実行モードレジストリ `execution` (`c7n/policy.py`): `@execution.register('pull')` 等でモードを登録 (`c7n/policy.py:306`)。`PolicyExecutionMode` が基底 (`c7n/policy.py:218`)。

非自明な設計判断: ポリシー検証用の JSON Schema は静的定義ではなく実行時に生成する。`QueryMeta` メタクラス (`c7n/query.py:179`) が、`resource_type` を持つリソースクラス定義時に per-resource な `FilterRegistry` / `ActionRegistry` を自動生成し (`c7n/query.py:185-190`)、`service == 'ec2'` や `universal_taggable` を見てタグ用フィルタ/アクションを自動登録する (`c7n/query.py:198-207`)。`schema.py` の `generate()` (`c7n/schema.py:359`) が登録済み全リソース・フィルタ・アクションを走査して Draft7 の jsonschema を組み立て、`validate()` (`c7n/schema.py:56`) が `jsonschema.Draft7Validator` でポリシーを検証する (`c7n/schema.py:22`)。結果としてプラグインを足すだけで DSL とその検証スキーマが拡張される。もう一点、リソース列挙が `enum_spec` という宣言的タプルで boto3 API にバインドされ、`ResourceQuery._invoke_client_enum` が汎用にページングと jmespath 抽出を行う (`c7n/query.py:49-64`)。リソース 120 種を薄い宣言で足せるのはこの仕組みのため。

## 採用事例の素材

リポジトリの `ADOPTERS.md` (本文「production environments that have publicly shared」) に列挙。出典: [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md)

- Avalara / Capital One / Code 42 / CyberArk / Databricks / Grupo / HBO Max / Intuit / JP Morgan Chase & Co / Premise Data / Sage / Siemens / Zapier

CNCF blog (昇格記事) でも Capital One, Code 42, HBO Max, Intuit, JP Morgan Chase & Co, Siemens, Premise Data, Zapier を production 利用として言及。出典: [CNCF blog 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/)

捏造はしない。これ以上の組織名は上記の citable な範囲に留める。

## ガバナンス

- `GOVERNANCE.md`: 透明性・ベンダ中立・コミュニティ主導を掲げ、CNCF Code of Conduct に従う。プロジェクトを機能エリア (AWS/GCP/Azure/Tencent/Oracle Provider、c7n-org、Mailing & Notifications、Docs & Community、Releases & Tooling) に分割し、各エリアに `OWNERS.md` / `CODEOWNERS` で Area Maintainer を置く。Core Maintainers がクロスエリア判断と CNCF 連携を担う。出典: [GOVERNANCE.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/GOVERNANCE.md)
- `SECURITY.md` あり (脆弱性報告手順)。

## 代替・エコシステム

- 代替/隣接:
  - Open Policy Agent / Gatekeeper, Kyverno: ポリシー as code だが主に Kubernetes admission 側。c7n はクラウドプロバイダ API のリソース統制 (列挙→フィルタ→アクション、後始末や off-hours 停止まで) が本領で守備範囲が違う。
  - Prowler / ScoutSuite / Steampipe: クラウドのセキュリティ評価・クエリ寄り。c7n は検出に加えて remediation アクションと Lambda/イベント駆動の常時運用を一体で持つ点が差。
  - AWS Config Rules / Azure Policy: クラウドベンダ純正だが単一クラウド。c7n は AWS/Azure/GCP を共通 DSL で横断する。
- エコシステム/統合 (`tools/` 配下): `c7n_mailer` (SQS 経由通知)、`c7n_org` (マルチアカウント/サブスクリプション一括実行)、`c7n_left` (IaC/Terraform 等のシフトレフト scan、`c7n_terraform`)、`c7n_kube` (Kubernetes admission)、`c7n_awscc` (AWS Cloud Control API でリソース網羅)、各クラウド provider プラグイン。AWS Lambda + CloudWatch Events/Config によるサーバレス常時施行が標準的な運用形態。

## インストールと最小動作

出典: [README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md) / [PyPI c7n](https://pypi.org/project/c7n/)

```bash
python3 -m venv custodian
source custodian/bin/activate
pip install c7n
```

最小ポリシー (`custodian.yml`、起動中の全 EC2 を対象):

```yaml
policies:
  - name: my-first-policy
    resource: aws.ec2
    filters:
      - "State.Name": running
```

dryrun → 実行:

```bash
custodian run --dryrun -s out custodian.yml
custodian run -s out custodian.yml
```

`README.md:166` `:169` に同等コマンド。Docker でも `cloudcustodian/c7n` イメージで `custodian run` 可能 (`README.md:182` 付近)。AWS 認証情報 (環境変数 / プロファイル) が前提。`-s out` は出力ディレクトリで、`out/<policy>/resources.json` に対象リソースが書かれる (`c7n/policy.py:351`)。
