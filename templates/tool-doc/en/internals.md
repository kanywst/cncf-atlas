# Internals

> Read from the source at commit `{short-sha}`. Every claim here should point at a file and line.

## Code map

{The directories that matter and what lives in each. Skip generated and vendored code.}

| Path | Responsibility |
| --- | --- |
| `{path}` | {what it does} |

## Core data structures

{The few types the whole system turns on: the reconciler state, the policy AST, the request context. Where they are defined and what invariants they hold.}

## A path worth tracing

{Pick one important operation and walk the actual code: entry point, the key branches, where the real work happens, where it persists or responds. Use `file:line` anchors and short quoted snippets.}

```text
{short illustrative snippet or call chain}
```

## Things that surprised me

{Non-obvious design choices found only by reading the code: a cache that changes the consistency story, a fast path, a subtle lock. This is the part a press release never tells you.}
