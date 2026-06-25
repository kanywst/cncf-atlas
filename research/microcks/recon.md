# recon: Microcks

調査メモ。自分用の密度。出典は `sources.md` に番号で対応。`file:line` は pin した commit で確認済み。

## 基本情報

- repo: [microcks/microcks](https://github.com/microcks/microcks)
- pinned commit: `24db0541f684f55def3eb1aa3277cf5b78526855` (2026-06-22 commit)
- 近いタグ: HEAD はタグ `1.15.0-rc1` (2026-06-22 付与) の直前。最新の安定リリースは `1.14.0`。`pom.xml` の version は `1.15.0-SNAPSHOT`
- 言語 / ビルド: Java が主。webapp は Spring Boot 4.0.7 / Java 25 (`webapp/pom.xml:18`)、async minion は Quarkus 3.31.4 (`minions/async/pom.xml`)、フロントは Angular + TypeScript (`webapp/src/main/webapp`)。ビルドは Maven マルチモジュール (`pom.xml` の `<modules>`: `commons/util`, `commons/model`, `commons/util-el`, `webapp`, `minions/async`, `distro`)
- 永続化 / 認証: MongoDB (Spring Data Mongo Repository)、認証は Keycloak (OIDC)
- ライセンス: Apache-2.0。`LICENSE` 本文 + `pom.xml` の `<licenses>` + GitHub API `license.spdx_id=Apache-2.0` で三点確認
- CNCF 成熟度: Incubating (Sandbox 2023-06-22 から Incubating 2026-05 へ昇格)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Developer Tools
- エントリポイント: `webapp/src/main/java/io/github/microcks/MicrocksApplication.java:37` の `SpringApplication.run(...)`。`@SpringBootApplication @EnableAsync @EnableScheduling`

## 歴史の素材

- Laurent Broudoux が 2015 年 2 月に個人のサイドプロジェクトとして開始。GitHub repo の `created_at` は `2015-02-23T15:46:09Z` (GitHub API) で起源の主張と一致 (出典 1)(出典 6)。
- 当初のビジョンは「プロトコルを問わず、カスタムコードを 1 行も書かずに任意の API 依存をシミュレートできること」。green-field でも legacy でも、全エンタープライズサービスのモック/テストを 1 つのツールに統合する狙い (出典 6)。
- 共同創業者は Yacine Kheddache (Community Lead)。両者とも現在は Postman がスポンサー (`MAINTAINERS.md`)。Broudoux は元 Red Hat で、プロジェクトは長く Red Hat Developer エコシステムと関係が深い (出典 6)。
- 1.0.0 リリースは「18 ヶ月前のビジョンの実現」と本人が記述 (出典 6)。
- CNCF Sandbox 受理 2023-06-22 (出典 2)(出典 3)。CNCF Incubating 昇格は 2026-05 (TOC 投票、CNCF ブログ 2026-05-07) (出典 2)。Incubation 申請は [cncf/toc issue #1552](https://github.com/cncf/toc/issues/1552) (出典 4)。

## アーキテクチャの素材

トップレベルのコンポーネント (Maven モジュール単位):

- `webapp` (Spring Boot コア): REST API、各プロトコルの mock controller、importer、service、MongoDB repository、Angular SPA。Java パッケージは `io.github.microcks` 配下に `web` / `service` / `repository` / `event` / `listener` / `security` / `task` / `util` / `config`。
- `commons/model`: ドメインモデル (`Service`, `Operation`, `Response`, `Request`, `Message`, `Exchange` など)。
- `commons/util` / `commons/util-el`: 共通ユーティリティと式言語 (Expression Language)。
- `minions/async`: Quarkus 製の非同期モックエンジン。AsyncAPI のイベントを各ブローカーへ publish する producer 群 (`minions/async/src/main/java/io/github/microcks/minion/async/producer/`): Kafka, MQTT, AMQP, NATS, Google Pub/Sub, Amazon SNS, Amazon SQS, WebSocket。AsyncAPI のコントラクトテストも担当。
- mock controller の幅 (`webapp/.../web/`): REST (`RestController`), SOAP (`SoapController`), GraphQL (`GraphQLController`), gRPC (`GrpcServerCallHandler`), 動的 REST (`DynamicMockRestController`), さらに MCP (`McpController`, モックを Model Context Protocol サーバとして公開)。AI Copilot (`AICopilotController`, OpenAI) も同梱。

### 代表操作のトレース: REST モック呼び出し (end to end)

すべて pin commit で確認。

1. `webapp/.../web/RestController.java:97-107` `@RequestMapping("/rest/{service}/{version}/**")` の `execute(...)`。`/rest-valid/...` 版 (`:110-120`) はリクエストボディ検証付き。両方 `doExecute(...)` へ。
2. `RestController.java:123` `doExecute(...)`。`findInvocationContext(...)` (`:151`) で service/operation を解決。operation が無く CORS 有効なら OPTIONS を処理 (`:165`)。`validateRequest` 時は `validateRequestBody(...)` (`:198`) で OpenAPI スキーマ検証。最後に `processMockInvocationRequest(...)` (`:191`)。
3. `RestController.java:288` で `invocationProcessor.processInvocation(...)` へ委譲。
4. `webapp/.../web/RestInvocationProcessor.java:145` `processInvocation(...)`。fallback / proxy-fallback を解決 (`:153-156`) し dispatcher と rules を決定。
5. `RestInvocationProcessor.java:164` `computeDispatchCriteria(...)` (実体 `:327`)。`switch (dispatcher)` (`:342`) で dispatch style ごとに criteria 文字列を生成: `SEQUENCE`/`URI_PARTS`/`URI_ELEMENTS` は `DispatchCriteriaHelper.extractFromURIPattern`、`URI_PARAMS` は `extractFromURIParams`、`SCRIPT`/`GROOVY`/`JS` は `scriptEngine.eval(...)`、`JSON_BODY` は `JsonExpressionEvaluator.evaluate`、`QUERY_HEADER` は `extractFromParamMap`。
6. `RestInvocationProcessor.java:170` `getResponse(...)` (実体 `:450`)。`responseRepository.findNonCallbackByOperationIdAndDispatchCriteria(operationId, dispatchCriteria)` (`:455`) で MongoDB を完全一致検索。media type で絞り込み (`getResponseByMediaType` `:307`)。見つからなければ criteria を response 名とみなして `findNonCallbackByOperationIdAndName` で再検索 (`:464`)。
7. 見つからず fallback があれば fallback 名で再取得 (`:181-183`)。proxy が必要なら `proxyService.callExternal(...)` で外部へ転送 (`:213`)。dispatcher 有りで該当無しは 400 を返す (`:225-232`, issue #819/#1132 由来)。
8. `RestInvocationProcessor.java:248-249` `getResponseHeaders` / `getResponseContent` で応答を組み立て、callback / AsyncAPI トリガーを発火 (`:252-255`)、`ResponseResult` を返す (`:258`)。

### 非自明な設計判断: 対称的に事前計算する dispatchCriteria 文字列

マッチングをリクエスト毎のルール評価ではなく文字列等価検索に落とし込んでいる。

- import 時: importer が各 example から criteria 文字列を計算して `Response.dispatchCriteria` に永続化する。例えば `webapp/.../util/openapi/OpenAPIImporter.java:807` `completeDispatchCriteriaAndResourcePaths(...)` が `DispatchCriteriaHelper.buildFromPartsMap` / `buildFromParamsMap` (`:815-827`) で criteria を生成。
- 実行時: 同じ `DispatchCriteriaHelper` の `extract*` 系で生きたリクエストから同じ形式の criteria を再計算し (上記トレース手順 5)、`ResponseRepository.java:42-43` の `@Query("{ 'operationId' : ?0, 'dispatchCriteria' : ?1 , 'callbackName' : { '$exists' : false }}")` で 1 回の完全一致クエリにする。
- criteria のキーはソート済みで生成されるため、クエリパラメータの順序に依存しない。Mongo のインデックス検索 1 発で応答を選ぶのが肝。
- `Response.dispatchCriteria` フィールド: `commons/model/.../domain/Response.java:32`。

## 内部実装の素材

重要ディレクトリ:

- `webapp/src/main/java/io/github/microcks/web`: 各プロトコルの mock controller と invocation processor。公開されたモックエンドポイントの実体。
- `webapp/.../service`: `ServiceService`, `MessageService`, `TestService`, `TestRunnerService` など。import やテスト実行のオーケストレーション。
- `webapp/.../util/{openapi,asyncapi,postman,soapui,har,graphql,grpc}`: 各アーティファクト形式の importer。`setDispatchCriteria` を呼ぶのは `OpenAPIImporter`, `AsyncAPIImporter`, `AsyncAPI3Importer`, `PostmanCollectionImporter`, `SoapUIProjectImporter`, `HARImporter`, `ExamplesImporter`。
- `webapp/.../repository`: Spring Data Mongo repository。`ResponseRepository`, `ServiceRepository`, `ResourceRepository` など。

中核データ構造 (`commons/model/.../domain/`):

- `Service.java:27`: `name` + `version` + `type` (`ServiceType`) + `List<Operation>`。モックの単位。
- `Operation.java:32`: `dispatcher` (`:48`) と `dispatcherRules` (`:49`) を保持。どの dispatch style でマッチングするかを決める。
- `Response.java:26` (`extends Message`): `status`, `mediaType`, `dispatchCriteria` (`:32`), `callbackName`, `isFault`。応答の実体。
- `Request.java` / `Message.java` / `Exchange.java`: サンプルのリクエスト/応答ペア (example) を表す。Microcks は仕様内の example を生きたモックに変換する。
- `web/DispatchContext.java`: `dispatchCriteria` + `requestContext` を束ねる実行時オブジェクト。

驚いた点 / 非自明:

- マッチングの大半が「import 時に文字列へ事前計算 して 実行時は完全一致検索」という対称設計に集約されている (上述)。dispatcher が `null` の operation は何か 1 つ返すフォールバック (`getOneForOperation` `RestInvocationProcessor.java:223`)。
- OpenTelemetry の explain tracing がモック呼び出しの各判断 (dispatcher 選択、response lookup、delay、proxy) を span event として埋め込む (`RestInvocationProcessor.java:159-262`)。モックがなぜその応答を返したかをトレースで説明できる。
- SCRIPT/GROOVY/JS dispatcher で `scriptEngine.eval(...)` を実行時に呼ぶ (`RestInvocationProcessor.java:360,374-384`)。ユーザ定義スクリプトでディスパッチ先を決められる。

## 採用事例の素材

すべて `ADOPTERS.md` (出典リンク付き) もしくは CNCF ブログから。出典の無いものは載せない。

- J.B. Hunt: 開発を 7 ヶ月短縮と記載。[blog post](https://microcks.io/blog/jb-hunt-mock-it-till-you-make-it/) (出典 5)。CNCF ブログでも言及 (出典 2)。
- Société Générale: クラウドネイティブ API の多プロトコルモック/テスト。[Red Hat Summit 2019 資料](https://www.redhat.com/files/summit/session-assets/2019/T8B6B4.pdf) (出典 5)。
- BNP Paribas: 2022 からレガシー基幹/メインフレーム API のモックに利用 (出典 5)。CNCF ブログでも言及 (出典 2)。
- Lombard Odier: mock-as-a-service / APIOps。[APIdays Paris 2022 スライド](https://speakerdeck.com/apidays/apidays-paris-2022-adding-a-mock-as-a-service-capability-to-your-api-strategy-portfolio-ludovic-pourrat-lombard-odier) (出典 5)。
- Amadeus: shift-left のモック/契約テスト。[Riviera DEV 2025 資料](https://www.slideshare.net/slideshow/how-to-secure-your-apis-without-compromising-the-developer-experience-pdf/281499574) (出典 5)。
- GSMA: CAMARA API / Open Gateway のサンドボックスで利用 (出典 5)。
- Deloitte: REST/SOAP 170+ API のバックエンドモック (出典 5)。
- Nordic Semiconductor (nRFCloud.com), Bitso (gRPC contract), TransferGo, Michelin, GetYourGuide, Amway, Banco PAN (外部 Kafka 連携) なども `ADOPTERS.md` に出典付きで記載 (出典 5)。
- 別プロジェクトからの利用: Traefik (API sandbox 製品に組込み), AsyncAPI Generator (CI の acceptance test), Fluent CI (出典 5)。

採用シグナル (数値 + 日付):

- GitHub: 1,969 stars / 341 forks (GitHub API, 2026-06-24 参照) (出典 1)。
- CNCF ブログ (2026-05-07): 累計 645 contributors、2025 年のコンテナイメージ DL 250 万超 (2024 の 3 倍)、公開 adopter 34 組織 (2025 に 13 増)、直近 365 日中 342 日アクティブ (出典 2)。
- DevStats: [microcks.devstats.cncf.io](https://microcks.devstats.cncf.io/) で contributor 等を追跡 (`GOVERNANCE.md` がリンク)。

ガバナンス:

- Apache-2.0、vendor-neutral を明示 (`GOVERNANCE.md`)。役割は Maintainer / Code Owner / Contributor / Adopter の 4 階層。
- Top-level maintainer 3 名: Laurent Broudoux (`lbroudoux`, Postman sponsored), Yacine Kheddache (`yada`, Postman sponsored), Sebastien Degodez (`SebastienDegodez`, AXA France) (`MAINTAINERS.md`)。

## 代替・エコシステム

代替 (本質的な差) (出典 7)(出典 8):

- WireMock / MockServer: config/code 駆動。スタブを手書きし、複雑な状態遷移や否定系テストに強い。仕様変更時は手で追従。Microcks は仕様 (artifact) 駆動で example から自動生成する点が逆。
- Prism (Stoplight/SmartBear): OpenAPI 専用の spec 駆動だが CLI のみ・UI なし・単一プロセス。Microcks は UI + サーバ + 複数プロトコル + 契約テストを 1 つに統合し Kubernetes ネイティブ。
- Mountebank / Mockoon / Hoverfly: それぞれ多プロトコルプロキシ / デスクトップ GUI / レコード&リプレイ。Microcks の差別化は REST + SOAP + GraphQL + gRPC + AsyncAPI イベントを同一プラットフォームで扱い、同じアセットでモックと契約テストの両方を回せる点 + CNCF バックアップ。

エコシステム / 統合:

- Microcks 組織の周辺 repo: CLI (`microcks-cli`)、Testcontainers モジュール、Docker Desktop Extension、Kubernetes Operator、各言語クライアント。
- CI/CD: GitHub Actions, Jenkins, Tekton と CLI 経由で連携。
- 依存ミドルウェア: MongoDB (永続化)、Keycloak (認証)、async では Kafka 他ブローカー。
- 新しめの機能: モックを Model Context Protocol サーバとして公開する `McpController`、OpenAI 連携の AI Copilot。

最小構成のインストール (`install/docker-compose/README.md`):

```bash
git clone https://github.com/microcks/microcks.git
cd microcks/install/docker-compose
docker-compose up -d
```

これで MongoDB (`microcks-db`) と Keycloak (`microcks-sso`, ホスト `18080`) と Postman runtime と Microcks 本体 (`microcks`, ホスト `8080` と gRPC `9090`) が起動。UI は `http://localhost:8080`。非同期 (Kafka 等) を使うには `async-addon.yml` で async minion とブローカーを追加する (`docker-compose.yml`, `async-addon.yml`)。
