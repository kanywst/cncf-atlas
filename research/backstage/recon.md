# recon: Backstage

調査メモ。自分用の密度。出典は `sources.md` の番号と対応。path:line は pin したコミット基準。

## 基本情報

- repo: `backstage/backstage` (`https://github.com/backstage/backstage`)
- pinned commit: `bccd96d2d8caa7bdd51686d0ca526cb6b9915bc4` (2026-06-24, `master`)
- 近いタグ: 直近の next タグが `v1.53.0-next.0` (2026-06-23)、直近の安定版は `v1.52.0` (2026-06-16)。shallow clone なので `git describe` は不可。root `package.json` の `version` は `1.53.0-next.0` で commit と整合 (S1)
- 言語: TypeScript (`packages` と `plugins` で `.ts`/`.tsx` 約 6,936 ファイル)。Yarn workspaces のモノレポ
- ビルド: 独自 CLI (`@backstage/cli`)。`engines.node` は `22 || 24`、Yarn 4.4.1。アプリ生成は `npx @backstage/create-app@latest`、ローカル起動は `yarn start` (front `:3000` / back `:7007`)
- ライセンス: Apache-2.0 (`LICENSE` は Apache 2.0 全文、`NOTICE` は "Copyright 2020 The Backstage Authors"。GitHub API の `license.spdx_id` も `Apache-2.0`) (S1)
- CNCF 成熟度: Incubating (2022-03-15 昇格) (S5)(S9)
- カテゴリ (tools.ts CATEGORY_ORDER から): Developer Tools

## メインの構成と用語

モノレポは 2 階層。`packages/*` がフレームワーク本体 (`@backstage/*`)、`plugins/*` がプラグイン (`@backstage/plugin-*`、159 ディレクトリ)。アプリ作者はこれらを組み合わせて自分のポータルを作る。Backstage は「デプロイして使う製品」ではなく「製品をその上に組む framework」である点が肝 (S10)。

3 つの世代が同居している (リポジトリの `.claude/CLAUDE.md` 記載):

- `core-*` (例 `@backstage/core-plugin-api`): 旧フロントエンドシステム
- `frontend-*` (例 `@backstage/frontend-plugin-api`): 新フロントエンドシステム
- `backend-*` (例 `@backstage/backend-plugin-api`): 新バックエンドシステム

主要プラグイン領域: Software Catalog (`plugins/catalog-backend`)、Software Templates / Scaffolder (`plugins/scaffolder-backend`)、TechDocs、Search、Permissions、Auth。Catalog が中核で、Templates と TechDocs と Search はその上に乗る (S3)。

## 歴史の素材

- 2016 年、Spotify 社内ツール "System Z" として開始。サービス/ドキュメント/API のオーナーシップと依存を一画面で引けるようにするのが狙い (S3)
- 2020-03-16 に Spotify が OSS 化 (初期は alpha)。公開時点で社内では 280+ チームが 2,000+ バックエンドサービス等を管理していた (S3)
- 2020-09-08 CNCF Sandbox 受理 (S4)(S5)
- 2022-03-15 CNCF Incubating へ昇格 (TOC 投票) (S5)(S9)
- graduation はまだ。2024 KubeCon EU 時点で「貢献が Spotify 偏重」が課題、Red Hat 参画でベンダー多様化を進行中。フロント/バックエンドの再アーキ (新システム) も graduation を見据えた構造変更 (S6)
- 2025-04 で公開 5 周年。Spotify は商用 "Spotify Portal for Backstage" を OSS 上に構築 (S7)

## アーキテクチャの素材

中核は Software Catalog の「処理ループ」。CRUD ストアではなく Kubernetes 風の eventually-consistent な reconcile。Entity は `apiVersion`/`kind`/`metadata`/`spec`/`relations` で K8s オブジェクトを意図的に模している (`Entity.ts` の docstring が K8s ドキュメントを直接参照) [path: `packages/catalog-model/src/entity/Entity.ts:24-28`]。

流れ (Entity Provider が「未処理 entity」を DB に入れる → 処理 → stitching → API):

1. エンジン起動。`DefaultCatalogProcessingEngine.start()` が処理パイプラインと孤児クリーンアップを起動 [`plugins/catalog-backend/src/processing/DefaultCatalogProcessingEngine.ts:114-126`]
2. パイプラインは `startTaskPipeline` でポーリング駆動 (lowWatermark 5 / highWatermark 10、既定 1,000ms 間隔)。`loadTasks` が `getProcessableEntities` で DB から期限の来た entity をバッチ取得 [`DefaultCatalogProcessingEngine.ts:135-154`], [`processing/TaskPipeline.ts:66-75`]
3. `processTask` が 1 件ごとに `orchestrator.process({ entity, state })` を呼ぶ [`DefaultCatalogProcessingEngine.ts:169-172`]
4. オーケストレータは `processSingleEntity` でステップを順に適用: envelope 検証 → preProcess → policy → validate → (Location なら) special location → postProcess。各ステップは登録済み processor 配列を順に回す [`processing/DefaultCatalogProcessingOrchestrator.ts:116-201`、preProcess の processor ループは `:205-245`]
5. processor は副産物を `collector` に emit する。派生 entity (`deferredEntities`)、`relations`、`refreshKeys`。emit された entity は `rulesEnforcer.isAllowed` で「その location 由来で許される kind か」を検査 (越境注入の防止) [`DefaultCatalogProcessingOrchestrator.ts:166-186`]
6. エンジンに戻り、出力 (completedEntity + deferred + relations + refreshKeys + parents) を安定ハッシュ化。前回 `resultHash` と同一なら DB 書込も stitching もせず即 return (no-op 最適化) [`DefaultCatalogProcessingEngine.ts:219-249`]
7. 変化があれば `updateProcessedEntity` で永続化し、旧/新リレーションの差分から「stitch すべき entity 集合」を組み、`markForStitching` で DB フラグを立てる [`DefaultCatalogProcessingEngine.ts:292-342`]
8. 別フェーズの Stitcher が `final_entities` テーブルに、全 source からのリレーションを束ねた最終 entity を組み立てる。これが Catalog API が返す姿 [`plugins/catalog-backend/src/stitching/DefaultStitcher.ts`、`final_entities` は `stitching/DefaultStitcher.test.ts:97` 等で確認]

設計判断: 処理 (processor 適用) と stitching (最終形組立) を DB フラグで疎結合にしている。1 entity の更新が他 entity のリレーションに波及するため、波及先だけを再 stitch する差分計算 (`setOfThingsToStitch`) がここに入る [`DefaultCatalogProcessingEngine.ts:325-342`]。

## 内部実装の素材

中核データ構造:

- `Entity` (`apiVersion`/`kind`/`metadata`/`spec?`/`relations?`)。`EntityMeta` の `uid`/`etag` はサーバ専有でユーザは作成時に設定不可 [`packages/catalog-model/src/entity/Entity.ts:28-54`, `:67-154`]
- entity ref ユーティリティ。`parseEntityRef` / `stringifyEntityRef` / `getCompoundEntityRef` が `kind:namespace/name` 形式と `CompoundEntityRef` を相互変換。processing/stitching 全体がこの ref 文字列をキーに動く [`packages/catalog-model/src/entity/ref.ts:55,77,140`]
- 標準 kind 群: Component / API / Resource / System / Domain / Group / User / Location。最近 `AiResourceEntityV1alpha1` と `McpServerApiEntity` が追加され、AI/MCP 方面への拡張が見える [`packages/catalog-model/src/kinds/`]
- `RefreshStateItem` (処理キューの 1 件: `unprocessedEntity`/`state`/`entityRef`/`locationKey`/`resultHash`)。エンジンが回す単位 [`DefaultCatalogProcessingEngine.ts:140-168`、型は `database/types`]
- バックエンドの DI 基盤: `createServiceRef` で定義する `coreServices` (auth/cache/database/discovery/httpRouter 等) と、`createBackendPlugin`/`createBackendModule` でプラグイン/モジュールを宣言 [`packages/backend-plugin-api/src/services/definitions/CoreServices.ts:34-134`, `packages/backend-plugin-api/src/wiring/createBackendPlugin.ts:53`, `createBackendModule.ts:58`]

エントリポイント (例 backend): `createBackend()` を作り `backend.add(import('@backstage/plugin-*'))` で feature を足して `backend.start()`。プラグインは動的 import で遅延ロードされる。`searchLoader` のように複数 feature をまとめる `createBackendFeatureLoader` もある。最近の追加に `plugin-mcp-actions-backend`、`catalog-backend-module-ai-model` があり AI 連携の足回りが入っている [`packages/backend/src/index.ts:25-82`]。

意外だった点:

- `DefaultCatalogProcessingEngine` は外部公開の `CatalogProcessingEngine` インタフェースを実装していない。コメントで「歴史的理由でこの名前、今は複数のエンジンがこのインタフェースの裏に隠れている」と明記 [`DefaultCatalogProcessingEngine.ts:55-60`]
- prom-client メトリクスは deprecated で OpenTelemetry へ移行中。両方を二重に記録している [`DefaultCatalogProcessingEngine.ts:391-409`]
- entity ごとの processor キャッシュに TTL (`CACHE_TTL = 5`) があり、エラー時はカウントダウンして最終的に空に落とす [`DefaultCatalogProcessingEngine.ts:44`, `:177-201`]
- `catalog-backend` の `.claude/CLAUDE.md` に「DB クエリ変更時はパフォーマンスバッテリ (`src/tests/performance/query-battery/`) を回せ」と運用ルールがある。カタログ DB 層の回帰に神経質

## 採用事例の素材 (出典付きのみ)

`ADOPTERS.md` に 288 行の組織エントリ (Adopter フォーム/PR 経由の自己申告) (S1)。著名どころで実在確認できたもの: Spotify, American Airlines, Expedia, Splunk, VMware, Wayfair, Zalando, Box, Booking.com, HP, Fidelity, Telenor, Twilio, Epic Games, Mercedes(-Benz), Volvo, Palo Alto。Roadie は managed Backstage ベンダーとして掲載 (S1)。

数値シグナル (2026-06-24 時点、GitHub API):

- stars 33,688 / forks 7,423 / watchers(subscribers) 231 / open issues 448 (S1)
- contributors API のページング集計で 360+ のコミット作者 (API は上限あり、実数はこれ以上) (S1)
- CNCF velocity: 寄贈年 2020 に 100+ プロジェクト中 8 位、2025 には 230+ 中 6 位 (CNCF/Aniszczyk コメント) (S8)
- IDP カテゴリ自体の追い風: Gartner 2025 IDP Market Guide が「2028 までに 85% のソフトウェア組織が IDP を採用 (2023 は 25% 未満)」と予測 (S10)

## 代替・エコシステム

- 商用/SaaS IDP: Port, Cortex, OpsLevel。Backstage が "framework"(自分でビルド/運用、エンジニア数名常駐) なのに対し、これらは "product"(数日で立ち上げ、データモデルは固定寄り)。差は柔軟性 vs time-to-value (S10)
- managed Backstage: Roadie, Spotify Portal for Backstage。OSS の Backstage を運用代行/製品化 (S7)(S10)
- 強みとして繰り返し挙がるのは TechDocs (コード同梱 Markdown を検索可能なドキュメントサイトに) と、React アプリを丸ごと所有できる拡張性の天井の高さ、ライセンス無償 (S10)
- エコシステム: 159 の公式プラグイン + コミュニティプラグイン。Kubernetes, GitHub, ArgoCD, PagerDuty 等の連携プラグインが代表。バックエンドは Knex (Postgres/SQLite) を使う (S2)(S3)
