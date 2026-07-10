# Internals

> Read from the source at commit `84cb39c`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `holmes/main.py` | Typer CLI: `ask`, `investigate`, `toolset`; config load and command routing |
| `holmes/config.py` | Reads `~/.holmes/config.yaml` (model, API key, toolsets); alert-source factory |
| `holmes/core/tool_calling_llm.py` | The agentic loop: `ToolCallingLLM`, `call`, `call_stream`, tool dispatch |
| `holmes/core/llm.py` | LiteLLM wrapper (`DefaultLLM`); provider abstraction, token counting, context window |
| `holmes/core/prompt.py` | System and user prompt assembly from Jinja2 templates |
| `holmes/core/tools.py` | `Tool.invoke`, `StructuredToolResult`, the tool status enum |
| `holmes/core/safeguards.py` | Duplicate-call safeguard for the read-only loop |
| `holmes/core/truncation/` | Context-window compaction |
| `holmes/core/tools_utils/` | Oversized tool-output spilling |
| `holmes/plugins/toolsets/` | 46 data-source integrations (YAML and Python) |
| `holmes/plugins/sources/` | Alert ingestion (GitHub, Jira, OpsGenie, PagerDuty, AlertManager) |

## Core data structures

`StructuredToolResult` (`tools.py:96`) is the unified output type every tool returns. It carries a `status`, `data`, `error`, and `params`. The `status` is a `StructuredToolResultStatus` enum (`tools.py:64`) with values `success`, `error`, `no_data`, `approval_required`, and `frontend_pause`. Distinguishing `no_data` from `error` matters: it tells the model "I looked and found nothing" so it can self-correct instead of treating an empty result as a failure.

`ToolCallResult` (`core/models.py:11`) wraps a single tool call's result. `to_llm_message` (`models.py:19`) converts it into a message to feed back to the model, and `to_client_dict` (`models.py:48`) converts it for a client. This is the boundary between what the loop stores and what the model reads next.

`ToolCallingLLM` (`tool_calling_llm.py:196`) is the engine object. It holds `tool_executor`, `max_steps`, the LLM handle, and a results directory. `with_executor` (`tool_calling_llm.py:213`) makes a shallow copy per request so frontend-defined tools can be injected without mutating the shared instance.

## A path worth tracing

Follow `holmes investigate` from the CLI to the final analysis.

```text
main.py:163            _investigate_issue: build prompts, assemble messages, ai.call
  prompt.py:177          build_system_prompt (system prompt from generic_ask.jinja2)
  prompt.py:161          generate_user_prompt (user prompt with the issue text)
tool_calling_llm.py:575  ToolCallingLLM.call -> drains call_stream
tool_calling_llm.py:1101 while i < max_steps:
  tool_calling_llm.py:1163 self.llm.completion(...) via LiteLLM
    no tool_calls -> tool_calling_llm.py:1262 yield ANSWER_END, return (final RCA)
    tool_calls    -> tool_calling_llm.py:1295 ThreadPoolExecutor(max_workers=16)
                       tools.py:353 Tool.invoke -> hit the data source
                       append results to messages, loop again
```

`_investigate_issue` (`main.py:163`) sets the investigation instruction ("Provide a terse analysis of the following ... alert/issue and why it is firing.", `main.py:172`), builds the two prompts (`prompt.py:177`, `prompt.py:161`), and calls `ai.call` (`main.py:189`). `call` (`tool_calling_llm.py:575`) drains `call_stream`, whose loop is `while i < max_steps` (`tool_calling_llm.py:1101`). Each pass calls the model once through LiteLLM (`tool_calling_llm.py:1163`). If the response carries no `tool_calls`, the loop emits `ANSWER_END` with the model's content as the root cause analysis and returns (`tool_calling_llm.py:1262`). If it carries `tool_calls`, they run up to 16 at a time in a `ThreadPoolExecutor` (`tool_calling_llm.py:1295`), each dispatched through `_invoke_llm_tool_call` (`tool_calling_llm.py:866`) down to `Tool.invoke` (`tools.py:353`), and the results are appended to `messages` for the next pass.

Two deterministic safeguards ride inside that loop. The duplicate-call check `prevent_overly_repeated_tool_call` (`safeguards.py:24`) rejects an identical repeated call to stop the model looping on the same query. The approval gate lives in `Tool.invoke`: when a tool needs approval and the call is not yet approved, it returns `APPROVAL_REQUIRED` (`tools.py:363`) instead of running, and the loop pauses. On resume, `_prompt_for_approval_decisions` (`tool_calling_llm.py:696`) collects the human decision, `_execute_tool_decisions` (`tool_calling_llm.py:252`) re-runs approved tools and injects a denial result for rejected ones, and an approved call is bound to a signed token minted at `tool_calling_llm.py:1417`. Injecting a result for every tool call, even a denied one, satisfies the provider rule that every `tool_use` must be answered by a `tool_result`.

## Things that surprised me

The name `call_stream` does not mean token streaming. A comment at `tool_calling_llm.py:1044` states it plainly: the function does not call the model with `stream=True`. It streams Holmes iterations, one at a time, and every model call inside it runs with `stream=False` (`tool_calling_llm.py:1163`). The "stream" is the loop yielding progress, not the model emitting tokens.

The duplicate-call safeguard is only sound because tools are read-only. The comment at `safeguards.py:24` says so directly: refusing an identical repeated call is reasonable only when Holmes does not mutate resources, and if that changed the safeguard would need to be removed or reworked. Read-only tooling is not just a security posture here; it is a precondition for the loop-control logic.

The `investigator` toolset does not fetch data. Instead of an observability integration, it provides a `TodoWrite` tool (`plugins/toolsets/investigator/core_investigation.py:38`, name defined at `core_investigation.py:20`) so the model records its task breakdown deterministically. It is a toolset whose job is to make the model's plan explicit rather than to reach any external system.
