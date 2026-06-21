# 内部実装

> コミット `9da4c56` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `authentik/policies/` | ポリシエンジン: バインディング、プロセス、評価、キャッシュ |
| `authentik/flows/` | フロープランナと executor: フローをステージのリストに変える |
| `authentik/providers/` | プロトコルプロバイダ: `oauth2`、`saml`、`ldap`、`proxy`、`rac`、`radius`、`scim` |
| `authentik/sources/` | 外部 IdP・ディレクトリ連携 |
| `authentik/stages/` | 個々のフローステップ (identification、password、MFA、consent) |
| `authentik/core/` | `User`、`Group`、`Application`、`Token` |
| `authentik/blueprints/` | 宣言的な YAML 設定 |
| `internal/outpost/proxyv2/` | Go の forward-auth リバースプロキシ |
| `cmd/` | Go outpost のエントリポイント: `server`、`proxy`、`ldap`、`radius`、`rac` |

## 中核データ構造

- `PolicyRequest` (`authentik/policies/types.py:23-44`) は評価入力を運ぶ: `user`、`http_request`、`obj`、`context`、`debug`。`should_cache` プロパティは未認証ユーザと debug リクエストに対して false を返す (`authentik/policies/types.py:46-53`)。
- `PolicyResult` (`authentik/policies/types.py:67-90`) は `passing`・`messages`・`source_binding`・`source_results` を持ち、結果のツリー全体を保持する。
- `PolicyBinding` (`authentik/policies/models.py:62-108`) は policy・group・user のちょうど 1 つを指す多態バインディングで、`negate`・`timeout` (既定 30 秒)・`failure_result`・`order` を持つ。`passes()` がどれが設定されているかで振り分ける (`authentik/policies/models.py:110-120`)。
- `PolicyEngineMode` (`authentik/policies/models.py:20-24`) は `all` か `any` の合成モード。
- `FlowPlan` (`authentik/flows/planner.py:63-73`) はプランナの出力で、`bindings` と `markers` の並行リスト。`next()` が歩く (`authentik/flows/planner.py:94-112`)。

## 追う価値のあるパス

1 回のポリシチェックを端から端まで追う。

`PolicyEngine.__init__` が対象 `PolicyBindingModel` とユーザから `PolicyRequest` を構築し、合成モードを対象オブジェクトから読む (`authentik/policies/engine.py:51-69`)。`bindings()` がその対象の有効なバインディングを `order` 順で返す (`authentik/policies/engine.py:72-74`)。

次に `build()` が仕事を 2 つに分ける。静的な user/group バインディングは `compute_static_bindings()` を通り、何も生成せず `Count` と `Q` フィルタによる 1 回の SQL 集計で解決される (`authentik/policies/engine.py:105-146`)。残りの policy バインディングは各々が `Pipe` でつながれた `PolicyProcess` を得る。daemon コンテキストでなければ同期実行、そうでなければ並列起動する (`authentik/policies/engine.py:166-186`):

```python
our_end, task_end = Pipe(False)
task = PolicyProcess(binding, self.request, task_end)
task.daemon = False
if not CURRENT_PROCESS._config.get("daemon"):
    task.run()
else:
    task.start()
```

各プロセスは `PolicyProcess.execute()` を実行し、`binding.passes(request)` を呼んで `negate` を適用し、`PolicyException` 時には `binding.failure_result` にフォールバックする (`authentik/policies/process.py:73-104`)。式ポリシなら `PolicyEvaluator.evaluate()` が Python ソースを実行し、truthy な戻り値を `passing` に変換する (`authentik/policies/expression/evaluator.py:65-89`)。結果は `should_cache` が true のとき `cache_key()` (バインディング UUID・session key・user pk から構成) でキャッシュされる (`authentik/policies/process.py:25-33`、`authentik/policies/process.py:108-110`)。

最後に `PolicyEngine.result` がプロセス結果・キャッシュ結果・静的結果を結合し、`MODE_ALL` なら `all()`、`MODE_ANY` なら `any()` で合成する (`authentik/policies/engine.py:207-228`)。

```text
PolicyEngine.build -> compute_static_bindings (SQL 集計)
                   -> PolicyProcess.execute -> binding.passes -> PolicyEvaluator.evaluate
PolicyEngine.result -> all()/any() over (static + cached + process results)
```

## 読んで驚いた点

要は fork だ。`FORK_CTX = get_context("fork")` と `PROCESS_CLASS = FORK_CTX.Process` (`authentik/policies/process.py:21-23`) により、すべての式ポリシは fork された OS プロセスとなり、隔離され、エンジンが join する際にバインディングの `timeout` で打ち切られる (`authentik/policies/engine.py:188-190`)。リクエストパス内で動くユーザ提供の Python は、コードを信用するのではなくプロセス境界とタイムアウトで sandbox される。

対になる驚きはファストパス: アクセスルールが素朴な group メンバーシップだけのデプロイは、プロセスの代金を一切払わない。`compute_static_bindings` が「全部 pass か / どれか pass か」を 1 回の DB 集計で答えるからだ (`authentik/policies/engine.py:105-146`)。重い式評価は隔離し、単純なメンバーシップ判定は SQL に押し込む。
