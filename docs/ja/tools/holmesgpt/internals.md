# 内部実装

> コミット `84cb39c` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `holmes/main.py` | Typer CLI: `ask`・`investigate`・`toolset`。設定ロードとコマンドルーティング |
| `holmes/config.py` | `~/.holmes/config.yaml` を読む (モデル・API キー・toolset)。アラート源のファクトリ |
| `holmes/core/tool_calling_llm.py` | agentic ループ: `ToolCallingLLM`・`call`・`call_stream`・ツールディスパッチ |
| `holmes/core/llm.py` | LiteLLM ラッパ (`DefaultLLM`)。プロバイダ抽象・トークン計算・context window |
| `holmes/core/prompt.py` | Jinja2 テンプレートから system/user prompt を組み立て |
| `holmes/core/tools.py` | `Tool.invoke`・`StructuredToolResult`・ツール status enum |
| `holmes/core/safeguards.py` | read-only ループ向けの重複呼び出しセーフガード |
| `holmes/core/truncation/` | context window 圧縮 |
| `holmes/core/tools_utils/` | 巨大なツール出力の退避 |
| `holmes/plugins/toolsets/` | 46 個のデータソース統合 (YAML と Python) |
| `holmes/plugins/sources/` | アラート取り込み (GitHub・Jira・OpsGenie・PagerDuty・AlertManager) |

## 中核データ構造

`StructuredToolResult` (`tools.py:96`) はすべてのツールが返す統一出力型だ。`status`・`data`・`error`・`params` を持つ。`status` は `StructuredToolResultStatus` enum で (`tools.py:64`)、`success`・`error`・`no_data`・`approval_required`・`frontend_pause` を取る。`no_data` を `error` と区別するのが要で、モデルに「探したが無かった」を伝え、空の結果を失敗と取り違えず自己修正させる。

`ToolCallResult` (`core/models.py:11`) は 1 ツール呼び出しの結果ラッパだ。`to_llm_message` (`models.py:19`) はそれをモデルに戻す message に変換し、`to_client_dict` (`models.py:48`) はクライアント向けに変換する。ここがループの保持物とモデルが次に読むものの境界になる。

`ToolCallingLLM` (`tool_calling_llm.py:196`) はエンジンオブジェクトだ。`tool_executor`・`max_steps`・LLM ハンドル・結果ディレクトリを持つ。`with_executor` (`tool_calling_llm.py:213`) はリクエストごとに shallow copy を作り、共有インスタンスを変更せずに frontend 定義ツールを注入できるようにする。

## 追う価値のあるパス

`holmes investigate` を CLI から最終分析まで追う。

```text
main.py:163            _investigate_issue: プロンプト構築、messages 組立、ai.call
  prompt.py:177          build_system_prompt (generic_ask.jinja2 から system prompt)
  prompt.py:161          generate_user_prompt (issue テキスト入りの user prompt)
tool_calling_llm.py:575  ToolCallingLLM.call -> call_stream を drain
tool_calling_llm.py:1101 while i < max_steps:
  tool_calling_llm.py:1163 self.llm.completion(...) LiteLLM 経由
    tool_calls なし -> tool_calling_llm.py:1262 ANSWER_END を yield して return (最終 RCA)
    tool_calls あり -> tool_calling_llm.py:1295 ThreadPoolExecutor(max_workers=16)
                       tools.py:353 Tool.invoke -> データソースを叩く
                       結果を messages に追記し、再ループ
```

`_investigate_issue` (`main.py:163`) は investigation 用の指示を置き (「Provide a terse analysis of the following ... alert/issue and why it is firing.」, `main.py:172`)、2 つのプロンプトを組み立て (`prompt.py:177`, `prompt.py:161`)、`ai.call` を呼ぶ (`main.py:189`)。`call` (`tool_calling_llm.py:575`) は `call_stream` を drain し、そのループは `while i < max_steps` (`tool_calling_llm.py:1101`)。各パスは LiteLLM 経由でモデルを 1 回呼ぶ (`tool_calling_llm.py:1163`)。応答に `tool_calls` が無ければ、ループはモデルの content を根本原因分析として `ANSWER_END` を emit し、返す (`tool_calling_llm.py:1262`)。`tool_calls` があれば、`ThreadPoolExecutor` で最大 16 並列に走らせ (`tool_calling_llm.py:1295`)、各呼び出しは `_invoke_llm_tool_call` (`tool_calling_llm.py:866`) を経て `Tool.invoke` (`tools.py:353`) までディスパッチされ、結果は次パスのために `messages` に追記される。

そのループの内側に決定的なセーフガードが 2 つ乗る。重複呼び出しチェック `prevent_overly_repeated_tool_call` (`safeguards.py:24`) は同一の重複呼び出しを拒否し、モデルが同じクエリでループするのを止める。承認ゲートは `Tool.invoke` の中にある。ツールが承認を要し、その呼び出しがまだ承認されていなければ、実行せずに `APPROVAL_REQUIRED` を返し (`tools.py:363`)、ループは pause する。再開時、`_prompt_for_approval_decisions` (`tool_calling_llm.py:696`) が人間の判断を集め、`_execute_tool_decisions` (`tool_calling_llm.py:252`) が承認済みツールを再実行し拒否には否認結果を注入する。承認された呼び出しは `tool_calling_llm.py:1417` で mint される署名付きトークンに束ねられる。否認されたものも含めすべてのツール呼び出しに結果を注入するのは、すべての `tool_use` は `tool_result` で答えねばならないというプロバイダの規則を満たすためだ。

## 読んで驚いた点

`call_stream` という名はトークンストリーミングを意味しない。`tool_calling_llm.py:1044` のコメントが端的に述べる。この関数は `stream=True` でモデルを呼ばない。Holmes のイテレーションを 1 回ずつストリームするもので、内部の各モデル呼び出しは `stream=False` で走る (`tool_calling_llm.py:1163`)。「stream」はループが進捗を yield することであって、モデルがトークンを吐くことではない。

重複呼び出しセーフガードが成立するのはツールが read-only だからにすぎない。`safeguards.py:24` のコメントがそう明言する。同一の重複呼び出しの拒否が妥当なのは Holmes がリソースを変更しないときだけで、それが変われば削除か改修が要るという。read-only なツーリングは単なるセキュリティ姿勢ではなく、ループ制御ロジックの前提条件だ。

`investigator` toolset はデータを取りに行かない。observability 統合ではなく、`TodoWrite` ツールを提供し (`plugins/toolsets/investigator/core_investigation.py:38`、名前は `core_investigation.py:20` で定義)、モデルにタスク分解を決定的に記録させる。外部システムに届くのではなく、モデルの計画を明示化することを役割とする toolset だ。
