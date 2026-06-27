# Internals

> Read from the source at commit `af53e98`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/kbs` | Key Broker Service: HTTP front end, RCAR handshake, policy gate, plugins. |
| `src/kbs/src/api_server.rs` | The actix-web server and the single `api` request dispatcher. |
| `src/kbs/src/attestation/backend.rs` | The `Attest` trait, `AttestationService`, and the `__auth` / `__attest` flow. |
| `src/kbs/src/attestation/session.rs` | RCAR session state machine and its key-value persistence. |
| `src/attestation-service` | Attestation Service: evaluates evidence, issues attestation tokens. |
| `src/deps/verifier` | Per-TEE hardware verifiers behind the `Verifier` trait. |
| `src/rvps` | Reference Value Provider Service: stores expected measurements. |
| `src/tools` | `kbs-client` and `trustee-cli` administration and test clients. |

## Core data structures

`ApiServer` (`src/kbs/src/api_server.rs:51`) binds the HTTP layer to each subsystem: `plugin_manager` (`src/kbs/src/api_server.rs:52`), `attestation_service` behind a feature gate (`src/kbs/src/api_server.rs:55`), `policy_engine: PolicyEngine<Regorus>` (`src/kbs/src/api_server.rs:57`), `admin` (`src/kbs/src/api_server.rs:58`), and `token_verifier` (`src/kbs/src/api_server.rs:60`).

`AttestationService` (`src/kbs/src/attestation/backend.rs:128`) holds the RCAR state and the verification delegate: `inner: Arc<dyn Attest>` (`src/kbs/src/attestation/backend.rs:130`), `session_map: SessionMap` (`src/kbs/src/attestation/backend.rs:133`), and `timeout: i64` (`src/kbs/src/attestation/backend.rs:136`).

The multi-TEE support rests on two trait objects. `Attest` (`src/kbs/src/attestation/backend.rs:89`) abstracts the Attestation Service, and `Verifier` (`src/deps/verifier/src/lib.rs:218`) abstracts one TEE type's hardware check, with `evaluate` (`src/deps/verifier/src/lib.rs:248`) doing the work. The `IndependentEvidence` struct (`src/kbs/src/attestation/backend.rs:54`) holds one attester's evidence and lets a single request carry evidence from more than one TEE.

The RCAR handshake is a finite state machine, `SessionStatus` (`src/kbs/src/attestation/session.rs:22`):

```rust
pub(crate) enum SessionStatus {
    Authed {
        request: Request,
        challenge: Challenge,
        id: String,
        #[serde(with = "time::serde::rfc3339")]
        timeout: OffsetDateTime,
    },

    Attested {
        token: String,
        id: String,
        #[serde(with = "time::serde::rfc3339")]
        timeout: OffsetDateTime,
    },
}
```

A session starts as `Authed` (`src/kbs/src/attestation/session.rs:23`) and moves to `Attested` (`src/kbs/src/attestation/session.rs:31`) through `attest()` (`src/kbs/src/attestation/session.rs:94`). The wire types `Request`, `Challenge`, and `Attestation` come from the external `kbs-types` crate.

## A path worth tracing

The whole server is one route. `ApiServer::server` registers a single catch-all resource (`src/kbs/src/api_server.rs:172`):

```rust
                    .service(
                        web::resource([kbs_path!("{path:.*}")])
                            .route(web::get().to(api))
                            .route(web::post().to(api))
                            .route(web::put().to(api))
                            .route(web::delete().to(api)),
                    )
```

Every method lands in `api` (`src/kbs/src/api_server.rs:211`), which takes the first path segment as the plugin name (`let plugin = path_parts[0];`, `src/kbs/src/api_server.rs:230`) and matches on it (`src/kbs/src/api_server.rs:247`). For `auth`, the nonce is created by `make_nonce` (`src/kbs/src/attestation/backend.rs:65`):

```rust
const NONCE_SIZE_BYTES: usize = 32;

/// Create a nonce and return as a base-64 encoded string.
pub async fn make_nonce() -> anyhow::Result<String> {
    let mut nonce: Vec<u8> = vec![0; NONCE_SIZE_BYTES];

    OsRng.fill_bytes(&mut nonce[..]);

    Ok(STANDARD.encode(&nonce))
}
```

For `attest`, the single anti-replay check is one comparison (`src/kbs/src/attestation/backend.rs:344`):

```rust
        if nonce != attestation.runtime_data.nonce {
            bail!("the nonce in the handshake session is different from the client side in KBS protocol's Attestation message");
        }
```

If the nonce returned in the attestation evidence does not match the nonce minted at `auth`, the request is rejected. After `self.inner.verify(evidence_to_verify)` (`src/kbs/src/attestation/backend.rs:404`) succeeds, the session is moved to `Attested` and persisted (`src/kbs/src/attestation/backend.rs:425`).

Sessions persist through a key-value abstraction. `SessionMap::insert` serializes with `serde_json` (`src/kbs/src/attestation/session.rs:120`), `get` reads it back and drops expired entries (`src/kbs/src/attestation/session.rs:134`), and `cleanup_expired` sweeps the store (`src/kbs/src/attestation/session.rs:147`).

## Things that surprised me

The Rego gate fails closed in a deliberate way. After token verification the handler evaluates `data.policy.allow` with `evaluate_rego` (`src/kbs/src/api_server.rs:415`). If the policy does not define the rule, the code logs a warning and defaults to `false` (`src/kbs/src/api_server.rs:428`); if the rule result is not a boolean, it again defaults to `false` (`src/kbs/src/api_server.rs:434`). A missing or malformed policy denies the request rather than allowing it.

The cleanup of expired sessions is not a single fixed-interval loop. The background task spawned in `AttestationService::new` runs `cleanup_expired` every 60 seconds when healthy, but on failure it switches to exponential backoff starting at 5 seconds and capped at 300 seconds (`src/kbs/src/attestation/backend.rs:187`), so an outage in the storage backend does not turn into a noisy retry storm.
