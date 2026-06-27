# recon: cartography

調査メモ。自分用の密度。出典は URL 付き。path:line は `research/cartography/src` 配下の実ファイルで確認済み。

## 基本情報

- repo: `cartography-cncf/cartography` (旧 `lyft/cartography`。Lyft から CNCF へ移管時に org 変更)
- pinned commit: `cdf66e2882d5d54ad1a9ade225e8f1560da182e8` (2026-06-25, master) / 近いタグ: `0.138.1` (2026-06-19) より 6 コミット先行
- 言語 / ビルド: Python (`requires-python = ">=3.10"`, pyproject.toml:37) / setuptools + uv。`setup.py` は `setup()` のみで設定は pyproject.toml / setup.cfg
- entrypoint: `cartography = "cartography.cli:main"` (pyproject.toml:147)。`python -m cartography` は `__main__.py:6` で `cartography.cli.main()` を呼ぶ
- ライセンス: Apache-2.0 (LICENSE 1 行目 + `license = "Apache-2.0"` pyproject.toml:18)。実ファイル確認済み
- CNCF 成熟度: Sandbox (2024-08-23 受理)
- カテゴリ: Security & Compliance

CNCF (Cloud Native Computing Foundation) は本プロジェクトを 2024-08-23 に Sandbox レベルで受理した ([CNCF project page](https://www.cncf.io/projects/cartography/), 参照 2026-06-26)。

## 何をするものか

クラウド / SaaS (software as a service) のインフラ資産と「資産どうしの関係」を Neo4j グラフ DB に取り込み、Cypher で横断クエリさせるセキュリティツール。元々は Lyft で「攻撃者が管理者権限に到達する最短経路 (attack path) を IAM (identity and access management) グラフから探す」目的で作られた。README.md:12 に「pulls infrastructure assets and their relationships into a Neo4j graph database」とある。30+ プロバイダ (AWS, GCP, Azure, GitHub, Okta, Kubernetes, CVE/Trivy など、README.md:81-99) をサポート。

## 歴史の素材

- 2019-02-27: GitHub repo `lyft/cartography` 作成 (`gh api repos/cartography-cncf/cartography --jq .created_at`, 参照 2026-06-26)。Lyft 社内のセキュリティチーム発。
- 起源の課題: 複雑な IAM 権限を理解し「攻撃者として管理者への最短経路」を見つけるために作られ、後に防御側にも有用と判明 ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7), 参照 2026-06-26)。
- 2023-08: Lyft が CNCF への寄贈を申請 (上記 blog)。
- 2024-08-23: CNCF が Sandbox レベルで受理 ([CNCF project page](https://www.cncf.io/projects/cartography/), 参照 2026-06-26)。
- 移管後の実質変化は Slack ホストが Lyft から CNCF へ、GitHub URL が `cartography-cncf/cartography` へ移った点 (上記 blog)。
- 直近リリース `0.138.1` (2026-06-19)。

## アーキテクチャの素材

トップレベルのコンポーネント (`cartography/` 配下):

- `cli.py` — `CLI` クラス (cli.py:210) と `main()` (cli.py:2762)。`--selected-modules` 指定があれば `build_sync()`、なければ `build_default_sync()` (cli.py:2047-2049)、最後に `run_with_config()` (cli.py:2757)。
- `sync.py` — オーケストレータ。`Sync` クラス (sync.py:137)、ステージ table `TOP_LEVEL_MODULES` (OrderedDict, sync.py:45)、`run_with_config()` (sync.py:374)、`build_default_sync()` (sync.py:485)。
- `intel/` — 50+ プロバイダモジュール。各モジュールは `get_* / transform / load_* / cleanup / sync` の定形を持つ。`analysis.py`, `create_indexes.py`, `ontology` は特別扱い。
- `models/` — 宣言的スキーマ (frozen dataclass)。`models/core/` に基底クラス、`models/aws/` 等に具体スキーマ。
- `graph/` — `querybuilder.py` (スキーマ→Cypher 生成)、`cleanupbuilder.py` (削除クエリ生成)、`job.py` (`GraphJob` 実行器)。
- `client/core/tx.py` — `load()` (tx.py:784) と `load_graph_data()` (バッチ書込)。
- `rules/` — `cartography-rules` CLI のセキュリティルールエンジン。`driftdetect/` — グラフのドリフト検知。

リクエスト (= 1 回の sync) の流れ:

1. `main()` → `run_with_config()` が Neo4j ドライバを生成し、`update_tag` 未指定なら `int(time.time())` を採番 (sync.py:479-481)。
2. `Sync.run()` (sync.py:225) が 1 セッション内で各ステージを順番に `stage_func(neo4j_session, config)` 実行 (sync.py:270)。順序は `TOP_LEVEL_MODULES` の挿入順で `create-indexes` 先頭・`analysis` 末尾を保証 (sync.py:46, 132)。
3. 各ステージ内で provider API (application programming interface) を叩き、load して cleanup する。

設計判断 1 (遅延 import): `_LazyStage` (sync.py:22) が `from cartography.intel.X import func` を初回呼び出しまで遅らせる (sync.py:36-39)。boto3 / azure-mgmt / google-cloud などの重い SDK (software development kit) を、そのステージを実際に走らせる時だけロードするため `import cartography.sync` が軽い。

## 内部実装の素材 (代表 1 経路を端から端まで: AWS EMR)

EMR (Elastic MapReduce) クラスタ取り込みを通しで追える。

1. ステージ実体は `intel/aws/emr.py` の `sync()` (emr.py:104)。region ごとにループ。
2. 取得: `get_emr_clusters()` (emr.py:28) が boto3 で list、`get_emr_describe_cluster()` (emr.py:48) で詳細。結果を dict の list に集約 (emr.py:119-128)。
3. 書込: `load_emr_clusters()` (emr.py:73) が `load(neo4j_session, EMRClusterSchema(), cluster_data, lastupdated=aws_update_tag, Region=region, AWS_ID=current_aws_account_id)` を呼ぶ (emr.py:83-90)。`lastupdated` / `AWS_ID` / `Region` は kwargs として渡る。
4. `load()` (client/core/tx.py:784): 空なら早期 return (tx.py:832-834) → `ensure_indexes()` (tx.py:835) → `build_ingestion_query(node_schema)` (tx.py:836) → `load_graph_data()` (tx.py:837)。
5. `build_ingestion_query()` (graph/querybuilder.py:1128) が Cypher テンプレを `safe_substitute` で埋める。テンプレ本体 (querybuilder.py:1175-1187) は次の verbatim:

   ```text
   UNWIND $DictList AS item
       MERGE (i:$node_label{id: $dict_id_field})
       ON CREATE SET i.firstseen = timestamp()
       SET
           i._module_name = "$module_name",
           i._module_version = "$module_version",
           $set_node_properties_statement
           $set_ontology_node_properties_statement
       $attach_relationships_statement
   ```

6. `load_graph_data()` は `batch()` で 10000 件ずつ `execute_write_with_retry()` し (tx.py:691-698)、`$DictList` パラメータでバッチ投入。
7. 掃除: `cleanup()` (emr.py:94) が `GraphJob.from_node_schema(EMRClusterSchema(), common_job_parameters)` (emr.py:99, 実体 graph/job.py:329) を作り `.run(neo4j_session)` (graph/job.py:217)。生成元は `build_cleanup_queries()` (graph/cleanupbuilder.py:16)。stale node 削除節は `WHERE n.lastupdated <> $UPDATE_TAG ... DETACH DELETE n` (cleanupbuilder.py:280-282)、stale rel 側は `WHERE s.lastupdated <> $UPDATE_TAG ... DELETE s` (cleanupbuilder.py:286-288)。

中核データ構造 (3-5 個):

- `PropertyRef` (models/core/common.py:1)。Neo4j プロパティ値の出所を表す。`set_in_kwargs=False` (既定) なら処理中の dict のフィールド、`True` なら kwargs の単一変数。`__repr__` (common.py:165-167) が `item.<name>` か `$<name>` を返し、これがそのまま生成 Cypher に埋まる。`extra_index` / `ignore_case` / `one_to_many` 等のフラグでマッチ挙動を制御。
- `CartographyNodeProperties` (models/core/nodes.py:13)。abstract frozen dataclass。`id` と `lastupdated` を必須フィールドにし (nodes.py:46-47)、`firstseen` を予約語として禁止 (nodes.py:63-68)。
- `CartographyNodeSchema` (models/core/nodes.py:141)。`label` / `properties` / `sub_resource_relationship` / `other_relationships` / `extra_node_labels` を保持する宣言。例: `EMRClusterSchema` (models/aws/emr.py:60) は `label = "EMRCluster"`、`extra_node_labels = ExtraNodeLabels(["ComputeCluster"])` (emr.py:62)、sub-resource は AWSAccount (emr.py:64)。
- `CartographyRelSchema` (models/core/relationships.py:263) と `TargetNodeMatcher` (relationships.py:97) + `LinkDirection` (relationships.py:13)。例: `EMRClusterToAWSAccountRel` (models/aws/emr.py:47) は `target_node_label = "AWSAccount"`、`rel_label = "RESOURCE"`、`direction = LinkDirection.INWARD` (emr.py:48-53)、matcher は `{"id": PropertyRef("AWS_ID", set_in_kwargs=True)}` (emr.py:49-51)。

非自明な設計判断 (`update_tag` による GC モデル):

Cartography は差分計算をしない。1 回の sync 全体に整数 `update_tag` (epoch 秒) を 1 つ採番し (sync.py:479)、その run で触れた全 node / rel に `lastupdated = $UPDATE_TAG` を書く。load 完了後、スキーマ単位の cleanup ジョブが `lastupdated <> $UPDATE_TAG` の node / rel を削除する (cleanupbuilder.py:280-288)。つまり「今回の run が触らなかったもの = 現実から消えたもの」と見なして掃除する。削除は `sub_resource_relationship` (例: AWS アカウント) にスコープされるため、あるアカウントの古いデータが別アカウントを巻き込まない (cleanupbuilder.py の case 1)。結果として各 sync は冪等なスナップショット書き換えになる。GC (garbage collection) を更新タグ比較で実装している点が肝。

もう 1 つの肝は「Cypher を手書きさせない」宣言的フレームワーク。モジュール作者は frozen dataclass (Node/Rel スキーマ) を定義して `load()` を呼ぶだけで、`querybuilder` が MERGE クエリと index を自動生成する。`load()` の docstring 自身が「handwritten ではなく `build_ingestion_query()` 生成を使え」と明記 (tx.py:665-667)。

## 採用事例の素材

- 専用の `ADOPTERS` ファイルは repo に存在しない (確認済み)。よって名指し採用は出典のあるものだけ。
- 起源は Lyft。Lyft が社内で attack path 分析に使い、その後 CNCF へ寄贈 ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7), 参照 2026-06-26)。
- SubImage (YC W25) が Cartography を基盤に「攻撃者視点でインフラを見る」プロダクトを構築していると創業者が言及 ([Hacker News Launch HN](https://news.ycombinator.com/item?id=43161332), 参照 2026-06-26)。
- maintainers は MAINTAINERS.md に明記 (Alex Chantavy 他 8 名、founding maintainer に Sacha Faust ら)。
- GitHub シグナル (`gh api repos/cartography-cncf/cartography`, 参照 2026-06-26): stars 3,940 / forks 526 / open issues 106 / created 2019-02-27 / 主言語 Python。contributors はページネーション末尾が page=139 (anon 含む概算 ~139)。最新リリース `0.138.1` (2026-06-19)。

## 代替・エコシステム

- エコシステム: Neo4j (5-community で動作, README.md:36)、boto3 / azure SDK / google-api-python-client 等 (pyproject.toml の deps)、CVE (Common Vulnerabilities and Exposures) / Trivy / Syft / Semgrep / Docker Scout など脆弱性ソースと統合。`cartography-rules` で CIS/NIST 系チェックを実行 (README.md:71-79)。
- 代替と本質的差:
  - CloudQuery / Steampipe は SQL ベースのクラウド資産インベントリ。Cartography は Neo4j グラフで「関係」を一級市民にし attack path 探索に向く。逆に Cypher 習得が要る ([CloudQuery blog](https://www.cloudquery.io/blog/cloudquery-vs-cloud-asset-inventory-tools), 参照 2026-06-26)。
  - Prowler / ScoutSuite はコンプライアンスチェック (point-in-time 監査) 寄りで、資産関係グラフは持たない。
  - AWS Config / Azure Resource Graph / GCP Cloud Asset Inventory はクラウド固有でマルチクラウド・マルチアカウント横断が弱い。

## getting-started (README.md:25-79 ベース、そのまま実行可)

```bash
pip install cartography
```

```bash
docker run -d --publish=7474:7474 --publish=7687:7687 -v data:/data --env=NEO4J_AUTH=none neo4j:5-community
```

`http://localhost:7474` が起動したのを確認し、AWS 認証情報を設定した上で:

```bash
cartography --neo4j-uri bolt://localhost:7687 --selected-modules aws
```

確認クエリ例 (Neo4j Browser):

```cypher
MATCH (instance:EC2Instance{exposed_internet: true})
RETURN instance.instanceid, instance.publicdnsname
```
