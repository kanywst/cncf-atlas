# History

## Origin

Keycloak started in 2014, founded by Bill Burke and Stian Thorgersen. It began as a project in the Red Hat and WildFly community and became the upstream for the Red Hat build of Keycloak. The goal was a single server that handled authentication and SSO for applications through standard protocols, so each app would not reimplement login. See the [CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/) and [Wikipedia](https://en.wikipedia.org/wiki/Keycloak).

## Timeline

| Year | Milestone |
| --- | --- |
| 2014 | Bill Burke and Stian Thorgersen found Keycloak in the Red Hat / WildFly community ([Wikipedia](https://en.wikipedia.org/wiki/Keycloak)) |
| 2022 | Keycloak 17 makes the Quarkus distribution the default, replacing the WildFly app server ([migration doc](https://www.keycloak.org/migration/migrating-to-quarkus)) |
| 2023 | CNCF accepts Keycloak as an Incubating project on 2023-04-10 ([CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/)) |
| 2026 | Release line is `26.x`; latest is `26.6.3`, dated 2026-06-04 ([releases](https://github.com/keycloak/keycloak/releases)) |

## How it evolved

The largest shift was the move off WildFly. Until Keycloak 17 the distribution was a WildFly application server configured with XML and `jboss-cli`. Keycloak 17 (February 2022) made the Quarkus-based distribution the default. Configuration collapsed to a single config file plus CLI arguments and environment variables, and the server adopted a two-phase model: `kc.sh build` fixes build-time options, then `kc.sh start` applies runtime settings such as database, hostname, and TLS ([migration doc](https://www.keycloak.org/migration/migrating-to-quarkus), [n-k.de](https://www.n-k.de/2022/02/keycloak-17-quarkus-distribution-default.html)).

The WildFly distribution was supported through Keycloak 20 and then removed entirely. The new Kubernetes Operator assumes the Quarkus distribution ([migration doc](https://www.keycloak.org/migration/migrating-to-quarkus)).

The other major change was governance. Keycloak joined the CNCF as an Incubating project on 2023-04-10. At acceptance the project reported over 15,000 GitHub stars and the keycloak.org site over 150,000 monthly visits ([CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/)).

## Where it stands now

Keycloak ships frequent minor releases on the `26.x` line, with `26.6.3` released 2026-06-04 ([releases](https://github.com/keycloak/keycloak/releases)). It is a CNCF Incubating project ([CNCF project page](https://www.cncf.io/projects/keycloak/)) and remains the upstream for the Red Hat build of Keycloak.
