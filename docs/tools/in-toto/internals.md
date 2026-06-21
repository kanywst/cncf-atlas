# Internals

> Read from the source at commit `a8ce9ee`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `in_toto/in_toto_verify.py` | CLI for verification; loads layout and keys, calls `verifylib` (in_toto/in_toto_verify.py:222) |
| `in_toto/runlib.py` | Evidence generation: hash artifacts, run commands, build and sign links (in_toto/runlib.py:69) |
| `in_toto/verifylib.py` | Verification engine and all rule checks (in_toto/verifylib.py:1484) |
| `in_toto/rulelib.py` | Parses artifact-rule strings into dicts (in_toto/rulelib.py:43) |
| `in_toto/models/layout.py` | Layout, SupplyChainItem, Step, Inspection (in_toto/models/layout.py:65) |
| `in_toto/models/link.py` | Link metadata type and filename format (in_toto/models/link.py:36) |
| `in_toto/models/metadata.py` | Signed-container abstraction: DSSE Envelope and legacy Metablock (in_toto/models/metadata.py:50) |
| `in_toto/resolver/_resolver.py` | URI-scheme dispatch for hashing artifacts (in_toto/resolver/_resolver.py:21) |

## Core data structures

**Layout** (in_toto/models/layout.py:65) is an `attrs` class with `_type` (always `"layout"`, in_toto/models/layout.py:100), `steps`, `inspect`, `keys` (functionary public keys), and `expires`. If no expiry is given the constructor defaults it to one month out (in_toto/models/layout.py:111-112):

```python
self.expires = kwargs.get("expires")
if not self.expires:
    self.set_relative_expiration(months=1)
```

**Step** (in_toto/models/layout.py:565) and **Inspection** (in_toto/models/layout.py:661) both subclass **SupplyChainItem** (in_toto/models/layout.py:477). A Step is an expected action carried out by a functionary; an Inspection is a check the verifier runs locally. Both hold artifact rules; a Step also carries its authorized `pubkeys`, a `threshold`, and an `expected_command`.

**Link** (in_toto/models/link.py:36) records `materials` and `products` (path to hash dicts), `byproducts` (stdout, stderr, return value), `command`, and `environment` (in_toto/models/link.py:86-90). Its filename format ties a step name to a key id prefix (in_toto/models/link.py:29):

```python
FILENAME_FORMAT = "{step_name}.{keyid:.8}.link"
```

**Metadata** (in_toto/models/metadata.py:50) is the abstraction over signed containers. `from_dict` dispatches on the shape of the data: a `"payload"` key means a DSSE `Envelope`, a `"signed"` key means the legacy `Metablock` (in_toto/models/metadata.py:54-61).

## A path worth tracing

The artifact-rule engine is the heart of verification. `verify_item_rules` (in_toto/verifylib.py:1014) puts all of a step's materials or products into a queue, then applies the rules in order, removing artifacts from the queue as each rule consumes them. Consumption alone is harmless; the docstring frames it as a firewall (in_toto/verifylib.py:1022-1032):

```text
The mode of operation is similar to that of a firewall:
In the beginning all materials or products ... are placed into
an artifact queue. The rules are then applied sequentially,
consuming artifacts in the queue ...
The consumption of artifacts by itself has no effects ...
Only through a subsequent "DISALLOW" rule, that finds
unconsumed artifacts, is an exception raised.
```

So a DISALLOW rule punishes anything left in the queue, and a REQUIRE rule punishes a missing artifact, but a plain MATCH or ALLOW just consumes. A MATCH rule is checked by `verify_match_rule` (in_toto/verifylib.py:645), which only consumes a source artifact when the destination link has an artifact with the same path and identical hash (in_toto/verifylib.py:759):

```python
if source_artifact != dest_artifact:
    # Skip mismatching artifacts
    continue
```

This hash equality is what chains one step's products to the next step's materials.

## Things that surprised me

- **Verification has no clock for keys.** It never consults key creation time, revocation, or usage flags (in_toto/verifylib.py:1513-1521). The entire trust model is "the owner signs the layout"; revocation means re-signing a new layout. This keeps verification offline and deterministic, but it means a leaked functionary key stays valid until the owner ships a new layout.
- **An empty rule set lets everything through.** Because the firewall only fails on DISALLOW or REQUIRE, a step with no rules authorizes any artifacts. The README recommends ending most step definitions with `DISALLOW *` for exactly this reason.
- **Ordering between step rules and inspections is a deliberate trade-off.** Step rules run before inspection commands so inspections never touch compromised files, which also means step MATCH rules cannot reference inspection outputs (in_toto/verifylib.py:1618-1620).
- **A wrong command is only a warning.** Per the specification, a mismatch between the recorded and expected command is logged and verification continues (in_toto/verifylib.py:1504-1507).
