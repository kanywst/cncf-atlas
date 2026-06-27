# recon: Cedar

調査メモ。Cedar は認可 (authorization) のためのポリシー言語と評価エンジン。AWS 発、現 CNCF Sandbox。出典は sources.md の番号 (src N) と対応。path:line は `research/cedar/src` 配下の実ファイルで確認済み。

## 基本情報

- repo: `cedar-policy/cedar` (src 1)
- pinned commit: `991bacf654bf089bd3eec65351581ed4686923d0` (2026-06-25, "Fix clippy lints (#2436)")
- 近いタグ: `v4.11.2` (2026-06-22 公開, src 9)。HEAD はこのリリース後のコミット。in-tree の `workspace.package.version` は `4.11.0` (`Cargo.toml`)。CLI は `tag-namespace = "cedar-policy-cli"` で別系統タグを持つ
- 言語 / ビルド: Rust (edition 2021, MSRV `rust-version = "1.89"`, `Cargo.toml`) / `cargo build --release`
- ライセンス: Apache-2.0 (`LICENSE` 冒頭 "Apache License Version 2.0"、`Cargo.toml` の `license = "Apache-2.0"`、`NOTICE` は "Copyright Cedar Contributors")。検証済み (src 1)
- CNCF 成熟度: Sandbox (受理 2025-10-08, src 2)
- カテゴリ: Identity & Policy
- 規模: Rust 約 215k 行 (`find . -name '*.rs' | xargs wc -l`)、うち `cedar-policy-core` 約 124k 行。GitHub stars 1,571 / forks 160 / contributors 61 (非匿名, gh API, 2026-06-27 取得, src 1)

ワークスペース構成 (`Cargo.toml` の `[workspace].members`):

- `cedar-policy`: アプリが依存する公開 SDK。認可と検証の API (src 1, README:42)
- `cedar-policy-core`: パーサ・評価器・型検査器など中核 (internal, README:47)
- `cedar-policy-symcc`: 記号コンパイラ (symbolic compiler)。ポリシーの性質を SMT で検証し反例を返す (README:43)
- `cedar-policy-cli`: `cedar` コマンド (README:44)
- `cedar-language-server`: Language Server Protocol 実装 (README:45)
- `cedar-wasm`: JavaScript / TypeScript 向け wasm インターフェース (README:46)
- `cedar-policy-formatter`, `cedar-testing`: 整形と統合テスト (README:48-49)

## 用語

- 認可 (authorization): 認証済みの主体が特定の操作を行ってよいかの判定。Cedar は principal / action / resource / context の 4 要素タプルに対し決定を返す。
- RBAC / ABAC / ReBAC: ロールベース / 属性ベース / 関係ベースのアクセス制御。Cedar はこの 3 つを 1 言語で表現できる (src 3, src 6)。
- DSSE 等は本プロジェクトに無関係。出てこない。

## 歴史の素材

- 2023-05-10: AWS が Cedar 言語と SDK を Apache-2.0 で OSS 化 (src 4, src 5)。社内認可基盤の数年の蓄積が起源で、Amazon Verified Permissions と AWS Verified Access のエンジンとして開発されていた (src 5)。
- 設計手法: verification-guided development。認可エンジンを形式モデル化し、自動推論で安全性 (例 "deny trumps allow") を証明し、Rust 実装がモデルに一致することを差分テスト (differential testing) で確認する (src 5, src 3)。形式仕様は Lean theorem prover で記述 (`cedar-spec` リポジトリ、src 3)。
- 2025-10-08: CNCF が Cedar を Sandbox として受理 (src 2)。
- 2025-12 (AWS Open Source Blog 公開): CNCF Sandbox 参加を AWS が告知。vendor-neutral なガバナンスへ移行する意図を表明 (src 3)。

## アーキテクチャの素材

中核は「認可エンジン」= パーサ + 評価器 (evaluator) + 認可器 (authorizer)。代表操作は `is_authorized`: リクエスト・ポリシー集合・エンティティ集合を受けて `Allow` / `Deny` を返す。

データの流れ (request から decision まで):

1. 公開 API `cedar_policy::Authorizer::is_authorized` (`cedar-policy/src/api.rs:1116`) が `Request` / `PolicySet` / `Entities` を受け取り、内部 core の同名関数へ委譲する (`api.rs:1117` の `self.0.is_authorized(...)`)。

2. core `Authorizer::is_authorized` (`cedar-policy-core/src/authorizer.rs:76`) は `is_authorized_core(...).concretize()` を呼ぶ (`authorizer.rs:77`)。

3. `is_authorized_core` (`authorizer.rs:83`) が `Evaluator::new(...)` で評価器を作り (`authorizer.rs:89`)、`is_authorized_core_internal` へ (`authorizer.rs:90`)。

4. `is_authorized_core_internal` (`authorizer.rs:95`) が `pset.policies()` を 1 本ずつ走査し (`authorizer.rs:109`)、`eval.partial_evaluate(p)` を呼ぶ (`authorizer.rs:111`)。結果を effect (Permit / Forbid) と真偽で 6 バケツ (`true_permits` ほか) に振り分ける (`authorizer.rs:112-129`)。評価エラーは捕捉し、`ErrorHandling::Skip` によりそのポリシーを「不成立」として扱う (`authorizer.rs:130-148`)。

5. `partial_evaluate` (`cedar-policy-core/src/evaluator.rs:397`) はポリシーの条件式を `partial_interpret(&p.condition(), p.env())` で解釈し、`PartialValue::Value` なら `get_as_bool()` で真偽へ、`PartialValue::Residual` なら残差式を返す (`evaluator.rs:398-401`)。

6. 集計結果を `PartialResponse::new(...)` に詰める (`authorizer.rs:152`)。

7. `concretize()` (`cedar-policy-core/src/authorizer/partial_response.rs:115`) が `decision()` (`partial_response.rs:121`) を呼び、最終 `Decision` を決める。

deny-trumps-allow の本体は `decision()` の match (`partial_response.rs:122-138`):

- `(true, _, _, _) => Some(Decision::Deny)`: 確定 forbid が 1 つでもあれば Deny (`partial_response.rs:129`)。
- `(_, false, false, _) => Some(Decision::Deny)`: 成立しうる permit が皆無なら default Deny (`partial_response.rs:131`)。
- `(false, true, _, false) => Some(Decision::Allow)`: 確定 permit があり、確定/残差 forbid が無いとき Allow (`partial_response.rs:137`)。

設計上の含意: forbid が常に permit を上書きし、permit ゼロは既定で拒否。`Decision` enum は `Allow` / `Deny` の 2 値のみで、パース失敗等の致命的エラーも Deny に倒す (`authorizer.rs:701-708` の doc と enum 定義)。

## 内部実装の素材

中核データ構造 (いずれも宣言行を確認):

- `Request` (`cedar-policy-core/src/ast/request.rs:38`): principal / action / resource / context の 4 フィールド。設計ドキュメントの request タプル `<P, A, R, C>` に対応 (同 :36 のコメント)。`context` は `Option<Context>` で、`None` は partial evaluation 用の残差を生む (`request.rs:51-52`)。
- `Expr<T = ()>` (`cedar-policy-core/src/ast/expr.rs:53`) と `ExprKind<T = ()>` (`expr.rs:64`): ポリシー条件の AST。`Lit` / `Var` / `Slot` / `Unknown` / `If` / `And` / `Or` / `UnaryApp` / `BinaryApp` / `ExtensionFunctionApp` / `GetAttr` / `HasAttr` / `Like` などの variant を持つ。`And` / `Or` は短絡評価 (`expr.rs` のフィールドコメント参照)。
- `Value` (`cedar-policy-core/src/ast/value.rs:33`) と `ValueKind` (`value.rs:45`): 評価結果。`Lit` / `Set` / `Record` / `ExtensionValue` の 4 種。clone は O(1) (`Arc` 多用)。
- `EntityUIDImpl` (`cedar-policy-core/src/ast/entity.rs:211`): エンティティの一意 ID。型名 (`ty: EntityType`) と `eid: Eid` の組。Cedar は principal / action / resource をすべてエンティティとして表現する。
- `Policy` (`cedar-policy-core/src/ast/policy.rs:511`): `Arc<Template>` + リンク ID + スロット束縛 `values: HashMap<SlotId, EntityUID>`。静的ポリシーもテンプレートのインスタンスとして表現し、全スロットが束縛される不変条件 (values total map) を持つ (`policy.rs:526` 周辺の INVARIANT コメント、`new` での `check_binding`)。
- `PolicySet` (`cedar-policy-core/src/ast/policy_set.rs:32`): 評価対象のポリシー集合。`is_authorized_core_internal` が `policies()` で走査する。

非自明な設計判断: 記号コンパイラ (symbolic compiler, SymCC)。`cedar-policy-symcc` は Cedar ポリシーを SMT ソルバ向けの論理式へコンパイルし、ポリシー間の性質を機械的に証明・反証する。Cedar の言語設計が健全 (sound)・完全 (complete)・決定可能 (decidable) な論理符号化を許すよう調整されているため成立する (src 3 のブログ説明と README:43)。公開エントリ:

- `SymCompiler` 系のコンパイル: `Policy` 用 `compile` (`cedar-policy-symcc/src/lib.rs:158`)、`PolicySet` 用 `compile` (`lib.rs:225`)。
- `CedarSymCompiler<S: Solver>` (`lib.rs:267`) の非同期チェック群: `check_unsat` (`lib.rs:294`)、`check_sat` (`lib.rs:315`)、`check_never_errors` (`lib.rs:334`)、`check_always_matches` (`lib.rs:389`)、`check_never_matches` (`lib.rs:444`)、`check_matches_equivalent` (`lib.rs:508`)、`check_matches_implies` (`lib.rs:599`)、`check_matches_disjoint` (`lib.rs:687`)。`*_with_counterexample` 版は反例 (具体的な入力) を返す。
- これにより「ポリシー A は常にポリシー B を含意するか」「2 つのポリシーは等価か」「決して誤らないか」を実行時テストでなく証明で問える。汎用ポリシーエンジン (例 OPA) との本質差。

メインエントリポイント:

- ライブラリ: `cedar-policy` crate (`cargo add cedar-policy`、README:37)。公開 API は `Authorizer::is_authorized` (`api.rs:1116`)。
- CLI: `cedar-policy-cli` の `fn main` (`cedar-policy-cli/src/main.rs:28`)。`clap` でサブコマンドを解析し、`cedar authorize` などを提供。
- FFI / JSON: `cedar-policy/src/ffi/is_authorized.rs:58` (`is_authorized`)、`:88` (`is_authorized_json`)。wasm 経由で JS/TS から利用。

## 採用事例の素材

出典付きの組織名のみ。AWS Open Source Blog (src 3) が「現在の adopters / maintainers」として明記:

- Cloudflare
- MongoDB
- StrongDM
- Cloudinary
- Linux Foundation Janssen Project (統合)
- AWS サービス: Amazon Bedrock AgentCore Policy、AWS Systems Manager (src 3)

加えて Cedar は Amazon Verified Permissions と AWS Verified Access のエンジン (src 4, src 5)。コミュニティ統合として Lucas Käldström の Kubernetes-Cedar-Authorizer (src 3)。リポジトリに `ADOPTERS` ファイルは無い (確認済み)。GitHub シグナル: stars 1,571 / contributors 61 (2026-06-27, src 1)。

## 代替・エコシステム

- Open Policy Agent (OPA) / Rego: 汎用ポリシーエンジン。Cedar は認可特化で、決定可能な論理符号化により形式解析 (SymCC) が可能な点が差 (src 3)。
- OpenFGA / SpiceDB: ReBAC (Zanzibar 系) 中心。Cedar は RBAC/ABAC/ReBAC を 1 言語で表現 (src 6)。
- 統合・エコシステム: Amazon Verified Permissions (マネージド)、`cedar-examples` (TinyTodo デモ, README:132)、`cedar-language-server` による IDE 補完、wasm による JS/TS 利用、Janssen Project、Kubernetes-Cedar-Authorizer (src 3)。
- CNCF blog (src 6) は Cedar を Kubernetes のポリシー管理 (admission/authorization) の新手法として紹介。

## インストールと最小動作

ライブラリ追加:

```bash
cargo add cedar-policy
```

CLI で最小認可 (README:51-126 の手順を再現)。`policy.cedar` と `entities.json` を置く。`policy.cedar`:

```cedar
permit (
  principal == User::"alice",
  action == Action::"view",
  resource in Album::"jane_vacation"
);
```

認可リクエストを投げる:

```bash
cargo run --bin cedar authorize \
   --policies policy.cedar \
   --entities entities.json \
   --principal 'User::"alice"' \
   --action 'Action::"view"' \
   --resource 'Photo::"VacationPhoto94.jpg"'
```

`VacationPhoto94.jpg` が `Album::"jane_vacation"` に属するため `ALLOW`、`jane_secrets` 側の写真なら `DENY` (README:103-128)。

## タグライン案

- English: Cedar is an open-source, formally verified policy language for fast, analyzable fine-grained authorization.
- 日本語: Cedar は形式検証された認可ポリシー言語。RBAC/ABAC/ReBAC を高速かつ解析可能に表現する。
