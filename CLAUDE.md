# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The working directory is `oss-tech-deepdive`; the project, the npm package, and the published site are all **cncf-atlas** (`https://kanywst.github.io/cncf-atlas/`, so VitePress `base` is `/cncf-atlas/`). It is both a published VitePress site and the engine that fills it. Three skills in `.claude/skills/` do the work:

1. **`atlas-recon <owner/repo>`** clones and pins upstream, maps architecture and critical paths, and gathers cited material into `research/<tool>/`. It never writes site pages.
2. **`atlas-write <tool>`** turns the recon dossier into the bilingual six-section deep-dive under `docs/`, registers the project in `tools.ts`, and builds green. It never researches from scratch.
3. **`atlas-review <tool>`** reads the result the way a newcomer would and flags AI tells, broken readability, missing prerequisites, and uncited claims before it ships.

Keep the stages separate so a human can review the dossier before pages get written, and review the pages before they ship.

## Commands

Node 24 (`.nvmrc`, and what CI uses).

```bash
npm run docs:dev      # local VitePress server with hot reload while writing
npm run docs:build    # production build; fails on broken links and bad config
npm run docs:preview  # serve the built site
npm test              # scripts/check-tools.mjs: catalog and pages agree, both directions
npm run lint          # markdownlint-cli2 over every .md, research dossiers included
```

CI (`.github/workflows/ci.yml`) runs those three (lint, test, build) on every push and PR. `deploy.yml` publishes to GitHub Pages.

There is no per-tool test target: `check-tools.mjs` validates the whole catalog at once. To narrow the loop while working on one project:

```bash
npx markdownlint-cli2 "docs/tools/<slug>/*.md" "docs/ja/tools/<slug>/*.md"
rg -n "—" docs/tools/<slug> docs/ja/tools/<slug>   # em dashes, the loudest AI tell
```

Then build and eyeball the pages, or read `research/<tool>/status.md` for dossier state.

Seeding backlog issues from the CNCF project list is a separate one-off script:

```bash
node scripts/seed-cncf-issues.mjs --dry-run          # preview
node scripts/seed-cncf-issues.mjs --limit 20         # create, idempotent by issue title
```

It shells out to `gh`, which uses its own token and never touches git commit identity.

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
docs/.vitepress/config.ts    i18n, sidebar, and section labels (built from tools.ts); base = '/cncf-atlas/'
docs/.vitepress/theme/       custom theme: Landing.vue, ToolCatalog.vue, custom.css, injected via layout slots
docs/tools/<slug>/           en deep-dive: index, history, architecture, adoption, internals, getting-started
docs/ja/tools/<slug>/        ja mirror, the same six files
templates/tool-doc/{en,ja}/  section skeletons to copy from
research/_TEMPLATE/          scaffold recon copies to research/<tool>/
research/<tool>/             recon.md, sources.md, status.md; src/ (the clone) is gitignored
data/cncf-projects.json      the full CNCF project backlog (used to seed tracking issues)
scripts/                     check-tools.mjs (CI catalog check), seed-cncf-issues.mjs (issue seeder)
```

## How the pieces wire together

`tools.ts` is the single source of truth. Adding a `ToolEntry` there is what makes a deep-dive reachable: `config.ts` builds both sidebars from it, and `ToolCatalog.vue` renders the cards from it. Pages on disk with no entry are unreachable (nine of them accumulated once before anyone noticed, which is why `check-tools.mjs` now walks disk to registry as well).

The six section keys live in `SECTIONS` in `config.ts` and must match the filenames exactly: `index`, `history`, `architecture`, `adoption`, `internals`, `getting-started`. That array also carries the English and Japanese sidebar labels.

Custom pages render through **layout slots keyed off frontmatter**, never as component tags in markdown, which keeps every `.md` free of inline-HTML lint:

- `home: true` renders `Landing.vue` into the `page-top` slot (`docs/index.md`, `docs/ja/index.md`).
- `catalog: true` renders `ToolCatalog.vue` into the `page-bottom` slot (`docs/tools/index.md`, `docs/ja/tools/index.md`).

Mermaid is enabled through `vitepress-plugin-mermaid` (`withMermaid` wraps the config), so ```` ```mermaid ```` fences work in any page. Nearly every `architecture.md` uses one.

### check-tools.mjs parses tools.ts with a regex, not an import

It never executes TypeScript. Consequences worth knowing before editing `tools.ts`:

- Lines starting with `//` are stripped first, so a commented-out entry is invisible to the check (and to the site).
- Each entry must be a flat object literal with **no nested braces**, and `slug` must appear before `category`. Both the multi-line style at the top of the file and the one-line style at the bottom parse fine.
- `CATEGORY_ORDER` is read from the array literal, and every entry's `category` must be one of its strings.

The check fails on: a registered slug missing any of the twelve files (six sections, two locales), an unknown category, or a `docs/{,ja/}tools/<slug>/` directory with no entry in `tools.ts`.

## Categories and maturity

`category` must be one of `CATEGORY_ORDER` in `tools.ts` (add it there first if needed). `maturity` is the CNCF level (`Graduated`, `Incubating`, `Sandbox`, `Archived`) or `Independent` for non-CNCF projects. Verify it against the CNCF landscape or the project; do not guess.

## Verify before "done"

- `npm run docs:build` must be green (it catches broken links and bad config).
- `npm test` must pass (`check-tools.mjs`, both directions).
- `npm run lint` clean. Its ignores (`node_modules`, the VitePress `dist` and `cache`, `research/*/src`) live in `.markdownlint-cli2.jsonc`, so everything else, including `research/<tool>/*.md` and the READMEs, is linted. Write clean on the first pass; the maintainer's hook enforces it.
