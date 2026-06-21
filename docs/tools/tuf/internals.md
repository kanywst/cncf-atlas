# Internals

> Read from the source at commit `9a3c304`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `tuf/api/metadata.py` | `Metadata[T]` wrapper around a signed payload ([metadata.py:81](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/metadata.py#L81)) |
| `tuf/api/_payload.py` | Role payload types and the signature-verification primitives (largest file) |
| `tuf/api/serialization/json.py` | The built-in JSON (de)serializer |
| `tuf/api/dsse.py` | DSSE envelope support |
| `tuf/ngclient/updater.py` | `Updater`, the detailed client workflow |
| `tuf/ngclient/_internal/trusted_metadata_set.py` | `TrustedMetadataSet`, the trust-set state machine |
| `tuf/ngclient/urllib3_fetcher.py` | Default HTTP fetcher behind `FetcherInterface` |
| `tuf/repository/_repository.py` | `Repository(ABC)`, base class for repository tooling |

## Core data structures

The role types live in `tuf/api/_payload.py`. `Signed` is the abstract base for all role metadata, holding `version`, `spec_version`, `expires`, and `is_expired()` ([_payload.py:84](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L84), [_payload.py:251](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L251)).

- `Root` ([_payload.py:507](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L507)) and `Targets` ([_payload.py:1686](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1686)) both inherit `_DelegatorMixin` and act as delegators that can verify a delegate. `Root` holds the `keys` and `roles` map of which keyids and threshold each role needs.
- `Timestamp` ([_payload.py:924](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L924)) and `Snapshot` ([_payload.py:992](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L992)) each carry `MetaFile` records about lower metadata ([_payload.py:799](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L799)). Snapshot is the version table for all targets metadata.
- `DelegatedRole` ([_payload.py:1062](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1062)), `SuccinctRoles` ([_payload.py:1236](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1236)), and `Delegations` ([_payload.py:1384](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1384)) form the targets delegation graph; `Delegations.get_roles_for_target()` returns which delegated role to follow for a given path or hash bin ([_payload.py:1512](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1512)).
- `TargetFile` ([_payload.py:1533](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1533)) holds the length and hashes of a distributed file. Both `MetaFile` and `TargetFile` derive from `BaseFile` ([_payload.py:713](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L713)).

## A path worth tracing

Follow the metadata verification path end to end for the timestamp role.

Step 1, the entry point. Fetched bytes reach a role-specific update method; for timestamp it is `TrustedMetadataSet.update_timestamp()` ([trusted_metadata_set.py:204](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L204)). It first checks that the final root is not expired ([trusted_metadata_set.py:230](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L230)).

Step 2, deserialize and verify signatures. The method delegates to `_load_data`, which branches on envelope type: classic metadata goes through `_load_from_metadata()` ([trusted_metadata_set.py:457](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L457)) and DSSE through `_load_from_simple_envelope()` ([trusted_metadata_set.py:484](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L484)). Both call `delegator.verify_delegate(role_name, signed_bytes, signatures)` ([trusted_metadata_set.py:479](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L479)).

Step 3, threshold signature check. The core is `_DelegatorMixin.get_verification_result()` ([_payload.py:429](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L429)):

```python
sig = signatures[keyid]
try:
    key.verify_signature(sig, payload)
    signed[keyid] = key
except sslib_exceptions.UnverifiedSignatureError:
    unsigned[keyid] = key
    logger.info("Key %s failed to verify %s", keyid, delegated_role)

return VerificationResult(role.threshold, signed, unsigned)
```

A result is `verified` when `len(self.signed) >= self.threshold` ([_payload.py:355](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L355)). If the threshold is not met, `verify_delegate()` raises `UnsignedMetadataError` ([_payload.py:500](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L500)).

Step 4, rollback and ordering enforcement. This is where the state machine earns its keep. For timestamp, a new version below the trusted one raises `BadVersionNumberError`, and an equal version raises `EqualVersionNumberError` to keep the old one ([trusted_metadata_set.py:242](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L242)). Snapshot updates are matched against the hash and length recorded in timestamp's `snapshot_meta` and reject any deleted or version-rolled-back targets meta ([trusted_metadata_set.py:341](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L341)). The target file itself is verified after download by `TargetFile.verify_length_and_hashes()` ([_payload.py:1661](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1661)).

## Things that surprised me

The state machine deliberately allows "intermediate" metadata to load even when it is expired or version-mismatched, then raises later. `update_timestamp` loads the new timestamp and only afterward calls `_check_final_timestamp()` to raise on expiry ([trusted_metadata_set.py:259](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L259), [trusted_metadata_set.py:270](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L270)). The inline comment is explicit:

```python
# expiry not checked to allow old timestamp to be used for rollback
# protection of new timestamp: expiry is checked in update_snapshot()
```

A naive implementation that rejected expired metadata immediately would throw away the very baseline it needs to detect a rollback. `update_snapshot` follows the same pattern with `_check_final_snapshot()` ([trusted_metadata_set.py:357](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L357)), and intermediate roots are accepted even when expired, with only the final root's expiry enforced inside `update_timestamp`.
