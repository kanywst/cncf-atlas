# 内部実装

> コミット `9a556d8` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| [`cmd/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/cmd) | CLI: `run`、`migrate`、`validate-models`、`version` |
| [`pkg/server/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/server) | gRPC/HTTP ハンドラ。API 面ごとに 1 ファイル |
| [`pkg/server/commands/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/server/commands) | トランスポート非依存のビジネスロジック |
| [`internal/graph/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/internal/graph) | Check 解決エンジンと resolver チェーン |
| [`internal/planner/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/internal/planner) | Thompson Sampling 戦略プランナ |
| [`pkg/typesystem/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/typesystem) | モデルのパース・検証と重み付きグラフ |
| [`pkg/storage/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/storage) | データストアインターフェースと実装 |
| [`pkg/tuple/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/pkg/tuple) | 関係タプルのヘルパ |

## 中核データ構造

**`Tuple` / `TupleKey`** は関係データの基本単位で、`document:1 # viewer @ user:alice` のような (object, relation, user) の三つ組である。この型は protobuf の `TupleKey` の別名である ([`pkg/tuple/tuple.go:15`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/tuple/tuple.go#L15)):

    type Tuple openfgav1.TupleKey

**`ResolveCheckRequest` / `ResolveCheckResponse`** は、チェックが分解される部分問題ツリーの 1 ノードを表す。リクエストはサイクル検出に使う visited-paths 集合と、dispatch 数やデータストアクエリ数といった解決メタデータを持つ ([`internal/graph/resolve_check_request.go`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/resolve_check_request.go)、[`resolve_check_response.go`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/resolve_check_response.go))。

**Userset rewrite** (protobuf) は、関係の定義を集合代数のツリーとして表す方法である: `Userset_This`、`ComputedUserset`、`TupleToUserset`、`Union`、`Intersection`、`Difference`。`CheckRewrite` がこのツリーを評価する ([`internal/graph/check.go:1046-1063`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L1046-L1063))。

**`TypeSystem`** は検証済みモデルと、そこから構築した `WeightedAuthorizationModelGraph` を保持する ([`pkg/typesystem/typesystem.go:184`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/typesystem/typesystem.go#L184)、構築は [`typesystem.go:242`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/typesystem/typesystem.go#L242))。この重み付きグラフが `PathExists` 枝刈りを可能にする。

**`ThompsonStats` / `PlanConfig`** は、各解決戦略のレイテンシに対するエンジンの信念を Normal-gamma 分布としてモデル化する ([`internal/planner/thompson.go:13-23`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/planner/thompson.go#L13-L23)、[`internal/planner/config.go:5`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/planner/config.go#L5))。

## 追う価値のあるパス

`(*LocalChecker).ResolveCheck` ([`internal/graph/check.go:395`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L395)) を辿る。これはそれ自身の契約により、問題ツリーから 1 ノードを解決する再帰関数である ([`internal/graph/interface.go:13-31`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/interface.go#L13-L31))。

まず深度をガードし、次にサイクルを検出してそれが見つかればエラーではない否定の答えを返す ([`check.go:415-427`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L415-L427)):

    if req.GetRequestMetadata().Depth == c.maxResolutionDepth {
        return nil, ErrResolutionDepthExceeded
    }

    cycle := c.hasCycle(req)
    if cycle {
        span.SetAttributes(attribute.Bool("cycle_detected", true))
        return &ResolveCheckResponse{
            Allowed: false,

self-defining タプルは即座に許可される ([`check.go:434`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L434))。次が枝刈りステップである。重み付きモデルグラフ上で、このオブジェクト型の関係へユーザから到達する経路が無いと判定されたら、チェックはデータストアに触れずに false を返す ([`check.go:455-463`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L455-L463)):

    hasPath, err := typesys.PathExists(tupleKey.GetUser(), relation, objectType)
    if err != nil {
        return nil, err
    }
    if !hasPath {
        return &ResolveCheckResponse{
            Allowed: false,
        }, nil
    }

そうでなければ関係の rewrite ルールを評価する ([`check.go:465`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L465))。`CheckRewrite` は rewrite 種別で分岐する ([`check.go:1046-1063`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L1046-L1063)): `Userset_This` は `checkDirect`、`ComputedUserset` は `checkComputedUserset`、`TupleToUserset` は `checkTTU`、集合演算子は `checkSetOperation` へ。

集合演算は並行実行される。`union` は全ハンドラをワーカープールで走らせ、最初に許可が返った時点で短絡し残りをキャンセルする ([`internal/graph/check.go:160`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L160)、短絡は [`check.go:206-209`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L206-L209)):

    if outcome.resp.Allowed {
        // Short-circuit success. defer cancel() will clean up workers.
        return outcome.resp, nil
    }

`intersection` ([`check.go:222`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L222)) は最初の否定で打ち切り、`exclusion` ([`check.go:295`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/check.go#L295)) は base が真かつ subtract が偽のときに真となる。

## 読んで驚いた点

**resolver チェーンは自分自身に戻るループになっている。** `Build` は resolver を負荷の軽い順に並べたうえで、最後の resolver の delegate を先頭に設定する ([`internal/graph/builder.go:96-104`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/builder.go#L96-L104)):

    for i, resolver := range c.resolvers {
        if i == len(c.resolvers)-1 {
            resolver.SetDelegate(c.resolvers[0])
            continue
        }
        resolver.SetDelegate(c.resolvers[i+1])
    }

そのため `LocalChecker` が部分問題に再帰するとき、その再帰は自分を直接呼ぶのではなくキャッシュ resolver から再入する。これにより、どの部分問題もキャッシュとスロットリングの恩恵を受けられる。これが無限再帰を起こしてはならないという契約はインターフェースに明記されている ([`interface.go:38-40`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/graph/interface.go#L38-L40))。

**戦略選択はヒューリスティックではなくオンライン学習である。** `(*keyPlan).Select` は Thompson Sampling の決定則を実装する。各戦略の学習済み分布からレイテンシのサンプルを引き、最小のものを選ぶ ([`internal/planner/plan.go:46-69`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/planner/plan.go#L46-L69)):

    for k, plan := range resolvers {
        ts := kp.getOrCreateStats(plan)
        sampledTime := ts.Sample(rng)
        if bestResolver == "" || sampledTime < minSampledTime {
            minSampledTime = sampledTime
            bestResolver = k
        }
    }

実測レイテンシは `UpdateStats` で反映され、各クエリ経路は探索を続けつつ最も低レイテンシな戦略へ収束する。その意図 (`InitialGuess`、`Lambda`、`Alpha`、`Beta` の意味と探索/活用のバランス) は config のコメントに詳述されている ([`internal/planner/config.go:5-43`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/internal/planner/config.go#L5-L43))。

**フラグの裏に 2 つ目の Check 実装が隠れている。** `ExperimentalWeightedGraphCheck` が有効だと v2 の重み付きグラフ Check が先に試され、重み付きグラフで表現できないモデルでは黙って v1 にフォールバックする ([`pkg/server/check.go:69-152`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/server/check.go#L69-L152))。v1 パスだけを素朴に読むと、本番トラフィックがまったく別の経路を通っている可能性を見落とす。
