# recon: Apicurio Registry

調査メモ。自分用の密度。出典は `sources.md` の番号で参照。コードは pin した commit で確認済み。

## 基本情報

- repo: `Apicurio/apicurio-registry`
- pinned commit: `3443acd986a231b5032b0e487b7b5a5ce330fa8d`（main, 2026-06-25）/ 近いタグ: `v3.3.0`（2026-06-08 リリース、pin はその後の main）
- 言語 / ビルド: Java（source 17 / runtime 21）, Quarkus 3.27.x / Maven。`./mvnw clean install`
- ライセンス: Apache License 2.0（リポジトリ `LICENSE` 冒頭で確認、`gh` の SPDX も `Apache-2.0`）[S3]
- CNCF 成熟度: Sandbox（2024 受理、`GOVERNANCE.md` 冒頭にも明記）[S4] [S5]
- カテゴリ（tools.ts の CATEGORY_ORDER から）: Messaging & Streaming
- main entrypoint: `app/src/main/java/io/apicurio/registry/RegistryQuarkusMain.java`（`@QuarkusMain`、`main` が `Quarkus.run(args)` を呼ぶだけ）

ARG（Apicurio Registry）は API（Application Programming Interface）定義とスキーマを保存・バージョン管理する runtime サーバ。REST で artifact を出し入れし、Kafka などのイベントストリーミングで producer/consumer 間のスキーマ契約を一元管理する用途が中心。OpenAPI / AsyncAPI / Avro / Protobuf / JSON Schema / GraphQL / WSDL / XSD などを artifact type として扱う。

## 歴史の素材

- Apicurio コミュニティは 2016 年の **Apicurio Studio**（API デザインツール）から始まり、Red Hat がスポンサー。Registry は 2019 年に別プロジェクトとして開始。[S6]
- GitHub repo 作成は 2019-07-16（`gh api repos/...` の `created_at`）[S3]。最古の公開リリースは `1.0.4.Final` / `1.1.0.Final`（ともに 2020-02-03）[S7]。
- `2.0.0.Final` は 2021-04-16。[S7]
- `3.0` 系は 2024 年（最古の 3.0.0 マイルストーン `3.0.0.M3` が 2024-06-17）[S7]。3.0 はストレージ別だった複数コンテナイメージを単一 artifact に統合し、REST API を再設計、階層型ルールエンジンを導入。[S1]
- `3.1.0`（2025-10-07）で旧 Apicurio Studio 機能（API デザイン編集）を opt-in で吸収、Studio は deprecated に。AI agent artifact 対応も追加。[S1] [S6] [S7]
- `3.3.0`（2026-06-08）で実験的な **GitOps ストレージ**（Git を source of truth にして registry を read-only にする）を導入。[S6] [S7]
- 商用ダウンストリーム: Red Hat build of Apicurio Registry、IBM Event Streams 同梱。[S8]（ADOPTERS）

CNCF 関連:

- Sandbox 申請は `cncf/sandbox` issue #72（2023-11）。Red Hat 製品があるが upstream は独立・vendor-neutral を強調。[S4]
- 後続の issue #461（2026-02）で CNCF エコシステム統合（Strimzi, CloudEvents, xRegistry）を整理。[S5]

## アーキテクチャの素材

マルチモジュール Maven（約 30 モジュール）。主要モジュール:

- `app/` — Quarkus 本体（REST API v2/v3、認証、ストレージのオーケストレーション、ルールエンジン）。Java ファイル約 967。
- `schema-util/` — artifact type ごとのユーティリティ（avro, protobuf, json, openapi, asyncapi, graphql, xsd, wsdl, kconnect, openrpc, iceberg, xml）。SPI 提供。
- `serdes/` — Kafka/NATS/Pulsar 向け serializer/deserializer。
- `operator/` — Kubernetes operator（Java 約 156 ファイル）。
- `ui/` — React + TypeScript（独立した npm/Vite ビルド）。
- `java-sdk` / `go-sdk` / `python-sdk` / `typescript-sdk` — クライアント SDK。
- `mcp/` — MCP（Model Context Protocol）サーバ。

REST API は `/apis/registry/v3/`（v2 も後方互換で残る）。加えて **Confluent Schema Registry 互換 API**（`app/src/main/java/io/apicurio/registry/ccompat/rest/` の `v7` / `v8`）と CNCF（Cloud Native Computing Foundation）xRegistry / Iceberg REST も持つ。

### ストレージ

`RegistryStorage` インターフェース（`app/src/main/java/io/apicurio/registry/storage/RegistryStorage.java`、約 1314 行）の実装を `APICURIO_STORAGE_KIND` で切替（`app/src/main/java/io/apicurio/registry/storage/impl/` 配下）:

- `sql/` — PostgreSQL（JDBC）が正典実装。SQL Server / MySQL も方言で対応。
- `kafkasql/` — Kafka を journal、SQL を snapshot にする。状態変更を Kafka topic で replay。
- `gitops/` — Git リポジトリを backing store にする read-only モード（3.3.0 で実験導入）。
- `kubernetesops/` — Kubernetes ConfigMap を backing store にする。

### 代表操作の end-to-end トレース（artifact 作成 = `POST /apis/registry/v3/groups/{groupId}/artifacts`）

1. `app/src/main/java/io/apicurio/registry/rest/v3/impl/GroupsResourceImpl.java:1281` — `@Authorized(style = AuthorizedStyle.GroupOnly, level = AuthorizedLevel.Write, dryRunParam = 3)`。AOP で認可を強制。
2. `GroupsResourceImpl.java:1282` — `createArtifact(...)` 本体。パラメータ検証、`artifactId` 未指定なら `idGenerator.generate()`（:1363）。
3. `GroupsResourceImpl.java:1369` — `ArtifactTypeUtil.determineArtifactType(...)` で content から artifact type を推定。
4. `GroupsResourceImpl.java:1422` — `RegistryContentUtils.recursivelyResolveReferences(...)` で参照スキーマを解決。
5. `GroupsResourceImpl.java:1428` — draft でなければ `rulesService.applyRules(..., RuleApplicationType.CREATE, ...)`。
6. `GroupsResourceImpl.java:1434` — `storage.createArtifact(...)` を呼ぶ。
7. `GroupsResourceImpl.java:1448` — `CreateArtifactResponse` を組んで返す。

ルール適用（`app/src/main/java/io/apicurio/registry/rules/RulesServiceImpl.java`）:

- `:106`-`:116` — **階層型ルール解決**。`RuleType.values()` を回し、各ルール種別を artifact → group → global → default-global の最も具体的な階層 1 つだけで解決。
- `:146` — `factory.createExecutor(ruleType)`、`:152` — `executor.execute(context)`。違反は `RuleViolationException`。種別は `VALIDITY` / `COMPATIBILITY` / `INTEGRITY`。

ストレージ書き込み（`app/src/main/java/io/apicurio/registry/storage/impl/sql/AbstractSqlRegistryStorage.java`）:

- `:486` — `createArtifact(...)` 実装。`:501` group 自動作成（`enableAutomaticGroupCreation` ガード、`:503` で `ensureGroup`）。
- `:516` — `ensureContentAndGetId(...)` で content を先に DB へ（content ID 取得）。
- `:521` — `handles.withHandle`（JDBI トランザクション）。`:523` dryRun ならロールバック指定。
- `:531` — `insertArtifact` 実行。`:557` — `createArtifactVersionRaw(...)` で初版を作成。
- `:566` — `outboxEvent.fire(SqlOutboxEvent.of(ArtifactCreated.of(amdDto)))`（outbox パターンでイベント発火）。
- `:571` — PK 違反を `ArtifactAlreadyExistsException` に変換。

## 内部実装の素材

### 中核データ構造・SPI

- `RegistryStorage`（`app/.../storage/RegistryStorage.java:125` の `createArtifact`）— 全ストレージ実装が満たす境界インターフェース。DTO は `storage/dto/` にあり KafkaSQL journal で serialize されるため serializable 必須。
- `ArtifactTypeUtilProvider`（`schema-util/util-provider/src/main/java/io/apicurio/registry/types/provider/ArtifactTypeUtilProvider.java:20`）— artifact type ごとの振る舞いを束ねる **SPI（Service Provider Interface）**。`getArtifactType()`（:22）、`getContentCanonicalizer()`（:28）、`getContentValidator()`（:32）、`getCompatibilityChecker()`（:34）など。avro / protobuf / json などのモジュールが実装。
- `ContentCanonicalizer`（`schema-util/common/src/main/java/io/apicurio/registry/content/canon/ContentCanonicalizer.java:11`、`canonicalize(...)` は :18）— content を比較用の正規形に変換。書式やフィールド順の差を消す。
- DTO 群: `ArtifactMetaDataDto` / `ArtifactVersionMetaDataDto`（`createArtifact` の戻り `Pair`）、`ContentWrapperDto`（content + contentType + references）、`EditableArtifactMetaDataDto`。
- `RuleType`（generated, SDK 由来）— `VALIDITY` / `COMPATIBILITY` / `INTEGRITY`。

### 追う価値のあるパス: content の二重ハッシュと dedup

`app/src/main/java/io/apicurio/registry/storage/impl/sql/repositories/SqlContentRepository.java:569` の `ensureContentAndGetId(...)`:

- 各 content に対し **生ハッシュ `contentHash` と正規化ハッシュ `canonicalContentHash` の 2 つ**を計算（:603-:604）。`utils.getContentHash` と `utils.getCanonicalContentHash`。
- draft かつ draft-production-mode 無効なら、ハッシュを `"draft:" + UUID` にして lookup されないようにする（:591-:593）。これは非自明。
- content 行は content table に hash でユニーク格納。同一 content は dedup され、複数 artifact version が content ID で共有。PK 違反は既存 content として握りつぶす（:632-:634）。孤立 content は非同期に GC（`AbstractSqlRegistryStorage.java:511` コメント）。

`app/src/main/java/io/apicurio/registry/storage/impl/sql/RegistryStorageContentUtils.java`:

- `:70` `getCanonicalContentHash(...)` — `:76`/`:81` で type 別 canonicalizer を通してから `:78`/`:82` `DigestUtils.sha256Hex(...)`。
- `:92` `getContentHash(...)` — 正規化なしで `:96`/`:99` `sha256Hex`。
- `:41` — `factory.getArtifactTypeProvider(artifactType).getContentCanonicalizer().canonicalize(...)`。canonicalize 失敗時は best-effort で元 content を返す（:43-:48）。

Avro の正規化例（`schema-util/avro/src/main/java/io/apicurio/registry/avro/content/canon/AvroContentCanonicalizer.java:40`）: JSON として読み `fields` を `TreeSet` でソートし直して書き戻す（:45-:56）。失敗時は Avro `Schema.Parser` で parse して `schema.toString` する fallback（:60-:67）。

### 非自明な設計判断

- **正規化ハッシュによる意味的 dedup**: 生ハッシュとは別に type 固有の canonicalizer を通した SHA-256 を持つことで、整形違い等で意味が同じスキーマを `canonical=true` 指定時に同一とみなせる。canonicalizer を artifact type の SPI に押し込んでいるので、新しいスキーマ言語の追加が `schema-util/<type>/` モジュールの実装だけで完結する。
- **階層型ルール**: ルールは artifact / group / global / default-global の 4 階層で、各種別は最も具体的な 1 階層のみ適用される（上位は無視、マージしない）。
- **outbox + storage event**: 状態変更は `outboxEvent.fire(...)` で発火し、KafkaSQL では journal を replay して SQL snapshot を再構築する設計。

## 採用事例の素材

リポジトリ `ADOPTERS.md` に記載（出典 S8）:

- IBM（Vendor, 2020）— IBM Event Streams にスキーマレジストリ component として同梱。
- Red Hat（Vendor, 2020）— Red Hat build of Apicurio Registry。
- Axual（Vendor, 2021）— Kafka ベースのストリーミングプラットフォームに OSS Apicurio を採用。
- Castor（End-user, 2024）— イベントストリーミングと service 間通信の中央スキーマレジストリ。
- Libon（End-user, 2025）— Kafka の Avro スキーマの source of truth。
- ZenWave 360（End-user）— AsyncAPI + Avro の canonical reference 保存・バージョニング。

GitHub シグナル（`gh api`, 2026-06-26 取得）[S3]: stars 818、forks 322、contributors 123、open issues 338、created 2019-07-16。

## 代替・エコシステム

- **Confluent Schema Registry** — Kafka 世界のデファクト。Apicurio は ccompat API（v7/v8）でクライアント互換を提供しつつ、Apache 2.0（Confluent は Community License）と複数ストレージ・複数 artifact type で差別化。
- **AWS Glue Schema Registry** / **Azure Schema Registry** — マネージド・クラウド固定。Apicurio はセルフホスト/可搬。
- **Buf Schema Registry (BSR)** — Protobuf 特化。Apicurio は多言語スキーマ + API 定義（OpenAPI/AsyncAPI）も扱う汎用性。
- CNCF エコシステム統合: **Strimzi**（Kafka, KafkaSQL ストレージ兼スキーマレジストリとして）、**CloudEvents**（artifact type 拡張）、**xRegistry**（準拠を目標）。[S5]
- 周辺: `serdes`（Kafka/NATS/Pulsar serde）、Kubernetes operator（OLM channel 提供）、MCP サーバ、CLI、4 言語 SDK。

## getting-started（最小動作）

Docker で本体 + UI を起動（README より）[S2]:

```bash
docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot
docker run -it -p 8888:8080 apicurio/apicurio-registry-ui:latest-snapshot
```

API ドキュメントは `http://localhost:8080/apis`、UI は `http://localhost:8888`。デフォルトは in-memory 永続化。ソースからは `./mvnw clean install -Dfast -DskipTests` 後に `app/` で `../mvnw quarkus:dev`。[S2]
