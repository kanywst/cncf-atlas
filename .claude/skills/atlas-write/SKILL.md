---
name: atlas-write
description: Stage 2 of the cncf-atlas engine. Turn a completed research/<tool>/ dossier into the bilingual six-section deep-dive under docs/ (en + ja), register the project in docs/.vitepress/tools.ts, and verify the site builds green and markdown is lint-clean. Never researches from scratch; it requires a recon dossier. Use after recon ("write argo-cd", "publish the cilium deep-dive").
disable-model-invocation: false
user-invocable: true
allowed-tools: Read Grep Glob Bash(ls *) Bash(find *) Bash(cp *) Bash(mkdir *) Bash(npm *) Bash(npx *) Edit Write
argument-hint: "<tool slug>"
effort: medium
---

# atlas-write

Stage 2 of the engine. Read `CLAUDE.md` first. You turn `research/<tool>/` into published pages. You do not research here. If the dossier is thin, stop and send it back to `atlas-recon`.

## Preconditions

- `research/<tool>/recon.md` and `sources.md` exist and are filled in.
- A pinned commit sha is recorded. If it is missing, stop; this is not ready.

## Steps

1. **Read the dossier.** `recon.md` and `sources.md`. If a section has no cited material, do not paper over it. Flag the gap and stop.
2. **Copy skeletons.** `cp -r templates/tool-doc/en docs/tools/<slug>` and `cp -r templates/tool-doc/ja docs/ja/tools/<slug>`.
3. **Fill English first**, the source of truth. Six pages: `index` (Overview), `history`, `architecture`, `adoption`, `internals`, `getting-started`. Replace every `{...}` placeholder. Every Architecture and Internals claim points at `file:line`. Every adopter carries its source. Carry the pinned sha into Overview and Internals.
4. **Translate to Japanese.** A full translation with the same facts and the same `file:line` anchors, not a summary. The same six pages under `docs/ja/tools/<slug>/`.
5. **Register in `tools.ts`.** Add one `ToolEntry`: `slug`, `name`, `tagline`, `taglineJa`, `category` (must be in `CATEGORY_ORDER`), `maturity`. This wires up the sidebar and the homepage catalog.
6. **Cross-link.** Make sure the six in-page links resolve and the Overview "In this deep-dive" list matches the files that exist.
7. **Build, test, lint.** `npm run docs:build` must be green (it catches dead links), `npm test` must pass (the catalog check), and markdownlint-cli2 must be clean on every new `.md`. Fix until all three pass.
8. **Update `status.md`** and report to kt: the published path, the catalog entry, and the build result.

## Guardrails

- No fabrication. If recon did not cite it, it does not go on the page. A short honest section beats a padded one.
- Read top to bottom. Each page should make sense to someone who only has the prior pages, with no missing prerequisite. If a term needs context the reader does not have yet, give it.
- Do not touch other projects' pages. One project per run.
- Do not add a component tag to any `.md`. The catalog is injected by the theme. Pages stay plain markdown.
- Do not claim "done" before the build, the test, and the lint all pass. Run them and read the output.

## Voice and language

- Site pages: clear technical English and natural Japanese. No marketing tone, no AI padding, no em dashes, no "X, not Y" filler. Say the thing plainly.
- Markdown clean on first write: blank lines around headings, lists, and tables; a language tag on every fence; never inline-HTML tags.
