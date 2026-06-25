# History

## Origin

Backstage began inside Spotify in 2016 as an internal tool called "System Z". The goal was narrow and concrete: give engineers one screen to see who owns which service, document, or API, and how those things depend on each other. As Spotify grew, that ownership and dependency information was scattered, and finding it cost engineering time (S3).

By the time Spotify open-sourced the project on 2020-03-16, the internal version was already managing real scale: 280+ teams using it to track 2,000+ backend services and other software (S3). The public release started as an alpha.

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Started inside Spotify as the internal tool "System Z" (S3) |
| 2020-03-16 | Open-sourced by Spotify as an alpha (S3) |
| 2020-09-08 | Accepted into the CNCF Sandbox (S4, S5) |
| 2022-03-15 | Promoted to CNCF Incubating by TOC vote (S5, S9) |
| 2024 | Re-architecture of the frontend and backend systems underway, with vendor diversification as a stated graduation concern (S6) |
| 2025-04 | Five years public; Spotify ships the commercial "Spotify Portal for Backstage" built on the OSS core (S7) |

## How it evolved

The defining structural shift is the move to new plugin systems. Three generations of packages now coexist in the monorepo, documented in the repository's own `.claude/CLAUDE.md`: the `core-*` packages (for example `@backstage/core-plugin-api`) are the old frontend system; the `frontend-*` packages (for example `@backstage/frontend-plugin-api`) are the new frontend system; and the `backend-*` packages (for example `@backstage/backend-plugin-api`) are the new backend system. This re-architecture is tied to the graduation effort: it gives the project the cleaner extension surface it wants before graduating (S6).

The other shift is governance and contributor base. At KubeCon EU 2024, the main graduation concern raised was that contributions were heavily Spotify-weighted; Red Hat's participation was cited as evidence of broadening vendor diversity (S6). Graduation has not happened yet.

The catalog model is also still growing. Recent kinds added to `packages/catalog-model/src/kinds/` include `AiResourceEntityV1alpha1` and `McpServerApiEntity`, and the backend gained `plugin-mcp-actions-backend` and `catalog-backend-module-ai-model`, which show the project extending toward AI and MCP integration.

## Where it stands now

Backstage releases frequently. At the pinned commit the root `package.json` version is `1.53.0-next.0` (2026-06-23); the most recent stable release was `v1.52.0` (2026-06-16), so minor versions land on a roughly monthly cadence with `-next` pre-releases in between (S1). The project remains CNCF Incubating and is widely treated as the de facto open-source standard for platform engineering and internal developer portals; in CNCF velocity rankings it moved from 8th among 100+ projects in its 2020 donation year to 6th among 230+ by 2025 (S8).
