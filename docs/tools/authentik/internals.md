# Internals

> Read from the source at commit `9da4c56`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `authentik/policies/` | Policy engine: bindings, processes, evaluation, caching |
| `authentik/flows/` | Flow planner and executor: turns a flow into a stage list |
| `authentik/providers/` | Protocol providers: `oauth2`, `saml`, `ldap`, `proxy`, `rac`, `radius`, `scim` |
| `authentik/sources/` | External IdP and directory integrations |
| `authentik/stages/` | Individual flow steps (identification, password, MFA, consent) |
| `authentik/core/` | `User`, `Group`, `Application`, `Token` |
| `authentik/blueprints/` | Declarative YAML configuration |
| `internal/outpost/proxyv2/` | Go forward-auth reverse proxy |
| `cmd/` | Go outpost entry points: `server`, `proxy`, `ldap`, `radius`, `rac` |

## Core data structures

- `PolicyRequest` (`authentik/policies/types.py:23-44`) carries the evaluation input: `user`, `http_request`, `obj`, `context`, `debug`. Its `should_cache` property returns false for unauthenticated users and for debug requests (`authentik/policies/types.py:46-53`).
- `PolicyResult` (`authentik/policies/types.py:67-90`) holds `passing`, `messages`, `source_binding`, and `source_results`, so the full result tree is preserved.
- `PolicyBinding` (`authentik/policies/models.py:62-108`) is a polymorphic binding pointing at exactly one of a policy, a group, or a user, with `negate`, `timeout` (default 30s), `failure_result`, and `order`. Its `passes()` dispatches on which of the three is set (`authentik/policies/models.py:110-120`).
- `PolicyEngineMode` (`authentik/policies/models.py:20-24`) is the `all` or `any` combination mode.
- `FlowPlan` (`authentik/flows/planner.py:63-73`) is the planner output: parallel lists of `bindings` and `markers`, walked by `next()` (`authentik/flows/planner.py:94-112`).

## A path worth tracing

Follow one policy check end to end.

`PolicyEngine.__init__` builds a `PolicyRequest` from the target `PolicyBindingModel` and the user, and reads the combination mode off the bound object (`authentik/policies/engine.py:51-69`). `bindings()` returns the enabled bindings for that target ordered by `order` (`authentik/policies/engine.py:72-74`).

`build()` then splits the work in two. Static user/group bindings go through `compute_static_bindings()`, which resolves them with a single SQL aggregate using `Count` and `Q` filters rather than spawning anything (`authentik/policies/engine.py:105-146`). The remaining policy bindings each get a `PolicyProcess` connected by a `Pipe`; the process is run synchronously when not in a daemon context, otherwise started in parallel (`authentik/policies/engine.py:166-186`):

```python
our_end, task_end = Pipe(False)
task = PolicyProcess(binding, self.request, task_end)
task.daemon = False
if not CURRENT_PROCESS._config.get("daemon"):
    task.run()
else:
    task.start()
```

Each process runs `PolicyProcess.execute()`, which calls `binding.passes(request)`, applies `negate`, and on a `PolicyException` falls back to `binding.failure_result` (`authentik/policies/process.py:73-104`). For an expression policy, `PolicyEvaluator.evaluate()` runs the Python source and converts a truthy return into `passing` (`authentik/policies/expression/evaluator.py:65-89`). The result is cached under `cache_key()` (built from the binding UUID, session key, and user pk) when `should_cache` is true (`authentik/policies/process.py:25-33`, `authentik/policies/process.py:108-110`).

Finally `PolicyEngine.result` joins process results, cached results, and the static result, then combines them with `all()` for `MODE_ALL` or `any()` for `MODE_ANY` (`authentik/policies/engine.py:207-228`).

```text
PolicyEngine.build -> compute_static_bindings (SQL aggregate)
                   -> PolicyProcess.execute -> binding.passes -> PolicyEvaluator.evaluate
PolicyEngine.result -> all()/any() over (static + cached + process results)
```

## Things that surprised me

The fork is the point. `FORK_CTX = get_context("fork")` and `PROCESS_CLASS = FORK_CTX.Process` (`authentik/policies/process.py:21-23`) mean every expression policy is a forked OS process, isolated and bounded by the binding's `timeout` when the engine joins it (`authentik/policies/engine.py:188-190`). User-supplied Python running inside the request path is sandboxed by process boundary and a timeout, not by trusting the code.

The matching surprise is the fast path: a deployment whose access rules are plain group membership never pays for a process at all, because `compute_static_bindings` answers "do all pass / does any pass" with one database aggregate (`authentik/policies/engine.py:105-146`). Heavy expression evaluation is isolated; simple membership checks are pushed into SQL.
