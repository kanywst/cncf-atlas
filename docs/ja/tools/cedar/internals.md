# 内部実装

> コミット `991bacf` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cedar-policy/src/api.rs` | 公開 SDK 面。`Authorizer::is_authorized` を含む (`api.rs:1116`) |
| `cedar-policy-core/src/authorizer.rs` | ポリシーごとの結果を決定にまとめる (`authorizer.rs:95`) |
| `cedar-policy-core/src/authorizer/partial_response.rs` | deny-trumps-allow の `decision` ロジックを持つ (`partial_response.rs:121`) |
| `cedar-policy-core/src/evaluator.rs` | ポリシー条件をリクエストに対して解釈する (`evaluator.rs:397`) |
| `cedar-policy-core/src/ast/` | 中核 AST: `Request`、`Expr`、`Value`、`Policy`、`PolicySet`、エンティティ |
| `cedar-policy-symcc/src/lib.rs` | 記号コンパイラと SMT による性質チェック (`lib.rs:267`) |
| `cedar-policy-cli/src/main.rs` | CLI エントリポイント (`main.rs:28`) |

## 中核データ構造

`Request` は入力タプルである。`cedar-policy-core/src/ast/request.rs:38` で宣言され、4 フィールド (principal、action、resource、context) を持ち、すぐ上のコメントにある設計ドキュメントの request タプル `<P, A, R, C>` に対応する (`request.rs:36`)。`context` フィールドは `Option<Context>` で、`None` のときその変数は partial evaluation 用の残差を生む (`request.rs:49-50`)。

`Expr<T = ()>` (`cedar-policy-core/src/ast/expr.rs:53`) とその `ExprKind<T = ()>` (`expr.rs:64`) はポリシー条件の AST である。variant には `Lit`、`Var`、`Slot`、`Unknown`、`If`、`And`、`Or`、`UnaryApp`、`BinaryApp`、`ExtensionFunctionApp` が含まれる (`expr.rs:66`, `:68`, `:70`, `:72` および以降の宣言)。`Slot` はテンプレートのスロットを、`Unknown` は partial evaluation 用の記号値を表す (`expr.rs:70`, `:72`)。

`Value` (`cedar-policy-core/src/ast/value.rs:33`) と `ValueKind` (`value.rs:45`) は評価結果である。`ValueKind` はちょうど 4 つの variant を持つ:

```rust
pub enum ValueKind {
    /// anything that is a Literal can also be the dynamic result of evaluating an `Expr`
    Lit(Literal),
    /// Evaluating an `Expr` can result in a first-class set
    Set(Set),
    /// Evaluating an `Expr` can result in a first-class anonymous record (keyed on String)
    Record(Arc<BTreeMap<SmolStr, Value>>),
    /// Evaluating an `Expr` can result in an extension value
    ExtensionValue(Arc<RepresentableExtensionValue>),
}
```

`Policy` (`cedar-policy-core/src/ast/policy.rs:511`) はリンクされたテンプレートインスタンスである。`Arc<Template>`、任意のリンク id、スロット束縛マップ `values: HashMap<SlotId, EntityUID>` (`policy.rs:524`) を持つ。静的ポリシーもテンプレートのインスタンスであり、型は不変条件「values total map」を持ち、テンプレートの全スロットが `values` で束縛されることを要求する (`policy.rs:518-519`)。`PolicySet` (`cedar-policy-core/src/ast/policy_set.rs:32`) は認可器が `policies()` で走査する集合である。エンティティは `EntityUIDImpl` (`cedar-policy-core/src/ast/entity.rs:211`) で識別され、エンティティ型と id の組である。principal・action・resource はすべてエンティティである。

## 追う価値のあるパス

エンジン全体は、ポリシーごとの結果がどう 1 つの決定になるかに集約される。認可器は各ポリシーを評価し、effect と真偽で 6 つのバケツの 1 つに振り分ける (`authorizer.rs:112-129`):

```rust
        for p in pset.policies() {
            let (id, annotations) = (p.id().clone(), p.annotations_arc().clone());
            match eval.partial_evaluate(p) {
                Ok(Either::Left(satisfied)) => match (satisfied, p.effect()) {
                    (true, Effect::Permit) => true_permits.push((id, annotations)),
                    (true, Effect::Forbid) => true_forbids.push((id, annotations)),
```

`partial_evaluate` (`evaluator.rs:397`) はポリシー条件が真偽か残差になる場所である:

```rust
    pub fn partial_evaluate(&self, p: &Policy) -> Result<Either<bool, Expr>> {
        match self.partial_interpret(&p.condition(), p.env())? {
            PartialValue::Value(v) => v.get_as_bool().map(Either::Left),
            PartialValue::Residual(e) => Ok(Either::Right(e)),
        }
    }
```

最終的な答えは `decision` の match である (`partial_response.rs:121-138`)。4 つの真偽値 (成立した forbid の有無、成立した permit の有無、残差 permit の有無、残差 forbid の有無) を見て、優先順で解決する:

```rust
    pub fn decision(&self) -> Option<Decision> {
        match (
            !self.satisfied_forbids.is_empty(),
            !self.satisfied_permits.is_empty(),
            !self.residual_permits.is_empty(),
            !self.residual_forbids.is_empty(),
        ) {
            // Any true forbids means we will deny
            (true, _, _, _) => Some(Decision::Deny),
            // No potentially or trivially true permits, means we default deny
            (_, false, false, _) => Some(Decision::Deny),
```

成立した forbid が即座に勝つ (`partial_response.rs:129`)。permit が一切無ければ既定で `Deny` になる (`partial_response.rs:131`)。`Allow` には成立した permit と、成立・残差いずれの forbid も無いことが必要である (`partial_response.rs:137`)。

## 読んで驚いた点

`decision` は `Decision` ではなく `Option<Decision>` を返す (`partial_response.rs:121`)。unknown が残ると `None` を返しうる。残差 forbid を持つリクエストは `None` を返す。その forbid が真に評価され、あらゆる permit を上書きしうるからである (`partial_response.rs:131` と続く残差アーム)。partial authorization は後付けではない。エンジンの native な形であり、完全に具体的なパスは `concretize` で到達する特殊ケースである (`partial_response.rs:115`)。

エラーは決して第 3 の結果にならない。唯一のエラーモードは `ErrorHandling::Skip` (`authorizer.rs:136`) で、エラーを起こしたポリシーを不成立として扱い、`Decision` enum は 2 値で致命的エラーは `Deny` に畳まれる (`authorizer.rs:701`, `:704-708`)。壊れたポリシーは安全側に倒れる。

記号コンパイラが Cedar を汎用エンジンと分ける部分である。`CedarSymCompiler<S: Solver>` (`cedar-policy-symcc/src/lib.rs:267`) は SMT ソルバを背後に持つ async チェック群を公開する。`check_unsat` (`lib.rs:294`)、`check_sat` (`lib.rs:315`)、`check_never_errors` (`lib.rs:334`)、`check_always_matches` (`lib.rs:389`)、`check_never_matches` (`lib.rs:444`)、`check_matches_equivalent` (`lib.rs:508`)、`check_matches_implies` (`lib.rs:599`)、`check_matches_disjoint` (`lib.rs:687`) である。各々に、失敗を示す具体的入力を返す `*_with_counterexample` 版がある。ポリシーはまず、単一 `Policy` 用の `compile` (`lib.rs:158`) か `PolicySet` 用の `compile` (`lib.rs:225`) でコンパイルされる。これにより「あるポリシーが常に別を含意する」「2 つのポリシー集合が等価である」をテストではなく証明で問える。
