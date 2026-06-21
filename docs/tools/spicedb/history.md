# History

## Origin

SpiceDB descends directly from Google Zanzibar, the globally distributed authorization system Google published a paper about in summer 2019. AuthZed's founders came from CoreOS, which Red Hat acquired. They left Red Hat in August 2020, and the following month wrote a first complete implementation of the API in Python, codenamed Arrakis. In March 2021 they rewrote it in Go (codename Caladan), and in September 2021 released it as open-source SpiceDB. The GitHub repository was created on 2021-08-16, with the open-source announcement following at the end of September 2021.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Google publishes the Zanzibar paper that SpiceDB implements. |
| 2020 | AuthZed founders leave Red Hat; first API implementation (Python, "Arrakis"). |
| 2021 | Rewrite in Go ("Caladan"); repository created 2021-08-16; open-sourced as SpiceDB in September. |
| 2026 | Active development on `main`; latest release tag `v1.54.0` at the documented commit. |

## How it evolved

SpiceDB kept Zanzibar's core model (relationships, schema-derived permissions, a consistency token) but deviated in ways that fit a self-hostable open-source product. It supports multiple storage backends instead of only Google Spanner, it treats users as ordinary object types rather than a special-cased identity, it uses ZedToken (the equivalent of Zanzibar's Zookie) plus configurable consistency to address the New Enemy problem, and it adds Caveats: CEL-based conditions attached to relationships.

Some of the larger capabilities arrived through contributors. GitHub's authorization team implemented and donated the MySQL datastore. Netflix's authorization team sponsored and acted as a design partner for Caveats.

## Where it stands now

Development is active on the `main` branch; the documented commit `4bb1d7b3` sits just ahead of the `v1.54.0` release tag. The project is Apache-2.0 and is maintained by AuthZed, which also offers a managed version. SpiceDB is not a CNCF project (its closest Zanzibar-style competitor, OpenFGA, is CNCF Incubating).
