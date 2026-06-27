# Internals

> Read from the source at commit `3a7ae05`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `servers/zms/src/main/java/com/yahoo/athenz/zms/ZMSImpl.java` | ZMS REST logic and the central access-check engine. |
| `servers/zms/src/main/java/com/yahoo/athenz/zms/DBService.java` | ZMS persistence over MySQL. |
| `servers/zts/src/main/java/com/yahoo/athenz/zts/ZTSImpl.java` | ZTS REST logic and credential issuance. |
| `servers/zts/src/main/java/com/yahoo/athenz/zts/store/DataStore.java` | Local cache of ZMS data for distributed enforcement. |
| `servers/zts/src/main/java/com/yahoo/athenz/zts/cert/InstanceCertManager.java` | Certificate signing and launch authorization. |
| `libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/` | Principal/Authority abstractions and auth utilities. |
| `core/zms`, `core/zts`, `core/msd` | RDL-generated data models. |
| `libs/go/sia/`, `provider/*/.../cmd/siad/main.go` | Go Service Identity Agent and per-platform providers. |

## Core data structures

Policy evaluation turns on a small set of types, most of them generated from RDL.

- `Assertion` (`core/zms/src/main/java/com/yahoo/athenz/zms/Assertion.java`) is the smallest unit of policy. Its fields include `resource`, `action`, and `effect` (an `AssertionEffect` of ALLOW or DENY), plus `role`, `id`, `caseSensitive`, and `conditions`.
- `Policy` (`core/zms/src/main/java/com/yahoo/athenz/zms/Policy.java`) is a list of assertions with a version and active flag. Multiple versions can exist, but only the active one is evaluated.
- `Role` (`core/zms/src/main/java/com/yahoo/athenz/zms/Role.java`) is a member set, matched against an assertion's `role` field.
- `AthenzDomain` (`libs/java/server_common/src/main/java/com/yahoo/athenz/common/server/store/AthenzDomain.java:24`) is the server-side aggregate that bundles one domain's roles, groups, policies, services, and entities. Evaluation works on this in-memory unit.
- `Principal` (`libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/Principal.java:24`) is the authenticated subject, exposing `getFullName()` (`:88`), `getCredentials()` (`:91`), `getX509Certificate()` (`:95`), `getRoles()` (`:111`), `getAuthority()` (`:114`), and `getMtlsRestricted()` (`:148`).
- `Authority` (`libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/Authority.java:30`) is the pluggable auth SPI, with a `CredSource` enum (`:35`) and `authenticate(...)` overloads for raw credentials (`:141`), X.509 certificates (`:152`), and `HttpServletRequest` (`:162`).

## A path worth tracing

Trace the ZTS service-identity bootstrap, where a workload exchanges platform attestation for an X.509 certificate. The entry point is `ZTSImpl.postInstanceRegisterInformation(ctx, info)` at `servers/zts/src/main/java/com/yahoo/athenz/zts/ZTSImpl.java:4893`.

1. Reject in read-only mode (`:4898`), validate the request against its RDL type (`:4904`), and lowercase the object (`:4910`).
2. Verify the source IP is in the provider's allowed range via `instanceCertManager.verifyInstanceCertIPAddress` (`:4923`).
3. Look up the domain from the local cache with `dataStore.getDomainData` (`:4930`) and confirm the service is registered with `validateInstanceServiceIdentity` (`:4936`).
4. Run the double authorization: the provider must be allowed to launch instances, and the service must delegate launch to that provider, via `instanceCertManager.authorizeLaunch` (`:4945`).
5. With a CSR present, hand off to `postInstanceX509CertificateRegister` (`:4953`/`:4958`); otherwise issue a JWT with `postInstanceJWTRegister` (`:4950`). The X.509 path requires attestation data (`:4965`), which the platform's `InstanceProvider` validates before the CA signs.

```text
postInstanceRegisterInformation        ZTSImpl.java:4893
  verifyInstanceCertIPAddress           :4923
  getDomainData / validateInstanceServiceIdentity  :4930 / :4936
  authorizeLaunch (provider + service delegation)  :4945
  postInstanceX509CertificateRegister   :4958  (attestation required :4965)
```

The central-check counterpart short-circuits differently. In `evaluateAccess` the loop over assertions keeps the deny-last guarantee:

```text
for each active policy:
  for each assertion:
    if already ALLOWED and effect == ALLOW: continue   # ZMSImpl.java:3587
    if not assertionMatch(...): continue
    if effect == DENY: return DENIED                    # ZMSImpl.java:3603
    accessStatus = ALLOWED                              # ZMSImpl.java:3607
```

## Things that surprised me

- Policy evaluation never short-circuits on ALLOW. `evaluateAccess` keeps scanning to guarantee a later DENY wins (`servers/zms/src/main/java/com/yahoo/athenz/zms/ZMSImpl.java:3583`-`3607`), and the in-code comments say so.
- Authorization is fundamentally a linear scan over an in-memory `AthenzDomain`. ZTS lowers distributed-enforcement latency by caching ZMS data wholesale in `DataStore.java` (a pull model), rather than calling ZMS per request.
- ZTS certificate issuance rests on two-stage authorization (provider launch plus service-to-provider delegation) followed by provider-specific attestation validation (`servers/zts/src/main/java/com/yahoo/athenz/zts/ZTSImpl.java:4945`, `:4965`). It is effectively a callback that converts cloud metadata or a Kubernetes service-account token into an Athenz identity certificate.
- Glob matching is the shared primitive across the policy engine: action, resource, and role patterns all flow through `StringUtils.patternFromGlob` (`libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/util/StringUtils.java:47`) and then `String.matches`, so wildcard design and the cost of the per-domain linear scan converge in one place.
