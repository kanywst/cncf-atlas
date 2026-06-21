# Adoption & Ecosystem

## Who uses it

The repository has no ADOPTERS file, and a reliable primary source naming organisations that run SpiceDB in production was not found. What can be cited is the set of companies whose authorization teams contributed to or designed parts of SpiceDB, which is a weaker signal than production use but is sourced.

| Organisation | Involvement | Source |
| --- | --- | --- |
| GitHub | Authorization team implemented and donated the MySQL datastore | [star-history](https://www.star-history.com/blog/spicedb/) |
| Netflix | Authorization team sponsored and was design partner for Caveats | [star-history](https://www.star-history.com/blog/spicedb/) |
| Adobe, Google, Fastly, Plaid, Red Hat, Reddit | Listed among contributing companies | [star-history](https://www.star-history.com/blog/spicedb/) |

Treat these as contributor affiliations, not confirmed production deployments.

## Adoption signals

Measured from the GitHub REST API on 2026-06-22:

- Stars: 6,791
- Forks: 399
- Watchers (subscribers): 50
- Open issues: 137
- Contributors: approximately 76

Release cadence is steady on `main`; the latest release tag is `v1.54.0`, and the documented commit `4bb1d7b3` sits just ahead of it.

## Ecosystem

- **zed**: the official command-line client for talking to a SpiceDB server.
- **awesome-spicedb**: a curated list (`authzed/awesome-spicedb`) of client libraries and integrations.
- **Observability**: SpiceDB integrates with OpenTelemetry and Prometheus (it consumes CNCF projects; it is not itself one).
- **Managed offering**: AuthZed provides a hosted version of SpiceDB.

## Alternatives

OpenFGA is the most direct alternative: both are Zanzibar-style ReBAC systems under Apache-2.0. SpiceDB is gRPC-first and defaults to token-based strict consistency (ZedToken), while OpenFGA is REST-first and treats higher consistency as an opt-in flag. Pick SpiceDB when you want the full Zanzibar consistency model and multiple storage backends; pick OpenFGA if a REST-first API and CNCF governance matter more to you. For policy-over-attributes decisions with no relationship graph, OPA fits the problem better than either.

| Alternative | Differs by |
| --- | --- |
| OpenFGA | REST-first, CNCF Incubating; higher consistency is opt-in rather than the default. |
| Ory Keto | Go Zanzibar implementation integrated with the Ory stack; coarser consistency controls. |
| OPA / Rego | Policy-code evaluation, not relationship-graph traversal; a different problem class. |
