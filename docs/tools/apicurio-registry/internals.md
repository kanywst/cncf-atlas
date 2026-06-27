# Internals

> Read from the source at commit `3443acd9`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `app/src/main/java/io/apicurio/registry/rest/v3/impl/` | REST v3 resource implementations |
| `app/src/main/java/io/apicurio/registry/rules/` | Hierarchical rule engine |
| `app/src/main/java/io/apicurio/registry/storage/` | `RegistryStorage` interface and DTOs |
| `app/src/main/java/io/apicurio/registry/storage/impl/sql/` | SQL backend, content hashing and dedup |
| `schema-util/util-provider/` | `ArtifactTypeUtilProvider` SPI |
| `schema-util/common/` | Shared content interfaces such as `ContentCanonicalizer` |
| `schema-util/avro/` | Avro canonicalizer and validator |

## Core data structures

`RegistryStorage` is the boundary every backend satisfies. Its `createArtifact` method is declared at `app/src/main/java/io/apicurio/registry/storage/RegistryStorage.java:125` and returns a `Pair<ArtifactMetaDataDto, ArtifactVersionMetaDataDto>`: the new artifact's metadata and, optionally, the first version's metadata. The DTOs it traffics in live under `storage/dto/` and must be serializable because the KafkaSQL backend writes them to its journal.

`ArtifactTypeUtilProvider` is the per-type SPI. It is declared at `schema-util/util-provider/src/main/java/io/apicurio/registry/types/provider/ArtifactTypeUtilProvider.java:20`. Its `getArtifactType()` is at line 22, `getContentCanonicalizer()` at line 28, `getContentValidator()` at line 32, and `getCompatibilityChecker()` at line 34. Each schema-type module implements this interface.

`ContentCanonicalizer` converts content to a canonical form so formatting and field-order differences disappear before comparison. The interface is at `schema-util/common/src/main/java/io/apicurio/registry/content/canon/ContentCanonicalizer.java:11`, and its single method `canonicalize(...)` is at line 18:

```java
    public TypedContent canonicalize(TypedContent content, Map<String, TypedContent> resolvedReferences);
```

## A path worth tracing

The interesting path is how the SQL backend stores content and deduplicates it. Each stored content row carries two hashes: a raw hash and a canonical hash. The logic is in `ensureContentAndGetId(...)` at `app/src/main/java/io/apicurio/registry/storage/impl/sql/repositories/SqlContentRepository.java:569`.

For draft content, when draft production mode is off, the code deliberately avoids real hashes so the draft cannot be found by content lookup. At `SqlContentRepository.java:591`:

```java
        if (isDraft && !draftProductionMode) {
            contentHash = "draft:" + UUID.randomUUID().toString();
            canonicalContentHash = "draft:" + UUID.randomUUID().toString();
```

For normal content the two real hashes are computed at `SqlContentRepository.java:603` and `SqlContentRepository.java:604`:

```java
            contentHash = utils.getContentHash(content, finalReferences);
            canonicalContentHash = utils.getCanonicalContentHash(content, artifactType, finalReferences,
                    referenceResolver);
```

Both hash functions live in `app/src/main/java/io/apicurio/registry/storage/impl/sql/RegistryStorageContentUtils.java`. `getCanonicalContentHash(...)` at line 70 runs the content through the type-specific canonicalizer at line 76 (or line 81 when there are no references) and then hashes it with `DigestUtils.sha256Hex(...)` at line 78 (or line 82). `getContentHash(...)` at line 92 skips canonicalization and hashes the bytes directly with `sha256Hex` at line 96 (or line 99).

The canonicalizer call is dispatched through the SPI. At `RegistryStorageContentUtils.java:41`:

```java
            return factory.getArtifactTypeProvider(artifactType).getContentCanonicalizer()
                    .canonicalize(content, resolvedReferences);
```

If canonicalization throws, the method returns the original content on a best-effort basis (`RegistryStorageContentUtils.java:43` through `RegistryStorageContentUtils.java:48`).

Content is stored unique by hash. When two artifact versions carry identical content, the second insert hits a primary-key violation, which is swallowed so the existing content row is reused. At `SqlContentRepository.java:632`:

```java
                if (sqlStatements.isPrimaryKeyViolation(e)) {
                    log.debug("Content with content hash {} already exists: {}", finalContentHash, content);
                    return null;
```

Content that ends up orphaned is cleaned up asynchronously; the comment at `AbstractSqlRegistryStorage.java:510` notes that a dry run or a failed create can leave orphaned content and that an async process deletes it later.

## Things that surprised me

The canonical hash gives semantic deduplication. Two schemas that differ only in formatting or field order produce the same canonical hash, so a lookup with `canonical=true` treats them as the same content even though their raw hashes differ. The work is pushed entirely into the artifact type's SPI, which is why adding a new schema language is contained to one `schema-util/<type>/` module.

The Avro canonicalizer shows the trick concretely. At `schema-util/avro/src/main/java/io/apicurio/registry/avro/content/canon/AvroContentCanonicalizer.java:40` it reads the content as JSON and re-sorts the `fields` property through a `TreeSet` before writing it back (`AvroContentCanonicalizer.java:45` through `AvroContentCanonicalizer.java:56`):

```java
            JsonNode fieldsNode = root.get("fields");
            if (fieldsNode != null) {
                Set<JsonNode> fields = new TreeSet<>(fieldComparator);
                Iterator<JsonNode> elements = fieldsNode.elements();
                while (elements.hasNext()) {
                    fields.add(elements.next());
                }
                ArrayNode array = new ArrayNode(mapper.getNodeFactory());
                fields.forEach(array::add);
                ObjectNode.class.cast(root).replace("fields", array);
            }
```

If that JSON path throws, it falls back to parsing with Avro's `Schema.Parser` and re-serializing through `schema.toString` (`AvroContentCanonicalizer.java:60` through `AvroContentCanonicalizer.java:67`).

The draft-hash escape hatch is the other non-obvious detail. Substituting `"draft:" + UUID` for both hashes (`SqlContentRepository.java:591`) keeps draft content out of the content-by-hash index, so an unfinished draft never collides with or gets deduplicated against production content until it is promoted.
