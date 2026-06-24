# recon: Kyverno

調査メモ。Kubernetes ネイティブの Policy-as-Code エンジン。policy 自体が Kubernetes リソース (YAML)。出典は URL + `path:line` で残す。

## 基本情報

- repo: `kyverno/kyverno` ([github.com/kyverno/kyverno](https://github.com/kyverno/kyverno))
- pinned commit: `989e001817e9f860dc89a610b2a2ddb1a27d3a74` (committer date 2026-06-20) / 直近リリースタグ: `v1.18.1` (2026-05-18 公開)
- 言語 / ビルド: Go (`go 1.26.2`, `go.mod:3`) / `make build-kyverno` (`Makefile:259-261`)。コンテナは `ko` でビルド。
- ライセンス: Apache-2.0 (`LICENSE:1` に Apache License Version 2.0、`NOTICE` あり。GitHub API も `Apache-2.0`)
- CNCF 成熟度: Graduated (2026-03-16 graduate)
- カテゴリ (本エンジンのバケット): Security & Compliance
- main entrypoint: `cmd/kyverno/main.go` (admission controller 本体)。他に `cmd/cli` (kubectl-kyverno)、`cmd/background-controller`、`cmd/cleanup-controller`、`cmd/reports-controller` の複数バイナリ構成。

新しい CEL ベース CRD の Go 型は別モジュール `github.com/kyverno/api` に切り出されている (`cmd/kyverno/main.go:14` で `policiesv1beta1 "github.com/kyverno/api/api/policies.kyverno.io/v1beta1"` を import)。旧来の `api/kyverno/v1` (ClusterPolicy 系) は本リポ内に残る。

## 歴史の素材

- 出自: Nirmata が作成し 2020 年に CNCF へ寄贈。"Kyverno" はギリシャ語で「統治する (to govern)」の意 ([CNCF graduation announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/))。
- マイルストーン: CNCF Sandbox 受理 2020-11-10 → Incubating 2022-07-13 → Graduated 2026-03-16。KubeCon + CloudNativeCon EU (Amsterdam) 2026-03-24 に graduation 発表。同時に Cilium / Envoy / Falco / Jaeger の 10 周年と並ぶ ([CNCF announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/))。
- graduation 要件: サードパーティセキュリティ監査 + CNCF TAG Security & Compliance 主導のセキュリティ評価を通過。TOC sponsor は Karena Angell。
- 技術的方向性: 最新リリースで CEL (Common Expression Language) を全面採用し、Kubernetes ネイティブ admission control (ValidatingAdmissionPolicy) の将来方向に整合。`v1.18` で SSRF パッチ + CEL 推進 + `ClusterPolicy` の段階的縮小 ([Announcing Kyverno 1.18](https://www.cncf.io/blog/2026/05/05/announcing-kyverno-release-1-18/))。

## アーキテクチャの素材

複数コントローラ構成。`pkg/` 直下に admission 系のサブシステムが並ぶ:

- `pkg/webhooks` — admission webhook サーバ。HTTP ルーティングの中心。
- `pkg/engine` — policy 評価エンジン (validate / mutate / generate / verifyImages)。
- `pkg/cel` — 新しい CEL ベースの policy 群 (`vpol` ValidatingPolicy, `mpol` MutatingPolicy, `ivpol` ImageVerificationPolicy, `gpol` GeneratingPolicy)。`cmd/kyverno/main.go:24-31` で各 CEL エンジンを import。
- `pkg/controllers` — policycache / policystatus / certmanager / webhook 登録 / globalcontext などの reconcile ループ。
- `pkg/policycache`, `pkg/autogen`, `pkg/exceptions`, `pkg/background`, `pkg/metrics`, `pkg/tls` — 補助系。

webhook サーバのルーティング (`pkg/webhooks/server.go:76-180`): CEL policy 用に `/mpol/...`, `/vpol/...`, `/ivpol/validate/*policies`, `/ivpol/mutate/*policies`, `/gpol/...` を `mux.HandlerFunc` で登録。旧来の `ClusterPolicy` 用は `registerWebhookHandlersWithAll` で `resourceHandlers.Mutation` / `.Validation` をまとめて登録 (`server.go:182-213`)。各 handler は `handlerFunc(...).ToHandlerFunc(...)` でメトリクス・トレース・filter を被せたチェーンになる。

### 代表操作: ValidatingWebhook の admission request を 1 本通す

1. API server が admission request を webhook へ POST。`pkg/webhooks/handlers/admission.go` の admission middleware が `AdmissionRequest` を組み立て、`resourceHandlers.Validation` を呼ぶ。
2. `pkg/webhooks/resource/handlers.go:112` `func (h *resourceHandlers) Validate(...)`。`retrieveAndCategorizePolicies` (`handlers.go:236`) で match した policy を validate / mutate / generate / auditWarn に分類 (`handlers.go:117`)。
3. `validation.NewValidationHandler(...)` を作り (`handlers.go:128`)、`vh.HandleValidationEnforce(...)` を goroutine で実行 (`handlers.go:144-146`)。dry-run でなければ generate / mutateExisting を background へ (`handlers.go:147-150`)。
4. `pkg/webhooks/resource/validation/validation.go:74` `HandleValidationEnforce`。`buildPolicyContextFromAdmissionRequest` で `PolicyContext` を構築 (`validation.go:88`)、policy ごとに `tracing.ChildSpan` 内で `v.engine.Validate(ctx, policyContext)` を呼ぶ (`validation.go:107`)。`engineResponse.IsSuccessful()` が false なら失敗扱い (`validation.go:115`)。
5. 集約後 `webhookutils.BlockRequest(engineResponses, failurePolicy, logger)` で deny 判定 (`validation.go:148`)。block なら `validation.go:152` で deny メッセージ返却。pass なら `handlers.go:177` で `ResponseSuccess`。audit report は `handlers.go:158` で別 goroutine + 30s timeout context に逃がす (HTTP ライフサイクルから切り離す)。
6. `pkg/engine/engine.go:68` `func (e *engine) Validate(...)`: `internal.MatchPolicyContext` で対象一致確認 (`engine.go:75`) → `e.validate(...)` (`engine.go:76`) → `WithStats` でレイテンシ記録 (`engine.go:79`) → metrics があれば `RecordResponse` (`engine.go:81-83`)。
7. `pkg/engine/validation.go:16` `func (e *engine) validate(...)`: `autogen.Default.ComputeRules(policy, gvk.Kind)` で rule 展開 (`validation.go:30`) し、各 rule につき `handlerFactory` が rule 種別から適切な handler を選ぶ (`validation.go:33-71`)。Assert / verifyManifest / PodSecurity / CEL / 通常 (`NewValidateResourceHandler`, `validation.go:58`) を分岐。`e.invokeRuleHandler(...)` で実行 (`validation.go:72`)、`PolicyResponse` に積む。`JSONContext().Checkpoint()` / `Restore()` で rule 間の変数汚染を防ぐ (`validation.go:26-27`)。

### 非自明な設計判断: autogen (Pod controller への rule 自動生成)

`pkg/autogen/v1/autogen.go:207` `ComputeRules`。Pod を対象に書いた 1 rule から、Deployment / DaemonSet / StatefulSet / Job / CronJob など pod-controller 向けの rule を実行時に自動展開する。`spec` から `CanAutoGen` で対象コントローラ集合を決め (`autogen.go:213`)、annotation `pod-policies.kyverno.io/autogen-controllers` (`autogen.go:220`) で実際の対象を上書き可能。これにより policy 作者は Pod だけ書けば controller の template spec まで網羅できる。autogen は `v1` と `v2` の 2 実装が併存し (`pkg/autogen/v1`, `pkg/autogen/v2`)、`v2` は `ComputeRules` が `ExtractPodFunc` も返す新シグネチャ (`pkg/autogen/v2/autogen.go:303`)。

## 内部実装の素材

中核データ構造:

- `Rule` (`api/kyverno/v1/rule_types.go:45`): 1 つの rule が `Mutation` / `Validation` / `Generation` / `VerifyImages` のいずれかを持つ統合構造。`MatchResources` (`rule_types.go:62`) と `ExcludeResources` (`rule_types.go:68`) で適用条件、`Context` (`rule_types.go:52`) で変数・データソース、`RawAnyAllConditions` (preconditions, `rule_types.go:83`) と CEL 版 `CELPreconditions` (`rule_types.go:88`) を持つ。`HasMutate` / `HasValidate` / `HasValidatePodSecurity` / `HasValidateCEL` などの述語メソッド群が engine の分岐に直結。
- `Spec` (`api/kyverno/v1/spec_types.go:51`): ClusterPolicy / Policy の本体。`GetApplyRules()` (ApplyOne で最初に当たった rule で打ち切り, `validation.go:83`)、`GetFailurePolicy()` (Fail / Ignore) を提供。
- `EngineResponse` (`pkg/engine/api/engineresponse.go:15`): 1 policy の評価結果。`Resource` / `PatchedResource` (mutate 後) / `PolicyResponse` / `stats` を保持。`NewEngineResponseFromPolicyContext` (`engineresponse.go:38`) で生成。
- `RuleResponse` (`pkg/engine/api/ruleresponse.go:25`): rule 単位の結果。`status` (`RuleStatus`)、`ruleType` (Mutation/Generation/Validation)、`message`、`generatedResources`、`patchedTarget`、`podSecurityChecks`、`exceptions`、`vapBinding`/`mapBinding` (Kubernetes ネイティブ VAP/MAP 連携)、`emitWarning` (warning header へ流す) を持つ。
- `Engine` interface (`pkg/engine/api/engine.go:17`): `Validate` / `Mutate` / `Generate` / `VerifyAndPatchImages` / `ApplyBackgroundChecks` / `ContextLoader` の 6 メソッド。policy 適用の全エントリがここに集約。

追う価値のあるパス:

- CEL policy エンジン: `pkg/cel/policies/vpol/engine` (ValidatingPolicy) が Kubernetes の ValidatingAdmissionPolicy と整合する新経路。旧 `ClusterPolicy` (JMESPath + YAML overlay) からの移行先。
- background controller: generate / mutateExisting は admission 同期では完結させず `pkg/background` + UpdateRequest CRD 経由で非同期適用 (`handlers.go:149` の `handleBackgroundApplies`)。
- context loader: `pkg/engine/engine.go:164` `ContextLoader`。rule の `Context` エントリ (ConfigMap / APICall / ImageRegistry / GlobalContext) を JMESPath context にロード。

## 採用事例の素材

出典付き組織名のみ。本リポ `ADOPTERS.md` (公開済みのみ列挙) と CNCF announcement から:

- LinkedIn: Kubernetes admission control パイプラインの中核。230+ クラスタ / 500K+ ノード、新言語を学ばずに policy を保守、ストレス下で 20K admission req/min を劣化なく処理 ([CNCF announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/))。`ADOPTERS.md` にも LinkedIn (on-prem クラスタの policy enforcement) として記載。
- Coinbase: mutation + 手書き webhook 置換 + namespace への共通オブジェクト generation (`ADOPTERS.md`)。
- Bloomberg: 内製 Kubernetes プラットフォームのカスタム validation/mutation webhook 置換 (`ADOPTERS.md`)。
- その他 `ADOPTERS.md` 記載: Mandiant, Giant Swarm, Vodafone Group, Deutsche Telekom, T-Systems, Red Hat (RHACM 連携), Saxo Bank, Wayfair, Yahoo, Velux, Groww (CIS compliance), Ohio Supercomputer Center, Arrikto (Kubeflow), VSHN/APPUiO ほか。
- maintainer は 6 組織にまたがる (Nirmata, Chainguard, Cloudflare ほか)。contributor 3,624 名 / 1,063 組織と announcement が主張 ([CNCF announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/))。
- GitHub stats (2026-06-22, GitHub API): stars 7,859 / forks 1,402。

## 代替・エコシステム

- 直接の代替: OPA Gatekeeper (OPA + Rego ベースの admission controller)。本質差は「Rego という別言語 vs Kyverno は policy が Kubernetes YAML リソース」。Gatekeeper は ConstraintTemplate + Constraint の 2 段構造、Kyverno は単一 CRD。Gatekeeper は validation/mutation 中心で generation と image verification はネイティブ非対応、Kyverno は generate / image verify をネイティブ提供 ([Nirmata comparison](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/), [policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/))。
- フットプリント差: Gatekeeper ~270MB (controller+audit) 対 Kyverno ~600MB (4 コントローラ) という比較あり ([policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/))。数値は出典ブログの計測値で公式保証ではない点に注意。
- 隣接: Kubernetes ネイティブの ValidatingAdmissionPolicy / MutatingAdmissionPolicy (CEL)。Kyverno はこれを置換せず、CEL ベース policy で連携・補完する方向 (`RuleResponse.vapBinding`/`mapBinding`)。
- 統合先: Argo CD, Flux (GitOps で policy 配布), Backstage, RHACM。image verification は Sigstore/cosign 連携。
- 補助プロジェクト: kyverno/policies (policy ライブラリ), kubectl-kyverno CLI (`cmd/cli`), policy-reporter (PolicyReport CRD 可視化)。

## インストール / 最小構成

- Helm: `helm repo add kyverno https://kyverno.github.io/kyverno/` → `helm install kyverno kyverno/kyverno -n kyverno --create-namespace`。
- もしくは `kubectl apply -f https://github.com/kyverno/kyverno/releases/download/v1.18.1/install.yaml`。
- 最小動作確認: ClusterPolicy を 1 つ apply (例: 全 Pod に label 必須を validate, `validationFailureAction: Enforce`) → label 無しの Pod 作成が admission で deny されることを確認。公式 Quick Start は README からリンク ([kyverno.io quick start](https://kyverno.io/docs/introduction/))。
