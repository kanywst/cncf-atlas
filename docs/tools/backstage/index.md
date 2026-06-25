# Backstage

> A framework for building developer portals: a software catalog, templates, and docs, assembled into one internal application you own.

- **Category**: Developer Tools
- **CNCF maturity**: Incubating
- **Language**: TypeScript
- **License**: Apache-2.0
- **Repository**: [backstage/backstage](https://github.com/backstage/backstage)
- **Documented at commit**: `bccd96d` (2026-06-24, master, version `1.53.0-next.0`)

## What it is

Backstage is not a portal you deploy and use. It is a framework you use to build your own portal. The repository is a Yarn workspaces monorepo: `packages/*` holds the framework core (the `@backstage/*` packages), and `plugins/*` holds 159 plugin directories (`@backstage/plugin-*`). An adopter wires these together into a single React application plus a Node backend, then runs it as their internal developer portal.

The center of the product is the Software Catalog. It tracks the services, APIs, resources, and the teams that own them, plus the relations between all of them. On top of the catalog sit Software Templates (the Scaffolder), TechDocs (docs-as-code rendered from Markdown that lives next to the code), Search, Permissions, and Auth. Started inside Spotify in 2016 as an internal tool called "System Z", it was open-sourced in 2020 and donated to the CNCF, where it now sits at Incubating maturity.

The catalog does not behave like a CRUD store. It runs an eventually-consistent reconcile loop modeled deliberately on Kubernetes: every record is an Entity with `apiVersion`, `kind`, `metadata`, `spec`, and `relations`, and a processing engine continuously refreshes those entities from their upstream sources.

## When to use it

- You have enough services, teams, and tooling that engineers cannot find what they own or who owns a dependency, and you want one place to answer that.
- You want to own the portal as code: a React app you can extend with your own plugins, rather than a fixed-schema SaaS product.
- You can staff a few engineers to build and operate the portal. Backstage is a framework, so the time-to-value is weeks rather than days.
- It is a weaker fit when you want a turnkey internal developer portal running in a day and are content with a fixed data model. A managed offering or a SaaS IDP fits that better.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how an entity flows through processing.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [backstage/backstage repository](https://github.com/backstage/backstage) (README, ADOPTERS.md, LICENSE, NOTICE, package.json, GitHub API stats), accessed 2026-06-24.
2. [Backstage docs: What is Backstage](https://backstage.io/docs/overview/what-is-backstage/), accessed 2026-06-24.
3. [From Spotify to Open Source: The Backstory of Backstage](https://logz.io/blog/from-spotify-to-open-source/), accessed 2026-06-24.
4. [Backstage has been accepted into the CNCF Sandbox](https://backstage.io/blog/2020/09/23/backstage-cncf-sandbox/), accessed 2026-06-24.
5. [Backstage project joins the CNCF Incubator](https://www.cncf.io/blog/2022/03/15/backstage-project-joins-the-cncf-incubator/), accessed 2026-06-24.
6. [KubeCon EU: Backstage, Crossplane and Others Preparing for CNCF Graduation (InfoQ)](https://www.infoq.com/news/2024/03/kubecon-cncf-incubated-projects/), accessed 2026-06-24.
7. [Celebrating Five Years of Backstage (Spotify Engineering)](https://engineering.atspotify.com/2025/4/celebrating-five-years-of-backstage), accessed 2026-06-24.
8. [CNCF Backstage Documentary Highlights Project Evolution](https://www.cncf.io/announcements/2026/03/25/cncf-backstage-documentary-highlights-project-evolution-from-development-to-global-open-source-standard-for-platform-engineering/), accessed 2026-06-24.
9. [Backstage project page (CNCF)](https://www.cncf.io/projects/backstage/), accessed 2026-06-24.
10. [Top Backstage Alternatives (Port) with Gartner 2025 IDP Market Guide citation](https://www.port.io/blog/top-backstage-alternatives), accessed 2026-06-24.
