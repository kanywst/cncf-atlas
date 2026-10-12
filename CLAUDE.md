# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The repo, the npm package, and the published site are all **cncf-atlas** (`https://kanywst.github.io/cncf-atlas/`, so VitePress `base` is `/cncf-atlas/`). It is both a published VitePress site and the engine that fills it. Three skills in `.claude/skills/` do the work:

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

CI (`.github/workflows/ci.yml`) runs those three (lint, test, build) on every push and PR, each in its own job off a fresh `npm ci`. `deploy.yml` publishes to GitHub Pages on a push to main.

Two more workflows are easy to forget until they go red:

- `security.yml` runs `npm audit --omit=dev --audit-level=high` and OSV scanner, on push and PR plus weekly. Accepted advisories live in `osv-scanner.toml`, each with a written reason; they are all Vite and esbuild dev-server issues that the static build never ships. Bumping the dev toolchain can mean adding one.
- `claude-review.yml` reviews pull requests and gates nothing. It skips forks and Dependabot (neither can read the secret), and the action refuses to run when the workflow file differs from the copy on main, so a change to that file goes unreviewed until it merges.

A dependency whose peer range the rest of the toolchain cannot satisfy fails `npm ci` and takes every job with it, lint and catalog check included, before any of them touch a file. When all five go red at once, read the install step, not the test output. `mermaid` is pinned to the 11 line for exactly this reason (`vitepress-plugin-mermaid` caps its peer at `10 || 11`), recorded as an `ignore` in `.github/dependabot.yml`.

There is no per-tool test target: `check-tools.mjs` validates the whole catalog at once. It is a big catalog (234 entries at last count, 126 deep-dive and 108 card, which `npm test` prints), so a full build is not quick. To narrow the loop while working on one project:

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
- **English is the source of truth; Japanese is a full translation, not a summary.** Both locales carry the same six sections and the same facts. This governs `docs/` only. The recon dossier under `research/<tool>/` is written in Japanese at the density of notes to self, with a source URL on every claim.
- **Readable top to bottom.** A page should make sense to a reader who has only seen the earlier pages. Introduce a term before leaning on it.

## Writing voice

No marketing tone. No AI tells. In particular: no em dashes (use a period, comma, colon, or parentheses), no "X, not Y" filler, no rule-of-three padding, no throat-clearing. Short, concrete sentences that carry information.

## Layout

```text
docs/.vitepress/tools.ts     catalog registry: one entry per project (slug, names, taglines, category, maturity)
docs/.vitepress/lines.ts     one transit line per category: colour, two-letter code, ja name
docs/.vitepress/sections.ts  the six deep-dive sections, in order, with their en and ja labels
docs/.vitepress/config.ts    i18n, sidebar, and section labels (built from tools.ts); base = '/cncf-atlas/'
docs/.vitepress/theme/       custom theme: Landing.vue, ToolCatalog.vue, RouteStrip.vue, StationMark.vue, MermaidDiagram.vue, custom.css, injected via layout slots
docs/tools/<slug>/           en deep-dive: index, history, architecture, adoption, internals, getting-started
docs/ja/tools/<slug>/        ja mirror, the same six files
templates/tool-doc/{en,ja}/  section skeletons to copy from
research/_TEMPLATE/          scaffold recon copies to research/<tool>/
research/<tool>/             recon.md, sources.md, status.md; src/ (the clone) is gitignored
data/cncf-projects.json      the full CNCF project backlog (used to seed tracking issues)
scripts/                     check-tools.mjs (CI catalog check), seed-cncf-issues.mjs (issue seeder)
osv-scanner.toml             accepted dev-toolchain advisories, one written reason per ignore
README.md, README.ja.md      full mirrors of each other; edit them in pairs
```

## How the pieces wire together

`tools.ts` is the single source of truth. Adding a `ToolEntry` there is what makes a deep-dive reachable: `config.ts` builds both sidebars from it (grouped by line), and `ToolCatalog.vue` and `Landing.vue` render the catalog and the home map from it. `config.ts` filters out tier `card` entries, which have no pages to link to; the catalog and the home map keep them and link them to their upstream repo. Pages on disk with no entry are unreachable (nine of them accumulated once before anyone noticed, which is why `check-tools.mjs` now walks disk to registry as well).

There are two `SECTIONS` arrays, they use different conventions, and nothing keeps them in sync but hand. `docs/.vitepress/sections.ts` is the one the site imports (sidebar, route strip, home page, page titles): its Overview key is `''` (the link is `/tools/<slug>/`) and every entry carries the one English and Japanese label used everywhere. `check-tools.mjs` checks files on disk, so its list is `index`, `history`, `architecture`, `adoption`, `internals`, `getting-started`, matching the filenames exactly. Adding or renaming a section means editing both.

Section pages have bare H1s ("Architecture"), so `config.ts` qualifies them with the project name in two places: `transformPageData` sets the tab title to `<Project>: <Section>`, and the local-search `_render` hook prefixes the indexed H1 the same way. It also relabels the footer link that crosses from one project to the next.

Custom pages render through **layout slots keyed off frontmatter**, never as component tags in markdown, which keeps every `.md` free of inline-HTML lint:

- `home: true` renders `Landing.vue` into the `page-top` slot (`docs/index.md`, `docs/ja/index.md`).
- `catalog: true` renders `ToolCatalog.vue` into the `page-bottom` slot (`docs/tools/index.md`, `docs/ja/tools/index.md`).
- Every page gets `RouteStrip.vue` in the `doc-before` slot. It renders only under `/tools/<slug>/` for a deep-dive slug: the six sections drawn as stops on the project's line, current page marked.

The visual language is a transit map. Each category is a line (`lines.ts`), each project a stop, and the stop marker's shape carries maturity (`StationMark.vue`): Graduated a large ink ring, Incubating a smaller ring in the line colour, Sandbox a plain stop, Independent a square. Colour only ever means "which line"; text stays ink on paper. The home map, the catalog, the sidebar groups, the route strip, and `assets/banner.svg` all draw from the same `lines.ts`.

Mermaid is enabled through `vitepress-plugin-mermaid` (`withMermaid` wraps the config), so ```` ```mermaid ```` fences work in any page. Nearly every `architecture.md` uses one. The plugin's own `<Mermaid>` component is replaced: `theme/MermaidDiagram.vue` registers under the same name in `enhanceApp` and renders through a serial queue (`theme/mermaid-render.ts`) with a fresh id per render. The plugin's version rendered concurrently with ids that repeat across pages, which made valid diagrams fail with "Syntax error in text" now and then. A diagram that really fails to parse shows its source in a `<pre>`. Node ids that are flowchart keywords (`call`, `end`, `style`, `class`, `click`) do fail to parse; rename them.

### check-tools.mjs parses tools.ts with a regex, not an import

It never executes TypeScript. Consequences worth knowing before editing `tools.ts`:

- Lines starting with `//` are stripped first, so a commented-out entry is invisible to the check (and to the site).
- Each entry must be a flat object literal with **no nested braces**, and `slug` must appear before `category`. Both the multi-line style at the top of the file and the one-line style at the bottom parse fine.
- `CATEGORY_ORDER` is read from the array literal, and every entry's `category` must be one of its strings.

The check fails on: a tier `deep` slug missing any of the twelve files (six sections, two locales), an unknown category or tier, a tier `card` entry with no `repo` or with pages on disk, a tier `deep` entry carrying a `repo`, or a `docs/{,ja/}tools/<slug>/` directory with no entry in `tools.ts`.

## Two tiers

`ToolEntry.tier` decides how much of the site a project gets. It defaults to `deep`, so existing entries and anything `atlas-write` produces need no change.

- **`deep`** is the full six-section bilingual deep-dive under `docs/`. It costs a recon pass over the upstream repo, so it is reserved for projects enough people run to justify one. Every CNCF Graduated and Incubating project is `deep`.
- **`card`** is a catalog row and nothing else: name, tagline, category, maturity, and `repo`, which the card links to directly. It carries no pages, no sidebar entry, and no internal link. It exists so the Sandbox long tail is still findable and still says what it is, without a deep-dive behind it. Sandbox projects nobody has written up are `card`.

Card taglines come from the project's own one-liner in [`cncf/landscape`](https://github.com/cncf/landscape) `landscape.yml` or its GitHub repo description, edited into this site's voice. Do not invent them.

To promote a card, run `atlas-recon` then `atlas-write`, then drop the `tier` and `repo` fields from its entry. `check-tools.mjs` catches a half-done promotion in either direction.

## Categories and maturity

`category` must be one of `CATEGORY_ORDER` in `tools.ts` (add it there first if needed). A new category also needs an entry in `LINES` in `lines.ts` (colour, unused two-letter code, Japanese name); without one it still renders, but as a grey line coded `??`. `maturity` is the CNCF level (`Graduated`, `Incubating`, `Sandbox`, `Archived`) or `Independent` for non-CNCF projects. Verify it against the CNCF landscape or the project; do not guess.

## Verify before "done"

- `npm run docs:build` must be green (it catches broken links and bad config).
- `npm test` must pass (`check-tools.mjs`, both directions).
- `npm run lint` clean. `.markdownlint-cli2.jsonc` turns off `MD013`, `MD024`, `MD036`, `MD041`, and `MD060`, and allows `picture`, `source`, and `img` as the only inline HTML. That exception exists for the README banners; pages carry no tags at all. Its ignores (`node_modules`, the VitePress `dist` and `cache`, `research/*/src`) mean everything else, including `research/<tool>/*.md` and both READMEs, is linted. Write clean on the first pass; the maintainer's hook enforces it.
