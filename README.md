<img src="docs/public/favicon.svg" alt="CNCF Atlas" width="72" align="right" />

# CNCF Atlas

A readable map of the cloud native ecosystem. Every CNCF project with its history, architecture, real adoption, and code internals, read from the source.

[![CI](https://github.com/kanywst/cncf-atlas/actions/workflows/ci.yml/badge.svg)](https://github.com/kanywst/cncf-atlas/actions/workflows/ci.yml)
[![Security](https://github.com/kanywst/cncf-atlas/actions/workflows/security.yml/badge.svg)](https://github.com/kanywst/cncf-atlas/actions/workflows/security.yml)
[![Pages](https://github.com/kanywst/cncf-atlas/actions/workflows/deploy.yml/badge.svg)](https://github.com/kanywst/cncf-atlas/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

[日本語の README →](./README.ja.md)

## Why this exists

The CNCF landscape lists hundreds of projects as logos in a grid. It tells you a project exists, but not what it is, how it works, or whether it fits your stack. CNCF Atlas fills that gap. Each project gets a deep-dive written from its actual repository, in the same shape every time, so you can read it top to bottom and come away understanding it.

## What you get

- A docs site you browse by category, with every project tagged by its CNCF maturity.
- Six sections per project, always in the same order, so you know where to look.
- English by default and a full Japanese version, switchable on every page.
- An authoring engine: two Claude Code skills research a project and write its bilingual deep-dive into a consistent structure.

## What a deep-dive covers

| Section | What it answers |
| --- | --- |
| Overview | What it is, when to use it, the key facts. |
| History | Where it came from and how it got here. |
| Architecture | The components and how a request flows through them. |
| Adoption & Ecosystem | Who runs it (with sources), what surrounds it, what the alternatives are. |
| Internals | The code paths that matter, quoted from the source. |
| Getting Started | Install it and get a first setup working. |

## Repository layout

```text
docs/                      VitePress site
  .vitepress/
    config.ts              i18n (English root + Japanese), sidebar built from tools.ts
    tools.ts               the catalog registry, single source of truth
    theme/                 custom theme: catalog cards, brand styling
  index.md                 English home
  tools/<slug>/            English deep-dive (6 pages)
  ja/                      Japanese mirror
templates/tool-doc/        English and Japanese section skeletons the writer copies
research/<tool>/           per-project working area (notes, sources; src/ is gitignored)
scripts/check-tools.mjs    CI check: every catalog entry has all its pages
```

## Run it locally

```bash
npm install
npm run docs:dev      # http://localhost:5173
npm run docs:build    # production build into docs/.vitepress/dist
npm test              # validate the catalog registry against the files on disk
```

## Add a project

Two skills under `.claude/skills/` do the work:

1. `atlas-recon <owner/repo>` clones and pins the upstream, maps its architecture and critical paths, and gathers cited history and adoption material into `research/<tool>/`.
2. `atlas-write <tool>` turns that research into the bilingual six-section deep-dive and registers the project in `docs/.vitepress/tools.ts`.

Adding one entry to `tools.ts` updates the sidebar and the homepage catalog at once.

## License

[MIT](./LICENSE).
