# Internals

> コミット `3443acd9` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `app/src/main/java/io/apicurio/registry/rest/v3/impl/` | REST v3 リソース実装 |
| `app/src/main/java/io/apicurio/registry/rules/` | 階層型ルールエンジン |
| `app/src/main/java/io/apicurio/registry/storage/` | `RegistryStorage` インターフェースと DTO |
| `app/src/main/java/io/apicurio/registry/storage/impl/sql/` | SQL バックエンド、content ハッシュと dedup |
| `schema-util/util-provider/` | `ArtifactTypeUtilProvider` SPI |
| `schema-util/common/` | `ContentCanonicalizer` などの共有 content インターフェース |
| `schema-util/avro/` | Avro の canonicalizer と validator |

## 中核データ構造

`RegistryStorage` は全バックエンドが満たす境界。その `createArtifact` メソッドは `app/src/main/java/io/apicurio/registry/storage/RegistryStorage.java:125` で宣言され、`Pair<ArtifactMetaDataDto, ArtifactVersionMetaDataDto>`（新 artifact のメタデータと、あれば初版のメタデータ）を返す。扱う DTO は `storage/dto/` 配下にあり、KafkaSQL バックエンドが journal に書き込むため serializable でなければならない。

`ArtifactTypeUtilProvider` は type ごとの SPI。`schema-util/util-provider/src/main/java/io/apicurio/registry/types/provider/ArtifactTypeUtilProvider.java:20` で宣言される。`getArtifactType()` は 22 行目、`getContentCanonicalizer()` は 28 行目、`getContentValidator()` は 32 行目、`getCompatibilityChecker()` は 34 行目。各スキーマ型モジュールがこのインターフェースを実装する。

`ContentCanonicalizer` は content を正規形に変換し、書式やフィールド順の差を比較前に消す。インターフェースは `schema-util/common/src/main/java/io/apicurio/registry/content/canon/ContentCanonicalizer.java:11`、唯一のメソッド `canonicalize(...)` は 18 行目:

```java
    public TypedContent canonicalize(TypedContent content, Map<String, TypedContent> resolvedReferences);
```

## 追う価値のあるパス

面白いのは SQL バックエンドが content を保存し dedup する仕組み。保存される各 content 行は 2 つのハッシュ（生ハッシュと正規化ハッシュ）を持つ。ロジックは `app/src/main/java/io/apicurio/registry/storage/impl/sql/repositories/SqlContentRepository.java:569` の `ensureContentAndGetId(...)` にある。

draft content かつ draft production mode 無効のとき、コードは意図的に実ハッシュを避け、content lookup で draft が見つからないようにする。`SqlContentRepository.java:591`:

```java
        if (isDraft && !draftProductionMode) {
            contentHash = "draft:" + UUID.randomUUID().toString();
            canonicalContentHash = "draft:" + UUID.randomUUID().toString();
```

通常 content では 2 つの実ハッシュが `SqlContentRepository.java:603` と `SqlContentRepository.java:604` で計算される:

```java
            contentHash = utils.getContentHash(content, finalReferences);
            canonicalContentHash = utils.getCanonicalContentHash(content, artifactType, finalReferences,
                    referenceResolver);
```

両ハッシュ関数は `app/src/main/java/io/apicurio/registry/storage/impl/sql/RegistryStorageContentUtils.java` にある。`getCanonicalContentHash(...)` は 70 行目で、content を type 固有の canonicalizer に通し（76 行目、参照がなければ 81 行目）、`DigestUtils.sha256Hex(...)` でハッシュ化する（78 行目、参照がなければ 82 行目）。`getContentHash(...)` は 92 行目で、正規化を飛ばしてバイト列を `sha256Hex` で直接ハッシュ化する（96 行目、参照がなければ 99 行目）。

canonicalizer 呼び出しは SPI 経由でディスパッチされる。`RegistryStorageContentUtils.java:41`:

```java
            return factory.getArtifactTypeProvider(artifactType).getContentCanonicalizer()
                    .canonicalize(content, resolvedReferences);
```

canonicalize が例外を投げると、メソッドは best-effort で元 content を返す（`RegistryStorageContentUtils.java:43` から `RegistryStorageContentUtils.java:48`）。

content はハッシュでユニークに保存される。2 つの artifact version が同一 content を持つと、2 回目の insert は PK 違反になり、それを握りつぶして既存 content 行を再利用する。`SqlContentRepository.java:632`:

```java
                if (sqlStatements.isPrimaryKeyViolation(e)) {
                    log.debug("Content with content hash {} already exists: {}", finalContentHash, content);
                    return null;
```

孤立した content は非同期に GC される。`AbstractSqlRegistryStorage.java:510` のコメントは、dry run や create 失敗が孤立 content を残しうること、それを async プロセスが後で削除することを述べている。

## 読んで驚いた点

正規化ハッシュは意味的 dedup を可能にする。書式やフィールド順だけが違う 2 つのスキーマは同じ正規化ハッシュを生むので、`canonical=true` での lookup は生ハッシュが違っても同一 content として扱う。処理は完全に artifact type の SPI に押し込まれており、だから新しいスキーマ言語の追加は 1 つの `schema-util/<type>/` モジュールに収まる。

Avro の canonicalizer がこの仕掛けを具体的に示す。`schema-util/avro/src/main/java/io/apicurio/registry/avro/content/canon/AvroContentCanonicalizer.java:40` で content を JSON として読み、`fields` プロパティを `TreeSet` で並べ直してから書き戻す（`AvroContentCanonicalizer.java:45` から `AvroContentCanonicalizer.java:56`）:

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

その JSON パスが例外を投げると、Avro の `Schema.Parser` で parse し直し `schema.toString` で再シリアライズする fallback に落ちる（`AvroContentCanonicalizer.java:60` から `AvroContentCanonicalizer.java:67`）。

draft ハッシュの逃げ道がもう 1 つの非自明な点。両ハッシュを `"draft:" + UUID` に置き換えること（`SqlContentRepository.java:591`）で draft content を content-by-hash インデックスから外し、未完成の draft が production content と衝突したり dedup されたりすることを昇格まで防ぐ。
