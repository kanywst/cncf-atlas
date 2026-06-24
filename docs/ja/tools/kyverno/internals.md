# 内部実装

> コミット `989e001` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/kyverno` | admission controller のエントリポイント。CEL エンジンとクライアントを配線する (`cmd/kyverno/main.go`)。 |
| `pkg/webhooks` | webhook HTTP サーバとルート登録 (`pkg/webhooks/server.go`)。 |
| `pkg/webhooks/resource` | ポリシーを分類しエンジンを呼ぶ admission handler (`pkg/webhooks/resource/handlers.go`)。 |
| `pkg/engine` | `Engine` interface の背後にあるポリシー評価器 (`pkg/engine/engine.go`)。 |
| `pkg/engine/api` | 共有の型: `Engine`, `EngineResponse`, `RuleResponse`。 |
| `pkg/cel` | CEL ベースのポリシーエンジン (`vpol`, `mpol`, `ivpol`, `gpol`)。 |
| `pkg/autogen` | Pod controller 向け rule の自動生成。`v1` と `v2` の実装。 |
| `api/kyverno/v1` | `ClusterPolicy` / `Policy` の Go 型。`Rule` と `Spec` を含む。 |
| `pkg/controllers` | reconcile ループ: policy cache、status、cert manager、webhook 登録。 |
| `pkg/background` | `UpdateRequest` CRD 経由の非同期な generate と mutate-existing。 |

## 中核データ構造

`Rule` (`api/kyverno/v1/rule_types.go:45`) はポリシー作者が書く単位。1 つの rule はちょうど 1 つのアクションを持つ。`Mutation`, `Validation`, `Generation`, `VerifyImages` のいずれかだ。加えて変数とデータソースの `Context` (`rule_types.go:51`)、適用条件の `MatchResources` (`rule_types.go:61`) と `ExcludeResources` (`rule_types.go:67`)、そして 2 種類の precondition を持つ。JMESPath の `RawAnyAllConditions` (`rule_types.go:82`) と CEL の `CELPreconditions` (`rule_types.go:87`) だ。エンジンは `HasValidate`, `HasValidatePodSecurity`, `HasValidateCEL` などの述語メソッドで分岐するため、rule 種別がどの handler を走らせるかを決める。

`Spec` (`api/kyverno/v1/spec_types.go:51`) は `ClusterPolicy` / `Policy` の本体。最初に match した rule で打ち切れる `GetApplyRules()` (`spec_types.go:307`) と、`Fail` か `Ignore` を返す `GetFailurePolicy()` (`spec_types.go:277`) を公開する。

`EngineResponse` (`pkg/engine/api/engineresponse.go:15`) は 1 ポリシーの結果。元の `Resource`、mutate 後の `PatchedResource`、`PolicyResponse`、`stats` を持つ。`NewEngineResponseFromPolicyContext` (`engineresponse.go:38`) で生成される。

`RuleResponse` (`pkg/engine/api/ruleresponse.go:25`) は 1 rule の結果。`status`, `ruleType`, `message`, `generatedResources`, `patchedTarget`, `podSecurityChecks`, `exceptions`、ネイティブの `vapBinding` (`ruleresponse.go:48`) と `mapBinding` (`ruleresponse.go:50`)、そして rule メッセージを API server の warning header へ流す `emitWarning` (`ruleresponse.go:52`) を持つ。

## 追う価値のあるパス

1 リソースに対する `engine.validate` を追う。rule のループが評価の心臓部だ。

```go
// pkg/engine/validation.go:26
policyContext.JSONContext().Checkpoint()
defer policyContext.JSONContext().Restore()

gvk, _ := policyContext.ResourceKind()
for _, rule := range autogen.Default.ComputeRules(policy, gvk.Kind) {
    // handlerFactory が rule 種別から handler を選ぶ
    // ...
    resource, ruleResp := e.invokeRuleHandler(ctx, logger, handlerFactory, ...)
}
```

ここで重要な点が 2 つ。第一に、回される rule は作者が書いた rule とは限らない。`autogen.Default.ComputeRules` (`validation.go:30`) は、ループが走る前に Pod の rule を Deployment・DaemonSet などへ展開できる。第二に、`handlerFactory` (`validation.go:33`) は述語から handler を遅延解決する。`NewValidateAssertHandler`, `NewValidateManifestHandler`, `NewValidatePssHandler`, `NewValidateCELHandler`、または既定の `NewValidateResourceHandler` (`validation.go:58`) だ。実際のチェックは `e.invokeRuleHandler` (`validation.go:72`) で走る。

## 読んで驚いた点

autogen は単なる便利機能ではない。`pkg/autogen/v1/autogen.go:207` の `ComputeRules` は評価時に pod-controller の rule を導出する。`CanAutoGen(spec)` が controller の候補集合を決め (`autogen.go:213`)、annotation `pod-policies.kyverno.io/autogen-controllers` が実際に対象となる controller を上書きできる (`autogen.go:220`)。つまり Pod 向けに書いた rule が、作者がそれらのケースを書かずとも Deployment や CronJob を静かに統治する。実装は `v1` と `v2` の 2 つがあり、`v2` の `ComputeRules` は追加の `ExtractPodFunc` を返す (`pkg/autogen/v2/autogen.go:303`)。同じ発想に対する別シグネチャだ。

audit 経路は意図的に fire-and-forget だ。deny 判定が下された後、`handlers.go:159` は report 生成を、新しい `context.WithTimeout(context.Background(), 30*time.Second)` を持たせて pool に submit する。コメントは、これが HTTP リクエストのライフサイクルから独立していると明示する。遅い、あるいは失敗する report 書き込みが admission の応答をブロックしたり失敗させたりしないためだ。

空の engine response はエラーではなく意図的なシグナルだ。`HandleValidationEnforce` では `engineResponse.IsNil()` がループを短絡する。コメントは、old と new のリソースが同じ response を生んだ場合だと述べており、ポリシー評価を変えない更新はそのまま通る (`validation.go:108`)。
