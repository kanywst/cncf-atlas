# recon: Open Policy Agent (OPA)

調査メモ。密度優先。出典は URL 付き。path:line は pin した commit のもの。

## 基本情報

- repo: `open-policy-agent/opa`（メイン実装。CNCF landscape の Security & Compliance）
- pinned commit: `f75131f0e5932d24a76e638021ec66a8f07630fc`（2026-06-18, main ブランチ）
- 近いタグ: `v1.17.1`（リリース済み最新）。ソース内 `var Version = "1.18.0-dev"`（`v1/version/version.go`）なので pin は v1.17.1 と v1.18.0 の間の dev HEAD
- 言語 / ビルド: Go（`go.mod` の `go 1.25.0`、module `github.com/open-policy-agent/opa`）/ `make build`（= `go-build`、`Makefile:103`）。単一バイナリ `opa`
- 主エントリポイント: `main.go:22` の `cmd.RootCommand.Execute()`。`RootCommand` は `cmd/commands.go:14` で定義
- ライセンス: Apache-2.0（`LICENSE` 冒頭が "Apache License Version 2.0" を明記。GitHub API も `spdx_id: Apache-2.0`）
- CNCF 成熟度: Graduated（2021-01-29 graduate、2021-02-04 公表）
- カテゴリ（このリポの tools.ts バケット）: Identity & Policy（汎用ポリシーエンジン / authz が本質。K8s 専用ではない）

## 歴史の素材

- 2016 年 Styra 社内で Tim Hinrichs / Torin Sandall / Teemu Koponen が開発。policy をコードから分離し authz を統一する狙い。出典: [Styra OPA 101](https://www.styra.com/blog/open-policy-agent-101-a-beginners-guide/)
- CNCF 受け入れ 2018-03-29（Sandbox）→ 2019-04-02 Incubating → 2021-01-29 Graduated。CNCF 15 番目の graduate で「authz に特化した最初の」graduate。出典: [CNCF project page](https://www.cncf.io/projects/open-policy-agent-opa/)、[CNCF graduation 発表](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/)、[InfoQ](https://www.infoq.com/news/2021/02/opa-cncf-graduation/)
- ポリシー言語 Rego（"ray-go"）。階層データに対する宣言的クエリ言語。OPA は library / sidecar / daemon として動く。出典: [openpolicyagent.org docs](https://www.openpolicyagent.org/docs)
- 2024-12 OPA 1.0 リリース。最初の commit から 8 周年、5000+ commit / 400+ contributor。破壊的変更: `if`/`contains` 必須化、`every`/`in` が import 不要、サーバが既定で localhost バインド（policy 漏洩対策）。`rego.v1` import は 1.0 以降 no-op。出典: [OPA 1.0 ブログ](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368)、[v1.0.0 release notes](https://github.com/open-policy-agent/opa/releases/tag/v1.0.0)
- 2025-08 創設者 3 名（Teemu Koponen / Tim Hinrichs / Torin Sandall）と Styra エンジニア数名が Apple に移籍。実質 acquihire（Styra 社は wind down、正式買収の公開 filing なし）。OPA 本体は CNCF ガバナンス下のまま、maintainer リストも不変と本人らが明言。Styra の商用資産（Enterprise OPA / OPA Control Plane / Regal linter / 各 SDK）は OSS 化。一次出典: [創設者からのコミュニティ向けノート（blog.openpolicyagent.org）](https://blog.openpolicyagent.org/note-from-teemu-tim-and-torin-to-the-open-policy-agent-community-2dbbfe494371)。補足: [Cloud Native Now](https://cloudnativenow.com/features/apple-buys-styra-brains-opa-remains-open/)、[Open Source For You](https://www.opensourceforu.com/2025/08/apple-acquires-open-policy-agent-developers-while-cncf-retains-control-of-open-source-project/)

## アーキテクチャの素材

トップレベルは Go パッケージ群。実装本体は `v1/` 配下にあり、ルートの `rego/` `ast/` `topdown/` 等は型エイリアスで `v1/*` を再公開する薄い shim（後述の設計判断）。

主要コンポーネント:

- `cmd/` — CLI サブコマンド（`eval` `run` `test` `build` `fmt` `check` `bench` `exec` ほか）。`cmd/commands.go:14` の `RootCommand` に cobra で束ねる
- `v1/ast/` — Rego のパーサ / コンパイラ / 型チェック。`parser.go` `compile.go` `term.go` `policy.go`
- `v1/topdown/` — 評価エンジン本体（top-down 評価 + 単一化）。`eval.go` `query.go` `bindings.go`、組み込み関数は同ディレクトリ多数（`http.go` `crypto.go` `glob.go` ...）
- `v1/rego/` — 高レベル評価 API（`rego.New().Eval()`）。コンパイル〜評価の orchestration
- `v1/server/` — REST PDP。`/v1/data/...` GET/POST（`server.go:1512` `v1DataGet` / `:1741` `v1DataPost`）、デフォルト decision path
- `v1/storage/` — データストア抽象（`interface.go:20` `Store`）。in-memory 実装あり
- `v1/bundle/` — bundle（policy + data の配布単位）の読込 / 署名 / 検証
- `v1/sdk/` `v1/plugins/` — 埋め込み SDK と decision log / bundle download / status などプラグイン
- `wasm/` `v1/ir/` `v1/compile/` — Rego を WASM / IR にコンパイルするターゲット

リクエストの流れ（PDP として）: HTTP `/v1/data/<path>` から `v1/server/server.go` の handler へ。入力 `input` を ast 値化して `rego` API 経由で query 評価し JSON 結果を返す。組み込みライブラリ利用時は `rego.New(...).Eval()` が同じ経路に入る。

## 内部実装の素材

### 代表操作の end-to-end トレース: Rego ポリシーを 1 回評価する

1. 構築: `rego.New(opts...)` → `v1/rego/rego.go:1414`。query / modules / store / input をオプションで受ける
2. `(*Rego).Eval` → `v1/rego/rego.go:1502`。txn を開き `PrepareForEval` を呼ぶ

   ```go
   pq, err := r.PrepareForEval(ctx)
   // ...
   rs, err := pq.Eval(ctx, evalArgs...)
   ```

3. `PrepareForEval` → `v1/rego/rego.go:1788`。Rego をパース / コンパイルし `compiledQueries[evalQueryType]` を準備（パース・コンパイルはここで一度だけ。再評価で使い回せる）
4. `PreparedEvalQuery.Eval` → `v1/rego/rego.go:559`。eval context を作り `compiledQuery` をセットして `pq.r.eval` へ委譲

   ```go
   ectx.compiledQuery = pq.r.compiledQueries[evalQueryType]
   return pq.r.eval(ctx, ectx)
   ```

5. `(*Rego).eval` → `v1/rego/rego.go:2309`。target（rego / wasm / plugin）で分岐。既定の rego target では `topdown.NewQuery(...)` を builder パターンで組む（`:2326` 以降で compiler / store / txn / builtins / cache を注入）
6. `(*Query).Iter` → `v1/topdown/query.go:565`。compiler にエラーがあれば中断し、`eval{}` 構造体を初期化（`bindings` `virtualCache` `baseCache` `builtins` などを束ねる）
7. 評価ループ: `(*eval).eval` → `v1/topdown/eval.go:404` が `evalExpr`（`:408`）から `evalStep`（`:461`）を回す。`e.index >= len(e.query)` で全 expr 消化なら `iter(e)` で解を yield。`findOne` 時は `earlyExitError` で枝刈り
8. 単一化: `(*eval).biunify` → `v1/topdown/eval.go:1134` が双方向単一化（bi-unification）で変数束縛を解決

非自明な最適化が随所にある。例: `evalStep`（`v1/topdown/eval.go:461` 付近）に tracing 有無でほぼ同一の分岐が 2 本あり、コメントが「trace 時は `defined` bool が heap escape して大量 alloc するため意図的に分けた」と明記。性能のための重複。

### 中核データ構造

- `Term` — `v1/ast/term.go:315`。`{ Value Value; Location *Location }`。AST の最小単位
- `Value`（interface）— `v1/ast/term.go:61`。`Compare / Find / Hash / IsGround / String` を要求。実装は `Var`（`:1148`）`Ref`（`:1215`）`Object`（`:2130`）など
- `Module` / `Rule` / `Head` / `Body` — `v1/ast/policy.go:193 / :227 / :245 / :263`。`Module` は `Package + Imports + Rules + Annotations`。`Rule` は `Default / Head / Body / Else`、親 `Module` への back-pointer を持つ（JSON では `-`）
- `bindings` — `v1/topdown/bindings.go:32`。`{ id uint64; values bindingsArrayHashmap; instr }`。少数なら配列、超えたら map に切替える adaptive 表現（`newBindingsWithSize` のコメント参照）。評価中の変数束縛を保持
- `Store`（interface）— `v1/storage/interface.go:20`。base document（外部データ）への txn 付き read/write 抽象。policy 評価と data を分離する境界

### 非自明な設計判断: v1 shim レイアウト

ルートの `rego/rego.go` は実装ではなく `v1/rego` への型エイリアス再公開（`type EvalContext = v1.EvalContext` 等、`rego/rego.go` 冒頭）。`ast/` `topdown/` 等も同様。OPA 1.0 で Rego の既定言語を v0 から v1 に切り替える際、import path を壊さずに新旧両系統を共存させるための層。利用者は `github.com/open-policy-agent/opa/rego` を使い続けつつ、新コードは `v1/` に集約される。

## 採用事例の素材

`ADOPTERS.md`（pin commit 時点）に公開言及ベースで多数記載。著名どころ（ファイル内に項目あり、各々リンク付き）:

- Atlassian — heterogeneous cloud で microservice API authz、Slauth(AAA) に組込み、policy を S3 配布
- Netflix / Goldman Sachs / Pinterest / T-Mobile — CNCF graduation 発表でも production 利用として名指し
- Capital One / Chef / Cloudflare / Tripadvisor / SAP — `ADOPTERS.md` 記載
- Appsflyer — 数百の microservice の authz を中央 OPA に委譲（Engineering Blog 出典付き）
- Bisnode (Dun & Bradstreet) — microservice authz / K8s authz / admission control / CI-CD、JVM 連携ツール公開

出典: [ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md)、[CNCF graduation 発表](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/)。捏造なし、全てファイル / 発表に裏付けあり。

採用シグナル（数値、参照日 2026-06-23、GitHub API）: star 11,884 / fork 1,595 / watcher 131 / open issue 366。graduation 時点で 90+ contributor / 約 30 org、maintainer は Google / Microsoft / VMware / Styra の 4 社（出典: CNCF 発表）。OPA 1.0 時点で 5000+ commit / 400+ contributor（出典: OPA 1.0 ブログ）。

## 代替・エコシステム

エコシステム / 統合:

- OPA Gatekeeper — OPA を K8s admission controller として CRD で運用する別プロジェクト（Google/Microsoft 発、CNCF 寄贈）。OPA の代替ではなく上に乗る層
- Envoy / Istio — 外部 authz（ext_authz）で OPA を sidecar PDP に。API authz の定番
- conftest / Terraform / CI-CD — IaC・パイプラインの policy gate
- 配布形態: bundle（policy+data を HTTP/OCI で pull）、decision log、status plugin

実際の代替と本質的差:

- Kyverno（CNCF Incubating）— K8s 専用、policy が YAML の K8s リソース。mutation / generation 対応。OPA/Gatekeeper は validation 中心で Rego 学習コスト高。Kyverno は軽量（単一 controller pod 傾向）、OPA は cross-platform で表現力が高い。出典: [Nirmata 比較](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/)、[policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/)
- AWS Cedar / Amazon Verified Permissions — アプリ層 authz 言語。OPA の汎用 authz と領域が重なるが K8s admission ではなくアプリ認可寄り
- 本質差: OPA は特定領域に縛られない汎用 policy エンジン + Rego。K8s だけなら Kyverno の方が低学習コスト、スタック横断で policy を統一したいなら OPA

## install + 最小構成

```bash
# macOS (Homebrew)
brew install opa

# あるいはバイナリ直 (Linux amd64)
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64_static
chmod +x opa
```

最小評価（CLI）:

```bash
opa eval -d policy.rego -i input.json "data.example.allow"
```

REST サーバとして:

```bash
opa run --server
# 別端末から
curl localhost:8181/v1/data/example/allow -d @input.json
```

注意: OPA 1.0 以降サーバは既定で localhost バインド。外部公開は `--addr` 明示が必要。出典: [openpolicyagent.org docs](https://www.openpolicyagent.org/docs)、[OPA 1.0 ブログ](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368)。

## ガバナンス補足

`GOVERNANCE.md` は組織投票（organizational voting）モデル。1 org = 1 票で単一企業が領域を支配しないようにする。maintainer は area of expertise（リポ / サブツリー）単位で、新任は既存 maintainer の推薦 + 2/3 org 多数で選出、1 年で期限切れ（自己更新可）。steering committee 型ではない。出典: [GOVERNANCE.md](https://github.com/open-policy-agent/opa/blob/main/GOVERNANCE.md)、[MAINTAINERS.md](https://github.com/open-policy-agent/opa/blob/main/MAINTAINERS.md)。
