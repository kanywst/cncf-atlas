---
name: atlas-recon
description: Stage 1 of the cncf-atlas engine. Clone a target CNCF/OSS project into research/<tool>/src, pin a commit, and gather cited material (history, architecture, code internals, real adoption) into research/<tool>/recon.md plus sources.md. Recon never writes site pages; it builds the dossier the write stage turns into a bilingual deep-dive. Use when starting a new project ("recon argo-cd", "deep-dive cilium").
disable-model-invocation: false
user-invocable: true
allowed-tools: Read Grep Glob Bash(git *) Bash(gh *) Bash(ls *) Bash(find *) Bash(rg *) Bash(cat *) Bash(wc *) Bash(jq *) Bash(cloc *) Bash(cp *) Bash(mkdir *) WebFetch WebSearch Edit Write
argument-hint: "<owner/repo or URL> [optional: category]"
effort: medium
---

# atlas-recon

Stage 1 of the engine in this repo. Read `CLAUDE.md` first. You gather the material a deep-dive needs into `research/<tool>/`. You do not write `docs/` pages here.

Budget 30 to 60 minutes. The value is cited, source-read material, not volume.

## Steps

1. **Scaffold.** `cp -r research/_TEMPLATE research/<tool>` (lowercase slug). Fill the project name throughout.
2. **Clone and pin.** Clone upstream into `research/<tool>/src/` (gitignored). Record `git rev-parse HEAD` and the nearest tag in `recon.md`. Everything in Internals and Architecture is verified against this commit.
3. **Orient.** Read the README, CONTRIBUTING, docs, ADOPTERS, and governance. Note the language, build and test commands, module layout, and any generated or vendored code. Use `cloc` and `find` for size and the package tree.
4. **History material.** The origin and the problem that prompted it, the first release, donation and graduation dates, major rewrites. Put a source URL in `sources.md` for each claim: first commit, release notes, founding blog post, maintainer talks.
5. **Architecture material.** The top-level components and what each owns. Trace one representative operation end to end (a reconcile loop, an admission request, a query) and record the `file:line` anchors at each hop. Capture the real design decisions (consistency model, push or pull, extension points) and tie them to design docs or proposals.
6. **Internals material.** The directories that matter, the few core data structures the system turns on, and one code path worth tracing in depth. Use `file:line` for everything. Note what surprised you, the non-obvious choices only visible from the code.
7. **Adoption material, cited only.** Named adopters, each with a citable source: an ADOPTERS file, a CNCF case study, a public talk, an engineering blog. Adoption signals (stars, contributors, DevStats, CNCF survey) with the source and the date. No source means it stays out. Do not invent adopters.
8. **Ecosystem and alternatives.** Adjacent projects, integrations, managed offerings, and the main alternatives with the real distinctions. No strawmen.
9. **Classify.** Pick the `category` (it must be in the `tools.ts` `CATEGORY_ORDER`; propose adding one if none fit) and the `maturity` (the CNCF level or `Independent`), verified against the CNCF landscape or the project.
10. **Write `recon.md` and `sources.md`, update `status.md`.** Then tell kt the slug, category, maturity, and anything thin enough to need a second pass before writing.

## Guardrails

- Stay in cloud native, security, and supply chain unless kt says otherwise. That is where the read is credible.
- Do not write `docs/` pages, edit `tools.ts`, or run the site build. That is `atlas-write`.
- A claim without a source is not material. Drop it or go find the source.

## Voice and language

- `recon.md`, `sources.md`, `status.md` は日本語、自分用メモの密度。出典 URL 必須。AI っぽい水増しはしない。
- Markdown clean on first write: blank lines around headings, lists, and tables; a language tag on every fence; `{...}` placeholders; never inline-HTML tags.
