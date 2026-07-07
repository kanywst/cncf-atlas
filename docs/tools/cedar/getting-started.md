# Getting Started

> Verified against the documented commit `991bacf` (release line `v4.11.2`). Commands assume a Rust toolchain (the workspace sets a minimum supported Rust version of 1.89 in `Cargo.toml:62`).

## Prerequisites

- Rust and Cargo (`rustup` recommended), Rust 1.89 or newer.
- Git, to clone the repository for the CLI walk-through.

## Install

To use Cedar from a Rust application, add the SDK crate (README:37):

```bash
cargo add cedar-policy
```

To get the `cedar` command-line tool, install the CLI crate:

```bash
cargo install cedar-policy-cli
```

This builds the `cedar` binary. The walk-through below instead runs the CLI straight from a clone, which avoids a global install and matches the repository's own quick start.

## A first working setup

This reproduces the README quick start (README:51-128): authorize a request against one policy and a small set of entities.

1. Clone the repository and enter it.

   ```bash
   git clone https://github.com/cedar-policy/cedar.git
   cd cedar
   ```

2. Create `policy.cedar` with a single permit rule.

   ```cedar
   permit (
     principal == User::"alice",
     action == Action::"view",
     resource in Album::"jane_vacation"
   );
   ```

3. Create `entities.json` describing the users and photos.

   ```json
   [
       {
           "uid": { "type": "User", "id": "alice"} ,
           "attrs": {"age": 18},
           "parents": []
       },
       {
           "uid": { "type": "Photo", "id": "VacationPhoto94.jpg"},
           "attrs": {},
           "parents": [{ "type": "Album", "id": "jane_vacation" }]
       },
       {
           "uid": { "type": "Photo", "id": "SecretPhoto94.jpg"},
           "attrs": {},
           "parents": [{ "type": "Album", "id": "jane_secrets" }]
       }
   ]
   ```

4. Run an authorization request that should be allowed.

   ```bash
   cargo run --bin cedar authorize \
       --policies policy.cedar \
       --entities entities.json \
       --principal 'User::"alice"' \
       --action 'Action::"view"' \
       --resource 'Photo::"VacationPhoto94.jpg"'
   ```

   Expected output:

   ```text
   ALLOW
   ```

## Verify it works

Run the same command against a photo in a different album, which should be denied (README:113-128):

```bash
cargo run --bin cedar authorize \
    --policies policy.cedar \
    --entities entities.json \
    --principal 'User::"alice"' \
    --action 'Action::"view"' \
    --resource 'Photo::"SecretPhoto94.jpg"'
```

Expected output:

```text
DENY
```

The first request is allowed because `VacationPhoto94.jpg` is a child of `Album::"jane_vacation"`, which the policy permits. The second is denied because `SecretPhoto94.jpg` belongs to `Album::"jane_secrets"`, which no policy permits, so the default deny applies.

## Where to go next

- The Cedar Policy Language Reference Guide covers the full policy syntax, schemas, and validation: [`docs.cedarpolicy.com`](https://docs.cedarpolicy.com/) (src 7).
- The `cedar-examples` repository, including the TinyTodo app, shows Cedar embedded in a real Rust service (README:132).
- For static analysis of policies, see the symbolic compiler crate `cedar-policy-symcc` covered in [Internals](./internals).
