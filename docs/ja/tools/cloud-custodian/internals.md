# 内部実装

> コミット `3d8a562` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `c7n/cli.py` | argparse CLI とエントリポイント `main` |
| `c7n/commands.py` | サブコマンド実装。`run` がポリシーをループ (`c7n/commands.py:290`) |
| `c7n/policy.py` | `Policy` クラスと `execution` モードレジストリ |
| `c7n/query.py` | `QueryResourceManager`・`TypeInfo`・`ResourceQuery`・`QueryMeta` メタクラス |
| `c7n/manager.py` | `ResourceManager` 基底と `filter_resources` |
| `c7n/registry.py` | 文字列→クラスのマップ `PluginRegistry` |
| `c7n/filters/` | フィルタ基底クラスと `value` などの汎用フィルタ |
| `c7n/actions/` | アクション基底クラス |
| `c7n/schema.py` | 実行時の JSON Schema 生成とポリシー検証 |
| `c7n/resources/` | AWS リソース実装 (約 120 ファイル) |
| `tools/c7n_*` | プロバイダパッケージ (Azure・GCP・OCI・Tencent・Kubernetes) とヘルパ |

## 中核データ構造

`Policy` (`c7n/policy.py:1168`) は 1 つの YAML ブロックをラップし、そのリソースマネージャ・条件・実行コンテキストを保持する。`execution_mode` は `mode.type` を読み、未指定なら `pull` を既定にする。

```python
def execution_mode(self):
    return self.data.get('mode', {'type': 'pull'})['type']
```

これは `c7n/policy.py:1229-1230` である。

`PluginRegistry` (`c7n/registry.py:5`) はプラグインモデルの背骨である。`register` は関数呼び出しとクラスデコレータの両方として働き、どちらの経路でも `klass.type = name` を設定してクラスに自身の DSL キーを知らせる (`c7n/registry.py:48-68`)。

`QueryResourceManager` (`c7n/query.py:452`) と `TypeInfo` (`c7n/query.py:796`) がリソースごとのメタモデルを成す。`TypeInfo` は `service`・`enum_spec`・`id`・`filter_name`・`arn_type`・`config_type` などのフィールドを宣言する。EC2 が簡潔な例である (`c7n/resources/ec2.py:125-157`):

```python
class resource_type(query.TypeInfo):
    service = 'ec2'
    arn_type = 'instance'
    enum_spec = ('describe_instances', 'Reservations[]', None)
    id = 'InstanceId'
    filter_name = 'InstanceIds'
```

同クラスの `source_mapping` が `describe` ソースと AWS Config ソースを切り替える (`c7n/resources/ec2.py:154-157`)。

フィルタの契約は `Filter.process(resources, event)` である (`c7n/filters/core.py:198`, `c7n/filters/core.py:206`)。`FilterRegistry` は全リソースが無償で得るブール/値コンビネータを事前登録する (`c7n/filters/core.py:124-132`):

```python
self.register('value', ValueFilter)
self.register('or', Or)
self.register('and', And)
self.register('not', Not)
self.register('event', EventFilter)
self.register('reduce', ReduceFilter)
self.register('list-item', ListItemFilter)
```

## 追う価値のあるパス

`PullMode.run` が中核ループである (`c7n/policy.py:307`)。`is_runnable` を確認し、リソースを取得し、ディスクへ書き、ドライランを尊重し、アクションを実行する。

```text
PullMode.run (c7n/policy.py:307)
  -> resource_manager.resources()            c7n/policy.py:330
  -> ctx.output.write_file('resources.json') c7n/policy.py:351
  -> if dryrun: return                       c7n/policy.py:357
  -> for a in actions: a.process(resources)  c7n/policy.py:364
```

`QueryResourceManager.resources` はキャッシュ・補完・サーキットブレーカを追加する (`c7n/query.py:526`)。キャッシュが温まっていればそれを返し、そうでなければ `self.source.resources(query)` で取得し、タグで補完し、キャッシュへ保存し、フィルタし、`check_resource_limit` を呼ぶ。取得は `ResourceQuery._invoke_client_enum` で終わり、boto3 でページングし jmespath で配列を抽出する (`c7n/query.py:49-64`):

```python
if client.can_paginate(enum_op):
    p = client.get_paginator(enum_op)
    results = p.paginate(**params)
    data = results.build_full_result()
if path:
    path = jmespath_compile(path)
    data = path.search(data)
```

フィルタリングは逐次かつ短絡する。`filter_resources` はフィルタを反復し、集合が空になり次第止まる (`c7n/manager.py:102-113`)。

## 読んで驚いた点

DSL とその検証スキーマは静的ではない。`QueryMeta` メタクラス (`c7n/query.py:179`) は、`resource_type` を持つリソースクラスが定義されるときに走る。リソースごとの `FilterRegistry` と `ActionRegistry` を自動生成し (`c7n/query.py:185-190`)、型を調べる: `service == 'ec2'` なら EC2 のタグフィルタとアクションを結線し、`universal_taggable` が立っていれば汎用タグ対応を登録する (`c7n/query.py:198-207`)。リソースは手作業ではなく宣言でタグ処理を得る。

検証スキーマはそれらのレジストリから実行時に `schema.generate()` で組み立てられ (`c7n/schema.py:359`)、`schema.validate()` 内の `jsonschema.Draft7Validator` で強制される (`c7n/schema.py:56`, `c7n/schema.py:22`)。結果として、プラグインを足すとポリシーが表現できる範囲と検証器が受け入れる範囲の両方が拡張され、別管理のスキーマファイルは不要になる。

実行パスにもう 1 点: ドライランでなくても `Policy.__call__` はドライランを宣言済みモードではなく明示的に `PullMode` へ通す (`c7n/policy.py:1374-1388`)。これによりサーバレスポリシーを Lambda をプロビジョニングせずにプレビューできる。
