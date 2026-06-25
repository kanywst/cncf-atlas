# 内部実装

> コミット `97cfc6f1` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

コントロールプレーンは `chaoscenter/` 配下にある。ロジックの大半は `chaoscenter/graphql/server/` 配下の GraphQL サーバにある。

| パス | 責務 |
| --- | --- |
| `chaoscenter/graphql/server/graph/` | gqlgen の resolver (`*.resolvers.go`)、生成コード、GraphQL モデル |
| `chaoscenter/graphql/server/pkg/chaos_experiment/` | 実験 CRUD の service と handler |
| `chaoscenter/graphql/server/pkg/chaos_experiment_run/` | run 管理。`handler/handler.go:670` が実行の entrypoint |
| `chaoscenter/graphql/server/pkg/chaos_infrastructure/` | agent 接続管理と subscriber への push |
| `chaoscenter/graphql/server/pkg/probe/` | resilience probe (http/cmd/k8s/prom) と manifest への probe 注入 |
| `chaoscenter/graphql/server/pkg/database/mongodb/` | collection ごとの operator と schema |
| `chaoscenter/graphql/server/pkg/authorization/` | RBAC ルール (`MutationRbacRules`) と JWT |
| `chaoscenter/graphql/server/pkg/data-store/` | プロセス内 state (subscription channel の map) |

実際の障害注入は本リポジトリに無い。3.x では `litmus` はほぼコントロールプレーン + メタ repo である。障害のコードは `litmuschaos/litmus-go` にあり、その README は自身を `litmuschaos/litmus` の拡張と説明している。

## 中核データ構造

`chaoscenter/graphql/server/pkg/data-store/store.go:10` の `StateData` は、`*sync.Mutex` で守られた channel の map 群 (`ConnectedInfra map[string]chan *model.InfraActionResponse` ほか、他の subscription を束ねる map) を持つ構造体である。これがコントロールプレーンのライブ接続状態であり、プロセスメモリ内にのみ保持される部分でもある。

`chaoscenter/graphql/server/pkg/database/mongodb/chaos_experiment/schema.go:31` の `ChaosExperimentRequest` は永続化される実験レコードである。manifest のバージョン履歴を持つ `Revision []ExperimentRevision`、直近 10 run の `RecentExperimentRunDetails`、そして `ExperimentType` を持つ。`ExperimentType` の定数 (`experiment`、`cronexperiment`、`chaosengine`) は `schema.go:10-16` にある。`schema.go:46` の `Probes` 型は、どの probe 名をどの fault 名に紐付けたかを記録する。

`chaoscenter/graphql/server/pkg/database/mongodb/chaos_experiment_run/schema.go:6` の `ChaosExperimentRun` は 1 回の実行である。`Phase`、`ResiliencyScore *float64`、`FaultsPassed`/`FaultsFailed`/`FaultsAwaited`/`FaultsStopped`/`FaultsNA` のカウンタ、`ExecutionData` (実行状況の JSON)、`Probes` を持つ。

agent へ push する action は `model.InfraActionResponse` で、`K8sManifest`、`Namespace`、`RequestType`、`ExternalData`、`Username` を持つ `ActionPayload` を包む。組み立ては `chaoscenter/graphql/server/pkg/chaos_infrastructure/infra_utils.go:207-216`。

## 追う価値のあるパス

実験の再実行は、最終的にサーバが開いた channel へ action を push して終わる。push 自体は短い:

```go
r.Mutex.Lock()
if observer, ok := r.ConnectedInfra[subscriberRequest.InfraID]; ok {
    observer <- newAction
}
r.Mutex.Unlock()
```

このブロックは `infra_utils.go:218-222`、send は `infra_utils.go:220`。そこへ至る handler は `chaoscenter/graphql/server/pkg/chaos_experiment_run/handler/handler.go:670` `RunChaosWorkFlow` から始まり、Revision を新しい順にソートし、`Revision[0].ExperimentManifest` を Argo の `v1alpha1.Workflow` に unmarshal し、`notify_id` と各 template のラベルを注入し、Queued の run レコードを MongoDB に書き、`handler.go:934` で probe を展開し、`handler.go:944` で `SendExperimentToSubscriber` を呼ぶ。呼び出しチェーンは:

```text
RunChaosExperiment (chaos_experiment_run.resolvers.go:24)
  -> RunChaosWorkFlow (handler.go:670)
    -> GenerateExperimentManifestWithProbes (handler.go:934)
    -> SendExperimentToSubscriber (infra_utils.go:226)
      -> SendRequestToSubscriber (infra_utils.go:206)
        -> observer <- newAction (infra_utils.go:220)
```

## 読んで驚いた点

バージョン互換チェックが意図的に無効化されている。`chaoscenter/graphql/server/server.go:77-80` で、DB の version とコントロールプレーンの version が不一致なら弾くコードがコメントアウトされており、「DB upgrader job が機能するまで」戻すとのコメントが付いている。現状はバージョン不一致を弾かない。

RBAC は GraphQL mutation 単位の map (`authorization.MutationRbacRules`) で、各 resolver の冒頭で `ValidateRole` を呼んで強制する。`RunChaosExperiment` resolver は `chaos_experiment_run.resolvers.go:31` で `ReRunChaosExperiment` ルールを処理前にチェックする。

接続の生存はプロセスローカルである。`ConnectedInfra` はインメモリの map なので (`store.go:10-18`)、GraphQL サーバを再起動すると全 agent が貼り直すまで切れ、同一 infra ID の二重接続は `chaos_infrastructure.resolvers.go:281-285` で強制切断される。コントロールプレーンは実質シングルトンである。
