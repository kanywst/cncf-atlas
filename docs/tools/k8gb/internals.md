# Internals

> Read from the source at commit `34b4535c`. Every claim here points at a file and line.

## Code map

About 17,000 lines of non-test Go across 117 files. Small enough to read end to end in an afternoon, which is unusual for a CNCF incubating project.

| Path | Responsibility |
| --- | --- |
| `main.go` | Operator entry point and manager setup |
| `api/v1beta1/` | The legacy API group `k8gb.absa.oss` (`groupversion_info.go:31`) |
| `api/v1beta1io/` | The canonical API group `k8gb.io` (`groupversion_info.go:32`) |
| `controllers/gslb_controller_reconciliation.go` | The main reconcile loop |
| `controllers/gslb_migration_controller.go`, `conversion_k8gbio.go` | The one-way bridge from the legacy group to the canonical one |
| `controllers/providers/k8gbendpoint/` | Building the `DNSEndpoint` records, including the cross-cluster lookup |
| `controllers/providers/dns/` | DNS backends: external-dns and Infoblox |
| `controllers/refresolver/` | Resolving the Ingress or Service a `Gslb` points at, and this cluster's exposed IPs |
| `controllers/resolver/` | Configuration and strategy constants |
| `controllers/zones/`, `zone_delegation_reconciliation.go` | Delegated zones |
| `adr/` | Architecture decision records |

## Core data structures

`Strategy` (`api/v1beta1/gslb_types.go:31-42`) is the whole user-facing policy surface: `Type`, `Weight` as a map of region to weight, `PrimaryGeoTag`, `DNSTtlSeconds`, and `SplitBrainThresholdSeconds`. Five fields, and the behaviour of the entire system follows from them.

The strategy names are constants in `controllers/resolver/`, with `GeoStrategy = "geoip"` at `resolver_spec.go:33` alongside `RoundRobinStrategy` and `FailoverStrategy`. They are dispatched in exactly two places: `controllers/runtime_shared.go:41-45` and `controllers/providers/k8gbendpoint/applicationDNSEndpoint.go:122-156`.

`Targets` (`controllers/providers/k8gbendpoint/target.go`) is a map from geo tag to a set of IPs, with `Append` (`:42`), `AppendTargets` (`:50`), `GetIPs` (`:33`), and `Sort` (`:56`). Keying by geo tag rather than flattening to a list is what lets the failover logic ask "is the primary cluster in here?" without a separate lookup.

The output type is not k8gb's own. `DNSEndpoint` comes from external-dns, and the operator's entire job ends with writing one.

## A path worth tracing

The question worth answering is: how does a cluster in Frankfurt find out which endpoints are healthy in Virginia, given that it has no connection to Virginia's Kubernetes API?

It asks Virginia's DNS server.

`GetDNSEndpoint` (`controllers/providers/k8gbendpoint/applicationDNSEndpoint.go:82`) builds the records for one `Gslb`. For each hostname it does two things.

First, it publishes what this cluster can offer, under a prefixed name:

```text
applicationDNSEndpoint.go:98   getLocalTargetsHost(host)   -> "localtargets-<host>"
                               (prefix at dns_validation.go:27)
applicationDNSEndpoint.go:106  if this cluster's app is healthy:
                    :107         add own IPs to finalTargets under our geo tag
                    :108-114      emit an A record for localtargets-<host>
```

That `localtargets-` record is the cluster's public statement of its own healthy endpoints, served by its own CoreDNS, reachable by anyone who can resolve the delegated zone.

Second, it reads everyone else's statement, at `GetExternalTargets` (`:202`):

```text
:204  ResolveAuthoritativeServersFromZoneDelegations(host)
        -> the NS records for this host's zone, one per k8gb cluster
:211  GetExternalAuthoritativeServers()  -> drop ourselves, keep the peers
for each peer:
  :217  nameServersToUse = peer's IP, with parent zone servers as fallback
  :226  queryService.Query("localtargets-<host>", nameServersToUse)
  :236  ExtractARecords(response)
  :238  targets[peer.GeoTag] = those IPs
```

Line 226 is the entire cross-cluster mechanism. It is a DNS query, sent directly to the peer cluster's CoreDNS, for the peer's `localtargets-` name. Because the zone is delegated to every k8gb cluster, that query needs no special network path, no credentials, and no agreement beyond the delegation itself. DNS is the state channel.

Then the strategy decides what the public record actually says (`:122-156`):

```text
switch strategy.Type:
  roundRobin, geoip  (:123-124)
      finalTargets = own targets + all external targets
  failover           (:125-155)
      isPrimary = strategy.PrimaryGeoTag == this cluster's geo tag   (:103)
      if isPrimary:
          healthy   -> keep own targets only (nothing appended)
          unhealthy -> replace entirely with external targets        (:130-131)
      else:
          primary present in externalTargets -> return only those    (:143-145)
          primary absent                     -> return everything    (:147)
```

Read top to bottom, this is the failover semantics in full. A healthy primary advertises only itself, so traffic concentrates there. Secondaries also advertise only the primary while they can see it, which is what makes the concentration hold no matter which cluster's DNS server a resolver happens to reach. When the primary stops publishing its `localtargets-` record, every secondary independently notices its absence and starts advertising the remaining clusters.

For `roundRobin` and `geoip` the record simply carries every healthy endpoint, and the distribution is left to the resolver: round robin to the ordering of the answer, geoip to a geo-aware DNS server in front.

Finally the record is written (`:169-183`) with the strategy recorded as a label, and the reconciler saves the `DNSEndpoint` (`controllers/gslb_controller_reconciliation.go:212`) for the `k8s_crd` CoreDNS plugin to serve.

## Things that surprised me

**There is no consensus mechanism and none is attempted.** Each cluster runs the code above on its own timer against its own view. Two clusters can hold different opinions about who is healthy, and during a network partition they will. `SplitBrainThresholdSeconds` (`api/v1beta1/gslb_types.go:41`) bounds how long a stale view is trusted. For a system whose failure mode is "traffic goes to a slightly wrong place for a few TTLs", this is a reasonable trade, but it is a deliberate choice to not build the hard part.

**A failure to reach a peer is a warning, not an error.** If the DNS query to a peer fails, the code logs a warning and continues to the next peer (`applicationDNSEndpoint.go:227-235`). A peer that cannot be reached is treated exactly like a peer with no healthy endpoints, which is usually the right answer and occasionally is not.

**CoreDNS is forked, in effect.** k8gb does not configure the cluster's existing CoreDNS. It ships its own image, `registry.k8gb.io/k8gb-io/k8s_crd` (`chart/k8gb/values.yaml:119`), with a plugin that reads `DNSEndpoint` custom resources as zone data. This is what removes the reload step between "operator writes an object" and "DNS answers differently".

**IPv6 is turned away at the door, and the code explains why.** The help text for `CLUSTER_EXPOSED_IPS` (`controllers/resolver/config.go:59`) states that IPv6 is rejected because both the `localtargets-*` records and the final records publish A records only. The reconciler enforces it by splitting addresses and keeping only IPv4 (`gslb_controller_reconciliation.go:173`, helper at `:235`).

**Two API groups are compiled into one binary.** `api/v1beta1` (`k8gb.absa.oss`) and `api/v1beta1io` (`k8gb.io`) both exist, with a migration controller between them, because of the decision recorded in ADR-0002 and described in [History](./history). Reading the tree without that context makes the duplication look like an accident.
