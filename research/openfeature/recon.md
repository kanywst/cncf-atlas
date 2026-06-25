# recon: OpenFeature

調査メモ。OpenFeature は「feature flag 評価のためのベンダー中立な標準 API」を定める CNCF Incubating プロジェクト (1)(3)(4)。本体は仕様リポ `open-feature/spec` (2) と各言語 SDK 群だが、deep-dive の対象としてはコードを追える主力実装、参照バックエンド **flagd (`open-feature/flagd`)** を採る。理由はリポ解決の節を参照。出典は `(n)` で sources.md に対応。`file:line` は `research/openfeature/src/` 以下の相対パス。

## リポ解決の根拠

- OpenFeature プロジェクトの中心は仕様 (`open-feature/spec`, 1,192 stars / 55 forks, gh 2026-06-24) (2)(11)。ただし spec リポは大半が markdown で、コード trace の対象に乏しい。
- OpenFeature 自体は「SDK + 仕様」であり、特定言語 SDK が突出して支配的ではない (go-sdk 約 241 stars 等)。一方 **flagd は org 内でコード量が最も多く star も多い参照実装** (934 stars / 119 forks / 122 open issues, Go, 作成 2022-05-26, gh 2026-06-24) (1)(11)。
- flagd は OpenFeature の「リファレンス flag バックエンド」。SDK + provider が呼ぶ評価エンジン本体で、sync ソース・in-memory store・JSONLogic ターゲティング・gRPC/OFREP サーバを内包し、core operation を end-to-end で追える。「主実装リポを採れ」の指示に従い flagd を対象とする (12)。

## 基本情報

- repo: open-feature/flagd (1)。仕様本体は open-feature/spec (2)。
- pinned commit: `80b9e9548163c1adbd28d45ca52364956e7fa08f` (2026-06-01, main HEAD)
- 近いタグ: `flagd/v0.16.0` および `core/v0.16.0` (HEAD が両タグを指す。`git tag --points-at HEAD` で確認)。flagd はモノレポで `flagd` / `core` / `flagd-proxy` を独立リリースする (1)。
- 言語 / ビルド: Go。`core/go.mod` は `go 1.25.0`、`flagd/go.mod` は `go 1.25.5`。ローカル toolchain は go1.26.4。3 つの Go モジュールを Go workspace で束ねる。デフォルトビルドは `make build` (= workspace-init して flagd バイナリ)。コンテナは `make docker-build-flagd` (`flagd/build.Dockerfile`)。
- ライセンス: Apache-2.0。`LICENSE` 本文に `Apache License Version 2.0` と `Copyright OpenFeature Maintainers` を確認。`gh api repos/open-feature/flagd` の `license.spdx_id` も `Apache-2.0` (1)(11)。
- CNCF 成熟度: Incubating。Sandbox 受理 2022-06-17、Incubating 昇格 2023-11-21 (TOC 投票)、公表 2023-12-19 (3)(4)(8)。
- カテゴリ (tools.ts CATEGORY_ORDER): Developer Tools (確定済み、verbatim)。
- 主エントリポイント: バイナリ `flagd/main.go:11` が `cmd.Execute(version, commit, date)` を呼ぶだけ。実体は cobra の `start` サブコマンド (`flagd/cmd/start.go`)。動作可能な最小構成は Docker で `--uri file:...` を渡すだけ (6)。

## 歴史の素材

- OpenFeature は Flagsmith が CNCF Sandbox として提出 (2022-06)。LaunchDarkly / Split / CloudBees / Flagsmith などベンダー各社が支持を表明したコミュニティ主導の標準化。Split と LaunchDarkly の合併から生まれたわけではない (7)(4)。
- CNCF 受理 2022-06-17、Incubating 昇格 2023-11-21 (3)。SiliconANGLE / SD Times が 2023-12-19 に Incubating を報道 (8)(9)。
- flagd リポ自体は 2022-05-26 作成 (gh, 11)。OFREP (OpenFeature Remote Evaluation Protocol) はリモート評価のワイヤプロトコル標準として後発で策定。flagd は OFREP を実装する (1)(12)。
- 目的は vendor lock-in 回避。仕様で評価 API を定め、SDK が実装、各 flag 管理システムは provider として接続する (5)。

## アーキテクチャの素材

flagd は 3 つの Go モジュールから成るモノレポ。

- `core/` : 再利用可能ライブラリ。evaluator / store / sync / model / service(OFREP model) / telemetry。
- `flagd/` : デーモン本体。cmd(cobra)・runtime・service(flag-evaluation / flag-sync / middleware)。
- `flagd-proxy/` : sync をファンアウトするプロキシ (別バイナリ)。

データフローは 2 系統。

1. flag 取り込み (sync から store)。`ISync` 実装 (file / http / grpc / kubernetes / azblob/gcs/s3 blob) がソースを watch し `DataSync` を channel で Runtime に送る (`core/pkg/sync/isync.go:13-41`)。Runtime が `JSON.SetState` を呼び `store.Update` で in-memory store に反映する (`core/pkg/evaluator/json.go:117-136`)。プロバイダは `syncbuilder` が URI スキームで振り分ける (`core/pkg/sync/builder/syncbuilder.go:101-139`)。
2. flag 評価 (request から evaluator、store)。`ConnectService` が connectrpc(HTTP/2 h2c) で evaluation の 3 プロトコル版 + OFREP REST を公開。`setupServer` が old(schemaV1) / v1 / v2 ハンドラを生成し `bufSwitchHandler` で多重化する (`flagd/pkg/service/flag-evaluation/connect_service.go:133-183`)。

ランタイム配線は `flagd/pkg/runtime/from_config.go:55` の `FromConfig`。startup の `--uri` / `--sources` から `SyncProviders` を組み、telemetry(OTel trace/metrics)・store・evaluator・各 service を生成する。URI 文字列は verbatim 登録され、sync が返す `DataSync.Source` がこの文字列と一致する必要がある (`from_config.go:84-90`)。

設計判断 (非自明):

- store は **hashicorp/go-memdb** を採用する (`core/pkg/store/store.go:33-121`)。flag を単純な map ではなく、7 本の index (id 複合 / source / priority / flagSetId / key / 各種複合) を持つトランザクショナルな in-memory DB に格納する。複数 sync ソース間で同一 key の flag が衝突した際、`s.sources` のスライス順を priority として高優先ソースが勝つ (`store.go:42`, `store.go:232-246`)。selector header (`flagSetId=...` 等) で評価対象を絞れるのもこの index 設計ゆえ。
- 評価プロトコルを 3 版 (deprecated schema.v1 / evaluation.v1 / evaluation.v2) 同一 HTTP ハンドラ上で `bufSwitchHandler` 多重化し、後方互換を保ったまま v2(optional value/variant) へ移行している (`connect_service.go:177-181`)。

## 内部実装の素材

代表 core operation = boolean flag の評価を end-to-end で追う (`/flagd.evaluation.v1.Service/ResolveBoolean`)。

1. エントリ: `flagd/main.go:11` から `cmd.Execute` から cobra `start` から `runtime.FromConfig` (`flagd/pkg/runtime/from_config.go:55`) が `ConnectService` を起動。ハンドラ登録は `connect_service.go:153,162`、多重化は `:177`。
2. gRPC ハンドラ: `FlagEvaluationService.ResolveBoolean` (`flagd/pkg/service/flag-evaluation/flag_evaluator_v1.go:207`)。selector header を読み `store.NewSelector` 化して ctx に載せ、proto version `v1` も ctx に載せて共通 `resolve` を呼ぶ (`:214-231`)。
3. 共通 resolver: `resolve[T]` (`flag_evaluator.go:349`)。リクエスト ctx / config の static context / header を `mergeContexts` で統合し (`:356`)、評価関数を呼ぶ。エラーは `errFormat` で connect の code に翻訳する (`:395-409`)。
4. 評価本体: `Resolver.ResolveBooleanValue` (`core/pkg/evaluator/json.go:205`) からジェネリック `resolve[bool]` (`json.go:298`) から `evaluateVariant` (`json.go:326`)。
5. `evaluateVariant`: store から flag 取得 (`json.go:335`)。`state==DISABLED` なら DISABLED 理由で抜ける (`:349-352`)。targeting があれば `$flagd` プロパティ (flagKey / timestamp) を context に注入し (`:364-367`)、targeting(JSONLogic) と context(JSON) を `jsonlogic.Apply` で評価する (`json.go:378`)。結果文字列を variant 名に解決し、有効なら `TARGETING_MATCH` を返す (`:401-406`)。targeting が無ければ `defaultVariant` を `STATIC` で返す (`:420`)。
6. 型確定: `resolve[T]` が `variants[variant].(T)` を type-assert する。失敗時は `TYPE_MISMATCH` エラー (`json.go:317-320`)。
7. store 取得: `Store.Get` は selector を go-memdb クエリに変換して引く (selectOrAll/collect 経路, `store.go:200-208`)。

JSONLogic のカスタム演算子 (`fractional` / `starts_with` / `ends_with` / `sem_ver`) は `NewResolver` で global に登録される (`json.go:147-150`)。`fractional` は `targetingKey` でバケットに割り当てる擬似乱数スプリットに使う (`json.go:30-32`、実装は `core/pkg/evaluator/fractional.go`)。

中核データ構造 (3-5):

- `model.Flag` (`core/pkg/model/flag.go:10-20`) : key / state / defaultVariant / variants(map) / targeting(`json.RawMessage`) / source / priority / flagSetId / metadata。priority と flagSetId は serialize されず索引専用。
- `sync.DataSync` (`core/pkg/sync/isync.go:30-41`) : sync 実装と Runtime の契約。FlagData(string) / Source / Selector / IncrementalUpdates。
- `sync.SourceConfig` (`core/pkg/sync/isync.go:44-70`) : 各ソースの設定 (uri / provider / tls / selector / interval / oauth 等)。
- `store.Store` + go-memdb スキーマ (`core/pkg/store/store.go:33-121`) : in-memory DB と複合 index 群、ソース priority。
- 理由コード (`core/pkg/model/reason.go`) : TARGETING_MATCH / STATIC / DEFAULT / DISABLED / ERROR / FALLBACK 等。FALLBACK は内部用で API では DEFAULT に翻訳する。

`SetState` 経路の flag 取り込みでは JSON Schema 検証 (`flagd.dev/schema/v0/*`) と `$evaluators` の `$ref` 展開 (`transposeEvaluators`, `json.go:538-571`) を通す (`json.go:463-518`)。

## 採用事例の素材

- CNCF の Incubating 公表ブログ (2023-12-19) が end user として **eBay / Google / SAP / Spotify** を挙げる (4)。vendor 支持として LaunchDarkly / Split / CloudBees / Flagsmith (4)(7)。
- 上記以外の採用組織は本調査では未確認。捏造しない。ADOPTERS ファイルは flagd リポには無く、組織名はこの CNCF 出典のみを根拠とする。

## 代替・エコシステム

- OpenFeature は「標準」であり、競合は個々の flag 管理製品。商用 SaaS: LaunchDarkly / Split / CloudBees / ConfigCat。OSS セルフホスト: Unleash / Flagsmith / GO Feature Flag。これらは OpenFeature provider を提供して標準に乗ることも、独自 SDK を提供することもある (5)(7)。
- flagd 自体の本質的差: ベンダーロックインしない参照バックエンド。flag 定義 (JSON / YAML) を file / http / k8s CRD / gRPC / blob から取り込み、gRPC・OFREP(REST)・in-process 評価の 3 形態で同じ評価ロジックを提供する (1)(6)(12)。
- エコシステム: `open-feature/spec` (API 仕様)、各言語 SDK (go/java/js/dotnet/python/php/ruby ほか)、`open-feature-operator` (k8s で flagd サイドカー注入)、OFREP (リモート評価プロトコル)、flagd provider 群 (1)(2)(5)。
- 統合: OpenTelemetry (trace/metrics をネイティブに発行、`from_config.go:67-82`)、Kubernetes (CRD sync + operator)、クラウド blob (S3 / GCS / Azure)。

## 一言タグライン

- EN: A vendor-neutral standard and reference daemon (flagd) for feature flag evaluation across any language and backend.
- JA: 言語やバックエンドを問わず使える、ベンダー中立な feature flag 評価の標準と参照実装 (flagd)。
