# cncf-atlas engine guide

This repo is both a published VitePress site and the engine that fills it. Three skills do the work:

1. **`atlas-recon <owner/repo>`** clones and pins upstream, maps architecture and critical paths, and gathers cited material into `research/<tool>/`. It never writes site pages.
2. **`atlas-write <tool>`** turns the recon dossier into the bilingual six-section deep-dive under `docs/`, registers the project in `tools.ts`, and builds green. It never researches from scratch.
3. **`atlas-review <tool>`** reads the result the way a newcomer would and flags AI tells, broken readability, missing prerequisites, and uncited claims before it ships.

Keep the stages separate so a human can review the dossier before pages get written, and review the pages before they ship.

## Product premise

The CNCF landscape lists hundreds of projects as logos in a grid. It tells you a project exists, not what it is or how it works. This site is the readable version. Every page earns its place by saying something the marketing page does not: read from the source, cited, honest about trade-offs.

## Non-negotiables

- **Source-read, not summarised.** Architecture and Internals come from the actual repo at a pinned commit. Every structural claim points at `file:line`. If you did not read it, do not write it.
- **No fabricated adoption.** Every named adopter needs a citable source (an ADOPTERS file, a CNCF case study, a public talk, an engineering blog). No source means it stays out.
- **Pin the commit.** Record the sha in `research/<tool>/` and in the Overview and Internals pages. Internals claims are only valid against that commit.
- **English is the source of truth; Japanese is a full translation, not a summary.** Both locales carry the same six sections and the same facts.
- **Readable top to bottom.** A page should make sense to a reader who has only seen the earlier pages. Introduce a term before leaning on it.

## Writing voice

No marketing tone. No AI tells. In particular: no em dashes (use a period, comma, colon, or parentheses), no "X, not Y" filler, no rule-of-three padding, no throat-clearing. Short, concrete sentences that carry information.

## Layout

```text
docs/.vitepress/tools.ts     catalog registry: one entry per project (slug, names, taglines, category, maturity)
docs/.vitepress/config.ts    i18n and sidebar (built from tools.ts); base = '/cncf-atlas/'
docs/.vitepress/theme/       custom theme: ToolCatalog.vue and custom.css. The catalog is injected via layout slots, not md tags.
docs/tools/<slug>/           en deep-dive: index, history, architecture, adoption, internals, getting-started
docs/ja/tools/<slug>/        ja mirror, the same six files
templates/tool-doc/{en,ja}/  section skeletons to copy from
research/<tool>/             recon.md, sources.md, status.md; src/ (the clone) is gitignored
data/cncf-projects.json      the full CNCF project backlog (used to seed tracking issues)
scripts/                     check-tools.mjs (CI catalog check), seed-cncf-issues.mjs (issue seeder)
```

The catalog is rendered into the home and catalog pages through theme layout slots (`home-features-after`, `page-bottom`), never as a component tag in markdown. That keeps every `.md` free of inline-HTML lint.

## Categories and maturity

`category` must be one of `CATEGORY_ORDER` in `tools.ts` (add it there first if needed). `maturity` is the CNCF level (`Graduated`, `Incubating`, `Sandbox`, `Archived`) or `Independent` for non-CNCF projects. Verify it against the CNCF landscape or the project; do not guess.

## Verify before "done"

- `npm run docs:build` must be green (it catches broken links and bad config).
- `npm test` must pass (`check-tools.mjs`: every catalog entry has all six pages in both locales).
- markdownlint-cli2 clean on every `.md`. Write clean on the first pass; the maintainer's hook enforces it.
