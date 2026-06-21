---
name: atlas-review
description: Stage 3 of the cncf-atlas engine. Review a project's deep-dive (or any markdown output) for the things that make docs bad: AI tells, broken top-to-bottom readability, missing prerequisites, and uncited claims. Produces a punch-list by default; fixes in place on request. Also runs build, test, and lint. Use before calling a deep-dive done ("review the cilium deep-dive", "check this output").
disable-model-invocation: false
user-invocable: true
allowed-tools: Read Grep Glob Bash(npm *) Bash(npx *) Bash(rg *) Bash(grep *) Bash(ls *) Edit Write
argument-hint: "<tool slug or path> [--fix]"
effort: medium
---

# atlas-review

Read `CLAUDE.md` first. You are the quality gate. Read the target the way a newcomer would, top to bottom, and find what gets in the way. Default to a punch-list. Apply fixes only when called with `--fix` or told to.

Target: a tool slug reviews `docs/tools/<slug>/` and `docs/ja/tools/<slug>/`; a path reviews that file or directory.

## What to check

1. **AI tells.** Flag and remove these patterns:
   - em dashes (`—`). Use a period, comma, colon, or parentheses instead.
   - "X, not Y" antithesis used as filler ("a map, not a logo wall"), and the rule-of-three cadence ("fast, simple, and reliable").
   - empty hedging and throat-clearing ("it's worth noting", "in today's landscape", "essentially", "simply").
   - padding: sentences that restate the heading, lists where prose would do, adjectives with no information.
   - Run `rg -n "—" docs/tools/<slug> docs/ja/tools/<slug>` as a first pass; the rest needs reading.
2. **Top-to-bottom readability.** Read each page in order. Can someone who has only read the earlier pages follow this one? Flag forward references that assume a later page, and jumps that skip a step.
3. **Prerequisite sufficiency.** Every term of art should be introduced before it is leaned on. If a page uses a concept (a CRD, a reconcile loop, an admission webhook) without the reader having met it, either introduce it in one line or link to where it is defined. Flag the gap; do not assume the reader knows.
4. **Sourcing and honesty.** Architecture and Internals claims point at `file:line`. Adopters carry a source. No invented facts. Flag anything asserted without backing.
5. **Bilingual parity.** The Japanese pages carry the same facts, anchors, and structure as the English. Flag drift.
6. **Build, test, lint.** Run `npm run docs:build`, `npm test`, and `npx markdownlint-cli2 "docs/**/*.md"`. All must pass.

## Output

Write a punch-list grouped by the checks above, each item as `file:line` plus the problem and the fix. End with a verdict: ship, or list what blocks it.

With `--fix`: apply the mechanical fixes (em dashes, padding, fence tags, prerequisite one-liners), rerun build, test, and lint, and report what changed and what still needs a human.

## Guardrails

- Reading is the work. The greps catch em dashes and fences; everything else needs you to actually read the pages in order.
- A fix that changes a fact needs a source. If you cannot source it, flag it; do not rewrite it into something plausible.
- Run this against this repo's own output too, including the README and the home pages, not only generated deep-dives.
