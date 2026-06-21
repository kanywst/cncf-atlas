# Internals

> Read from the source at commit `362e6da`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/` | Five CLI binaries: `guacone` (all-in-one), `guacgql` (GraphQL server), `guacrest` (REST), `guaccollect` (collector daemon), `guaccsub` (collectsub server) |
| `pkg/handler/collector/` | Document collectors (file, gcs, s3, oci, git, github, deps_dev, kubescape, blob) |
| `pkg/handler/processor/` | Type/format detection, validation, and unpacking of raw documents |
| `pkg/ingestor/parser/` | Parses document trees into typed evidence predicates |
| `pkg/ingestor/verifier/` | Signature/identity verification, separate from ingestion |
| `pkg/assembler/` | Predicate types and the GraphQL bulk-load client |
| `pkg/assembler/backends/` | Pluggable graph stores behind one `Backend` interface |

## Core data structures

`processor.Document` (`pkg/handler/processor/processor.go:35`) carries the raw `Blob` bytes plus `Type`, `Format`, `Encoding`, and `SourceInformation`. Nesting (a DSSE envelope wrapping an attestation, a tarball of SBOMs) is represented by `DocumentTree`/`DocumentNode` (`pkg/handler/processor/processor.go:47`, `pkg/handler/processor/processor.go:50`), a recursive tree the processor builds during unpacking.

`assembler.IngestPredicates` (`pkg/assembler/assembler.go:31`) is the evidence bundle the parser produces: fields like `IsDependency`, `CertifyVuln`, and `HasSBOM` (`pkg/assembler/assembler.go:33`, `pkg/assembler/assembler.go:36`, `pkg/assembler/assembler.go:41`). The comment is the key invariant: this struct holds evidence trees only, because ingestion of the software trees (packages, sources, artifacts) is implicit and handled by the client library (`pkg/assembler/assembler.go:28`).

`backends.Backend` (`pkg/assembler/backends/backends.go:27`) is the contract every graph store implements, including topology operations `Neighbors` (`pkg/assembler/backends/backends.go:135`) and `Path` (`pkg/assembler/backends/backends.go:139`) and search `FindSoftware` (`pkg/assembler/backends/backends.go:148`).

`verifier.Identity` (`pkg/ingestor/verifier/verifier.go:50`) holds `Verified` (`pkg/ingestor/verifier/verifier.go:53`); its doc comment is explicit that this should not be read as the identity being trusted (`pkg/ingestor/verifier/verifier.go:46`).

## A path worth tracing

Take one document through `processDocument` (`pkg/handler/processor/process/process.go:197`). The stages run in order:

```text
decodeDocument    -> decompress (bzip2/zstd) the raw blob
preProcessDocument-> guesser.GuessDocument sets Type and Format
validateFormat    -> JSON / JSONLines / XML well-formedness check
validateDocument  -> per-type ValidateSchema
unpackDocument    -> split DSSE/tarball into child documents
```

`preProcessDocument` delegates type detection to the guesser (`pkg/handler/processor/process/process.go:223`); `validateFormat` rejects malformed JSON, JSON Lines, or XML before any schema work (`pkg/handler/processor/process/process.go:235`); `unpackDocument` returns child documents that `processHelper` recurses into (`pkg/handler/processor/process/process.go:269`, `pkg/handler/processor/process/process.go:176`). Which processor handles a given type is decided by a registry populated in `init()` (`pkg/handler/processor/process/process.go:57`).

The parser side guards against the recursion turning into an infinite loop. `ParseDocumentTree` (`pkg/ingestor/parser/parser.go:84`) calls `docTreeBuilder.parse` (`pkg/ingestor/parser/parser.go:210`) with a `map[visitedKey]bool`, where `visitedKey` is a struct of `{Type, Format, SourceInformation}` (`pkg/ingestor/parser/parser.go:203`, `pkg/ingestor/parser/parser.go:216`). A struct key is used precisely because slices cannot be map keys.

## Things that surprised me

The processor acknowledges pub/sub messages only after ingestion succeeds (`pkg/handler/processor/process/process.go:138`), so the system is at-least-once: a document can be reprocessed if a worker dies mid-flight, and ingestion has to tolerate that.

Verification is decoupled from ingestion, and the code is blunt that "verified" is not "trusted" (`pkg/ingestor/verifier/verifier.go:46`). The DSSE processor unpacks signed payloads without checking the signature at all (`pkg/handler/processor/dsse/dsse.go:55`); trust is something the query/policy layer decides, not the ingest path.

In `MergedIngest`, predicates are flushed to the backend in batches: when the running count hits 5000, the assembler is called and the buffer is reset (`pkg/ingestor/ingestor.go:137`). Bulk loading is the default, not an optimization you opt into.
