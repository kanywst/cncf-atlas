# recon: GUAC

調査メモ。GUAC = Graph for Understanding Artifact Composition。SBOM / SLSA / VEX / scorecard 等のサプライチェーンメタデータを取り込み、正規化して高精度グラフ (GraphQL でクエリ可能) に集約する OpenSSF プロジェクト。CNCF ではない。

## 基本情報

- repo: `guacsec/guac`
- pinned commit: `362e6dacedaa22af63c157b2c9d3e39a51da437f` (main, 2026-06-20) / 近いタグ: `v1.1.0` (`a399a54801bfbffc36bc8748dd97d2d2b3bea378`、HEAD はこのリリース後の main)
- 言語 / ビルド: Go (`go 1.26.0`、`go.mod`) / バイナリは `make build` (goreleaser)、ローカル一式は `make start-service` (docker compose)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認、GitHub API も `spdx_id: Apache-2.0`)
- CNCF 成熟度: Independent (CNCF 非加盟。OpenSSF の incubating project, Supply Chain Integrity WG 配下。出典は下記)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Supply Chain
- main エントリポイント: 5 つの CLI バイナリ (`cmd/` 配下)。`guacone` (オールインワン: collect/ingest/query/certify)、`guacgql` (GraphQL サーバ)、`guacrest` (REST)、`guaccollect` (収集デーモン)、`guaccsub` (collectsub サーバ)。例: `cmd/guacone/main.go` は `cmd.Execute()` のみ、サブコマンドは `cmd/guacone/cmd/` に分割 (collect.go / query.go / files.go / osv.go ほか)

## 歴史の素材

- 2022-06-10 GitHub リポジトリ作成 (GitHub API `created_at`)。創設は Kusari, Google, Purdue University, Citi の共同。支援に Yahoo!, Microsoft, Red Hat, Guidewire, ClearAlpha Technologies (OpenSSF/Kusari ブログ)
- 設計思想: ソフトウェアサプライチェーン透明性モデルの「集約と統合 (aggregation and synthesis)」レイヤを埋める。SBOM 単体ではなく複数 SBOM + 外部メタデータ (deps.dev, OSV, ClearlyDefined) を 1 つのグラフに統合し、audit / policy / risk に答える (README)
- 2024-03-07 OpenSSF に incubating project として参加。OpenSSF の project lifecycle で incubating の due diligence を最初に通過したプロジェクトとされる (OpenSSF ブログ、InfoQ)
- 2026-01 (報) Red Hat が Trustify を GUAC コミュニティへコントリビュート (Red Hat ブログ)

## アーキテクチャの素材

非同期マイクロサービス型の取り込みパイプライン。収集 → 処理 → パース → 組立 → グラフDB、クエリは GraphQL に集約。

- パイプライン全体の同期版は `pkg/ingestor/ingestor.go:39` `Ingest()`。4 段を関数として組む: `processorFunc` → `ingestorFunc` (parser) → `collectSubEmitFunc` → `assemblerFunc` (`ingestor.go:52-55`)。実行は `docTree, _ := processorFunc(d)` → `predicates, idstrings, _ := ingestorFunc(docTree)` → `assemblerFunc(predicates)` (`ingestor.go:59-73`)
- Collector: `pkg/handler/collector/collector.go:36` `Collector` インタフェース。`RetrieveArtifacts(ctx, docChannel chan<- *processor.Document)` でドキュメントをチャネルに流す。実装は `pkg/handler/collector/` 配下 (file, gcs, s3, oci, git, github, deps_dev, kubescape, blob)。登録は `RegisterDocumentCollector` (`collector.go:64`)
- Emitter / blob store / pubsub: 収集物は blob store に置かれ、pubsub (NATS, gocloud) 経由で processor が pull する。`pkg/handler/processor/process/process.go:85` `Subscribe()` がイベントを受け、blob key をデコード (`events.DecodeEventSubject`) → `blobStore.Read` → `processor.Document` に unmarshal → emitter (`process.go:105-138`)。処理成功後に `d.Ack()` で初めて queue から ack する at-least-once 設計
- Backend 抽象化: `pkg/assembler/backends/backends.go:27` `Backend` インタフェース。全 backend が同一の GraphQL クエリ/ミューテーションを実装することをコンパイル時に強制 (read-only クエリ、ページング版 `*List`、ミューテーション `Ingest*`、トポロジ系 `Neighbors`/`Path`/`Node`、検索 `FindSoftware`)。実装は `keyvalue` (インメモリ、デフォルト/適合性リファレンス) と `ent` (PostgreSQL) が fully supported、ほかに `arangodb`/`neo4j`/`neptune`。登録は `backends/register.go`

## 内部実装の素材

中核オペレーション = SBOM/attestation 取り込みパス (collect → process → parse → assemble)。代表として 1 ドキュメントの `Ingest` を端から端まで追った。

- step 1 process: `pkg/handler/processor/process/process.go:168` `Process()` → `processHelper` → `processDocument` (`process.go:197`)。`decodeDocument` (bzip2/zstd 展開) → `preProcessDocument` (`guesser.GuessDocument` で型/フォーマット推定、`process.go:223`) → `validateFormat` (JSON/JSONLines/XML の整合、`process.go:235`) → `validateDocument` (型ごとの `ValidateSchema`) → `unpackDocument` (DSSE envelope や tarball を子ドキュメントに分解、`process.go:269`)。processor は `init()` で型ごとに登録 (`process.go:57-72`: ITE6/SLSA, DSSE, SPDX, CycloneDX, CSAF, OpenVEX, Scorecard, deps_dev, jsonlines)。出力は再帰的な `DocumentNode` ツリー (`processor.go:50`)
- step 2 parse: `pkg/ingestor/parser/parser.go:84` `ParseDocumentTree()`。`docTreeBuilder.parse` がツリーを DFS し、型ごとの parser (`init()` で登録、`parser.go:42-56`) で各ノードを `common.GraphBuilder` に変換 → `CreateAssemblerInput` で `assembler.IngestPredicates` を生成 (`parser.go:98-100`)。`scanForVulns`/`scanForLicense`/`scanForEOL`/`scanForDepsDev` が真なら、抽出した pURL を OSV / ClearlyDefined / endoflife / deps.dev に並行スキャンして predicate を追加 (`parser.go:109-195`、`sync.WaitGroup`)
- step 3 assemble: `pkg/ingestor/ingestor.go:177` `GetAssembler` が genqlient の GraphQL client を生成し `helpers.GetBulkAssembler` を返す。predicate を GraphQL ミューテーションでグラフDB へバルク投入。`MergedIngest` (`ingestor.go:84`) は複数ドキュメントを束ね、predicate が 5000 件たまるごとに flush (`ingestor.go:137-145`)

中核データ構造 (3-5 個):

1. `processor.Document` (`pkg/handler/processor/processor.go:35`): 生バイト `Blob` + `Type`/`Format`/`Encoding`/`SourceInformation`。`DocumentTree`/`DocumentNode` (`processor.go:47-53`) は DSSE 等の入れ子分解を表す再帰ツリー
2. `assembler.IngestPredicates` (`pkg/assembler/assembler.go:31`): GUAC オントロジーの「evidence tree」(証拠) を束ねた構造体。`IsDependency`/`IsOccurrence`/`HasSBOM`/`HasSlsa`/`CertifyVuln`/`Vex`/`CertifyLegal`/`CertifyScorecard` など 17 種。コメント曰く software tree (Package/Source/Artifact 等) の登録は暗黙で client library が処理し、ここは evidence のみ持つ (`assembler.go:27-30`)
3. `backends.Backend` インタフェース (`pkg/assembler/backends/backends.go:27`): software tree (Package/Source/Artifact/Builder/License/Vulnerability) と evidence tree を分けて扱い、全 backend に同一 API を強制
4. `verifier.Identity` (`pkg/ingestor/verifier/verifier.go:50`): `ID` / `Key` / `Verified`。署名検証の結果を表す
5. GraphQL `model.*` / `generated.*InputSpec`: ノード/エッジのオントロジー。pURL ベースの Package は type/namespace/name/version のトライ状に正規化される (`helpers.PkgClientKey` による key 生成、`assembler.go:200` 周辺)

非自明な設計判断 (コードを読まないと見えない):

- 署名検証 (verify) と取り込み (ingest) が分離されている。`pkg/handler/processor/dsse/dsse.go:55` の `DSSEProcessor.Unpack` は DSSE envelope の payload を base64 デコードして子ドキュメントを返すだけで、署名は検証しない。検証は別系統 `pkg/ingestor/verifier/verifier.go:71` `VerifyIdentity` (sigstore verifier) が担う。さらに `Identity` の doc コメント (`verifier.go:46-49`) が明示する: `Verified` は「署名が鍵と一致した」ことであって「信頼できる (trusted)」ことを意味しない。つまり GUAC は検証済み identity をグラフに記録するが、信頼判断はクエリ側/ポリシー側に委ねる
- パーサのループ防止: `ParseDocumentTree` は `visitedKey{docType, format, sourceInformation}` の map で訪問済みノードを記録し、DSSE/tarball の入れ子で無限ループを防ぐ (`parser.go:203-220`)。map のキーにスライスを使えないので struct キーにしている、というコメント付き
- processor/parser/collector/verifier すべてが `init()` でグローバル map に自己登録する plugin 風アーキテクチャ (`process.go:57`, `parser.go:42`, `collector.go:64`, `verifier.go:61`)。新フォーマット追加は登録 1 行で済む反面、登録が重複すると map を上書きしつつ error を返す変則挙動 (`process.go:74-81`)

## 採用事例の素材

- 名指しの本番採用組織を示す ADOPTERS.md は repo に無く (README に adopters セクションも無し)、信頼できる出典付きのエンドユーザ事例は確認できなかった (捏造しない)
- 開発・貢献に関わる組織としては Kusari, Google, Purdue University, Citi (創設)、Yahoo!, Microsoft, Red Hat, Guidewire, ClearAlpha Technologies (支援) が OpenSSF / Kusari ブログで挙がる。これは「作っている/支援している」組織であって「本番で使っている」事例の出典ではない点に注意
- 採用シグナル (定量): GitHub stars 1,508 / forks 205 / contributors 70 (GitHub API、2026-06-22 取得)。OpenSSF incubating で活発に開発継続中

## 代替・エコシステム

- 統合・取り込み元: SPDX, CycloneDX (SBOM)、in-toto/SLSA attestation (ITE6/DSSE)、OpenVEX, CSAF (VEX)、OpenSSF Scorecard、deps.dev、OSV、ClearlyDefined、endoflife.date。収集元は file/OCI/GCS/S3/git/GitHub/Kubescape
- バックエンド: keyvalue (インメモリ)、ent+PostgreSQL (本番推奨)、ArangoDB / Neo4j / Neptune (実験的)
- 隣接/代替プロジェクト: Trustify (Red Hat、2026 に GUAC へ寄贈)、依存解析の Dependency-Track、SBOM 単体管理の各種ツール。GUAC の差別化点 (Wiz/README): (1) 複数 SBOM を横断してポートフォリオ全体を観測、(2) SBOM 外の依存/脆弱性データを信頼できる第三者ソースから集約してグラフを enrich、(3) GraphQL クエリ API と可視化ツールを提供。「SBOM ストレージ」ではなく「サプライチェーンの関係グラフ + クエリ層」である点が本質的差
