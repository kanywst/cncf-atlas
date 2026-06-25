# recon: kubescape

調査メモ。自分用の密度。出典は `sources.md` の番号と対応。path:line は pinned commit で確認済み。

## 基本情報

- repo: `kubescape/kubescape` ([S1])
- pinned commit: `82749757ff7eb629271dffa68e45beb7f085f7e4` (2026-06-23, master) / 近いタグ: `v4.0.9` (リリース 2026-05-29、HEAD はその後のコミット)
- 言語 / ビルド: Go (`go 1.26.0`) / `go build -v .`（`Makefile` の `build:` ターゲット）。テストは `make test`
- ライセンス: Apache-2.0（`src/LICENSE` の冒頭 = `Apache License Version 2.0`。GitHub API の `license.spdx_id` も `Apache-2.0`）([S1])
- CNCF 成熟度: Incubating（TOC 採択 2025-01-13、公式アナウンス 2025-02-26）([S2] [S3])
- カテゴリ (tools.ts の CATEGORY_ORDER から): Security & Compliance
- main entrypoint: `src/main.go:21` `func main()` → `cmd.Execute(ctx, version, commit, date)` を呼ぶだけ。`version/commit/date` は GoReleaser がビルド時に埋める (`src/main.go:14-19`)
- module path の注意: `go.mod:1` は `module github.com/kubescape/kubescape/v3` のまま。タグは `v4.0.x` まで進んでいるが、HEAD のコード/import は `kubescape/v3/...` を使う（`main.go:11`）。メジャー版タグと go module major version が一致していない観測事実。

## 歴史の素材

- 2021-08: ARMO（イスラエル・テルアビブ）が Kubescape を公開。きっかけは NSA/CISA の Kubernetes Hardening Guidance。「そのガイダンスへの準拠を検証する世界初の OSS テストツール」として出した ([S4] [S5])。リポジトリ作成日は GitHub 上 2021-08-12 ([S1])。
- 2021-10: MITRE ATT&CK フレームワークと無料 SaaS を追加する大型アップデート ([S4])。
- 2022: ARMO が Series A で $30M 調達（"first fully open-source Kubernetes security platform"）([S11])。
- 2022-11/12: CNCF Sandbox 入り。CNCF project ページは採択日 2022-12-13、incubating ブログは "joined the Sandbox in November 2022" と表記（出典で日付が割れている。両方記録）([S2] [S3])。K8s セキュリティスキャナとして CNCF 初。
- 2025-01-13: CNCF TOC が Incubating 採択。2025-02-26 にブログ公開 ([S3] [S10])。
- 2026-03 (KubeCon EU 2026): Kubescape 4.0。Runtime Threat Detection と Kubescape Storage が GA。in-cluster の host-sensor（pop-up DaemonSet）を廃止し node-agent に統合。AI エージェント向けスキャン / KAgent プラグインを追加 ([S7] [S8])。作者は Ben Hirschberg（Core Maintainer）。

## アーキテクチャの素材

CLI（このリポジトリ）と in-cluster の microservices 群（別リポジトリ、`kubescape` org）に分かれる。本リポは CLI / スキャンエンジン本体。

トップレベル（`src/`）:

- `cmd/` … Cobra のコマンドツリー。`scan`（framework/control/workload/image）、`fix`、`patch`、`download`、`list`、`config`、`diff` など。
- `core/core/` … 各コマンドの実装本体。`scan.go`, `fix.go`, `patch.go`, `image_scan.go`, `download.go` など。`Kubescape` 型のメソッドが並ぶ。
- `core/pkg/` … エンジンの構成部品。`policyhandler`（ポリシー取得）、`resourcehandler`（K8s/ファイル収集）、`opaprocessor`（Rego/CEL 評価）、`resourcesprioritization`（attack track 優先度付け）、`score`、`containerscan`、`fixhandler`、`vapreconcile`（ValidatingAdmissionPolicy）、`reportcrypto`、`anonymizer`、`hostsensorutils`、`resultshandling`（printer/reporter）。
- `core/cautils/` … 共有データ構造と設定。`OPASessionObj`、`ScanInfo`、`getter/`（GitHub release からポリシー DL）。
- `core/meta/` … `IKubescape` インターフェース（CLI と core の境界）。
- `pkg/imagescan/` … Grype/Syft をラップした画像脆弱性スキャン。

主要外部依存（`go.mod`）: `open-policy-agent/opa v1.12.3`（Rego エンジン）、`anchore/grype v0.104.1` + `anchore/syft v1.42.3`（CVE/SBOM）、`sigstore/cosign/v3 v3.0.5`（署名検証 builtin）、`k8s-interface`/`opa-utils`（自前の共有ライブラリ）。

### 代表操作の end-to-end: `kubescape scan framework nsa`

1. `cmd/scan/framework.go:70` `RunE` … フラグ検証 → `scanInfo.SetScanType(ScanTypeFramework)` (`:122`)、`SetPolicyIdentifiers(frameworks, KindFramework)` (`:124`) → `ks.Scan(scanInfo)` (`:126`) → `results.HandleResults(...)` (`:131`) → 閾値判定（risk/compliance/severity/coverage）(`:135-144`)。
2. `core/core/scan.go:183` `(ks *Kubescape) Scan` … パイプラインの中枢。
   - `getInterfaces` (`:191` → 定義 `:43`) で k8s クライアント、tenant config、host scanner、resource handler、reporter、printer をまとめて構築。
   - ポリシー getter を設定 (`:209-212`)。`--keep-local` 等の air-gapped 判定は `isAirGappedMode` (`:397`)。
   - `policyhandler.NewPolicyHandler(...).CollectPolicies(...)` (`:232-233` / 定義 `core/pkg/policyhandler/handlepullpolicies.go:51`) → `scanData (*OPASessionObj)` を生成。
   - `resourcehandler.CollectResources(...)` (`:242` / 定義 `core/pkg/resourcehandler/handlerpullresources.go:18`) で K8s オブジェクト or YAML/JSON を収集し `scanData` に格納。
   - `opaprocessor.NewOPAProcessor(scanData, deps, ...)` (`:256`) → `ProcessRulesListener(ctxOpa, ...)` (`:258`)。ここが評価の本体。
   - 必要なら prioritization (`:264-275`)、画像スキャン (`:277-279`)。
   - `resultsHandling.SetData(scanData)` (`:281`)。`--encrypt` なら `reportcrypto`+`anonymizer.ApplyEncrypted` (`:283-318`)、`--hide` なら `anonymizer.Apply` (`:319-329`)。
3. `core/pkg/opaprocessor/processorhandler.go:83` `ProcessRulesListener` … `convertFrameworksToPolicies` (`:85`) で framework→control 平坦化 → `Process` (`:90`) → `BuildScanCoverage`/`ComputeCoverageScore` (`:98-99`) → `updateResults` (`:102`) → `ScoreWrapper.Calculate` (`:106-107`) → `reweightComplianceScores` (`:111`)。
4. `Process` (`:117`) … `policies.Controls` を 1 件ずつループ (`:129`)。`ControlTimeout>0` なら `context.WithTimeout` で囲み、超過時は `markControlTimedOut` して control を「未評価」に落とす（スキャン全体は止めない）(`:143-151`)。各 control の結果を `ResourcesResult` map にマージ (`:165-172`)。
5. `processControl` (`:200`) → 各 rule で `processRule` (`:242`)。`getAllSupportedObjects` (`:248`) で rule の対象 GVR に該当するリソースだけ抽出 → `RegoResourcesAggregator` (`:254`) → `enumerateData` (`:271`, `:568`) → `runOPAOnSingleRule` (`:287`)。
6. `runOPAOnSingleRule` (`:494`) … `rule.RuleLanguage` で分岐。`Rego`/`RegoLanguage2` → `runRegoOnK8s` (`:497`)、`CEL` → `runCELOnK8s` (`:499`)。CEL は HEAD ではスタブで `not yet implemented` を返す (`:507-509`)。
7. `runRegoOnK8s` (`:512`) … 初回だけ `opaRegisterOnce` で cosign 系 Rego builtin を登録 (`:513-517`)、`getCompiledRule`（コンパイル結果をキャッシュ）(`:520`)、`ruleRegoDependenciesData.TOStorage()` で control 設定を OPA store 化 (`:525`) → `regoEval` (`:530`)。
8. `regoEval` (`:544`) … leaf。`rego.New(...)` で `rego.SetRegoVersion(ast.RegoV0)`（Rego v0 構文に固定）、`rego.Query("data.armo_builtins")`、`rego.Input(inputObj)`、`rego.Store(*store)` → `rego.Eval(ctx)` (`:556`) → `reporthandling.ParseRegoResult` (`:560`)。

### 設計判断

- ポリシーはコードに埋めず GitHub release から取得する（`core/cautils/getter`、`scan.go:205` `NewDownloadReleasedPolicy`）。controls 本体は別リポ `kubescape/regolibrary`。スキャナとポリシーを分離し、CLI を再ビルドせずに NSA/CISA・MITRE・CIS のルール更新を配れる。`--keep-local`/`--use-from` で air-gapped に倒せる (`scan.go:397`)。
- per-control timeout を context で実装し、超過 control を「未評価」として coverage に計上する（全体を落とさない）。`ScanCoverage`/`PolicyDegradations` でフォールバック発生も追跡し、`--fail-on-degraded-config` でゲートにできる (`processorhandler.go:98`, `cmd/scan/framework.go:215`)。

## 内部実装の素材

### 中核データ構造

- `core/cautils/datastructures.go:49` `OPASessionObj` … スキャン 1 回分の全状態を持つ巨大コンテキスト。`K8SResources`（GVR→resourceID）、`AllResources`（ID→リソース実体）、`ResourcesResult`（ID→評価結果）、`Policies`（framework 群）、`AllPolicies`（平坦化した control マップ）、`Report`（出力 v2）、`ScanCoverage`、`VAPPolicies`/`VAPBindings` など。`NewOPASessionObj` (`:80`) はクラスタ規模を見積もって map を事前確保（`estimateClusterSize`, `:101`）。
- `core/cautils/scaninfo.go:102` `ScanInfo` … CLI フラグの集約。format、threshold 群、`PolicyGetter`/`ControlsInputsGetter`/`ExceptionsGetter`/`AttackTracksGetter`、scan type、air-gapped 系フラグ。CLI 層と core 層の受け渡し単位。
- `core/pkg/opaprocessor/processorhandler.go:44` `OPAProcessor` … `*OPASessionObj` を埋め込み、`compiledModules`（ルールコンパイルキャッシュ、`compiledMu` で保護）、`TimedOutControls`、cosign builtin 登録の `opaRegisterOnce`、`ControlTimeout` を持つ。
- `K8SResources` / `ExternalResources`（`datastructures.go:22-24`）… `map[<apigroup/version/resource>][]<resourceID>` の型エイリアス。rule の対象 GVR から該当リソースを引く索引。
- `ImageScanData`（`datastructures.go:26-35`）… Grype/Syft の結果（`Matches`、`Packages`、`SBOM`、`VulnerabilityProvider`）を束ねる。posture スキャンと画像スキャンが同じ結果ハンドラに同居する。

### 追う価値のあったパス / 非自明な点

- `regoEval` が `rego.SetRegoVersion(ast.RegoV0)` で OPA v1 ライブラリを使いつつ Rego v0 構文に固定している (`processorhandler.go:546`)。regolibrary の既存ルール互換のため。OPA 本体は v1 構文がデフォルトなので、ここを見落とすとルールが壊れる。
- cosign の署名検証を Rego の組み込み関数として登録している (`processorhandler.go:513-517`、実装 `cosign_verify.go`/`cosign_has_signature.go`)。`cosign_verify(image, key)` 等を Rego ポリシーから直接呼べる。これにより「image が署名済みか」をポリシー言語の中で表現する。
- rule 言語の二系統（Rego / CEL）が `runOPAOnSingleRule` で分岐 (`:494-503`)。`core/pkg/opaprocessor/cel/env.go` に CEL 環境はあるが、評価器 `runCELOnK8s` は HEAD ではスタブ (`:507-509`、コメントに `kubescape/kubescape#2001`)。CEL 移行は進行中。
- スコアが 2 系統: risk-score（高いほど悪い、`FailThreshold` 上限）と compliance-score（高いほど良い、`ComplianceThreshold` 下限）。`cmd/scan/framework.go:135-139` で両方を別方向にゲートする。

## 採用事例の素材

出典 = `kubescape/project-governance` の中央 ADOPTERS.md（CLI リポの `ADOPTERS.md` はそこへリダイレクト）([S6])。

- Well-Known Companies として記載: AWS / Energi Danmark / Gitpod / Intel / Orange Business / Rabobank / VMWare(Bitnami)。
- ユースケース付き Users: Cox Communications「3,000 アプリの CI パイプラインで K8s ベストプラクティスのセキュリティ解析」、Swisscom AG「CIS フレームワークで Helm chart / manifest をスキャン」、Schwarz IT (SIT)「エッジ k8s クラスタの継続的コンプライアンス」、Fusioncore.ai「Software Bill of Behavior」、ARMO「脆弱性モニタリング」。

採用シグナル（2026-06-24 時点、GitHub API 実測）([S1]):

- stars 11,492 / forks 950 / open issues 72 / created 2021-08-12。
- contributors: GitHub contributors API（anon 込み）で末尾ページ 205 ≒ 約 205 名規模。
- 最新リリース `v4.0.9`（2026-05-29 公開）。
- ディストリビューション: Homebrew / Krew / Chocolatey / `install.sh` / Helm（in-cluster）/ GitHub Action / VS Code 拡張。OpenSSF Best Practices (#6944) と Scorecard バッジあり（README）。

## 代替・エコシステム

同 org の関連リポ（`gh repo list kubescape` 実測, [S1]）:

- `regolibrary`（★131）… Kubescape が使う control 群（NSA/CISA・MITRE・CIS）。スキャナと分離された本体。
- `node-agent`（★35）… eBPF ランタイムエージェント。4.0 で host-sensor を吸収。
- `operator` / `kubevuln` / `kollector` / `storage` / `gateway` / `synchronizer`（in-cluster microservices）。`helm-charts` で配備。
- `cel-admission-library`（★79）… VAP 用の既製ポリシー。`vscode-kubescape` / `lens-extension` / `headlamp-plugin` / `github-action` で IDE/CI 統合。

統合先: Grype/Syft（CVE/SBOM）、Cosign/Sigstore（署名検証）、Copacetic（`kubescape patch` の image patch）、Inspektor Gadget（README が eBPF ランタイム監視として言及）、Prometheus exporter。

代替（実際の差。strawman にしない）:

- Trivy (Aqua) … アーティファクト横断スキャナ（image/IaC/SBOM/secret）。misconfig も自前チェックで持つ。Kubescape は posture をフレームワーク (NSA/CISA/MITRE/CIS) 準拠と risk/compliance スコアに寄せ、画像スキャンは Grype を内蔵する点が違う。
- kube-bench (Aqua) … CIS Kubernetes Benchmark のノードレベル検査に特化。Kubescape は CIS を含むが workload/manifest/Helm/IDE/CI まで広く、remediation や VAP 生成も持つ。
- Checkov / Polaris … IaC・マニフェストの静的チェック中心。ランタイムや in-cluster オペレータは守備範囲外。
- Falco (CNCF Graduated) … ランタイム脅威検知に特化。Kubescape は posture + 脆弱性 + ランタイム（node-agent）を 1 プラットフォームに束ねる方向で、Falco とは補完寄り。

## tagline 案

- EN: Open-source Kubernetes security platform for misconfiguration, vulnerability, and runtime scanning from IDE to running cluster.
- JA: IDE からクラスタまでをカバーする Kubernetes セキュリティの OSS プラットフォーム。構成・脆弱性・ランタイムを一気通貫でスキャンする。
