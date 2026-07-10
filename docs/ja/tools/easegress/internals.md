# 内部実装

> コミット `3bdb192` (タグ `v2.11.0` の近傍) のソースを読んだもの。ここでの主張はすべてファイルと行を指す。リポジトリは `easegress-io/easegress` にあるが、モジュールパスは今も `github.com/megaease/easegress/v2` である点に注意。

## コードマップ

| パス | 責務 |
| --- | --- |
| `pkg/supervisor` | オブジェクトのライフサイクルと登録: `registry.go`, `supervisor.go`, `spec.go` |
| `pkg/object/*` | traffic gate・pipeline・controller: `httpserver`, `pipeline`, `trafficcontroller`, `meshcontroller`, `aigatewaycontroller`, 各サービスレジストリ |
| `pkg/filters/*` | filter 実装群と登録レジストリ (`filters.go`, `registry.go`) |
| `pkg/cluster` | 埋め込み etcd、キー空間の layout、syncer、watcher、mutex、STM |
| `pkg/context` | リクエスト実行コンテキストと `Handler` / `MuxMapper` インタフェース |
| `pkg/protocols` | HTTP・MQTT などのプロトコル抽象 (request/response) |
| `pkg/resilience` | サーキットブレーカ・レートリミッタ・リトライ・タイムリミッタのポリシ |
| `cmd/server`, `cmd/client`, `cmd/builder` | サーバ本体、`egctl` CLI、カスタムビルダ |

## 中核データ構造

`supervisor.Object` (`pkg/supervisor/registry.go:30`) は管理対象すべてが実装するインタフェースで、`Category`・`Kind`・デフォルト spec・status・close を持つ。トラフィックを運ぶオブジェクトは加えて `TrafficObject` を実装し、`Init` と `Inherit` を持つ (`pkg/supervisor/registry.go:61`)。カテゴリ定数と起動優先順位は同じ場所にあり (`pkg/supervisor/registry.go:102`)、supervisor は system controller を traffic gate より先に起動し、逆順で停止することを知る。

`filters.Filter` (`pkg/filters/filters.go:54`) が filter の契約だ。`Name`・`Kind`・`Spec`・`Init`・`Inherit`・`Handle(ctx) result`・`Status`・`Close` を持つ。`Kind` メタ構造体 (`pkg/filters/filters.go:33`) は filter の `Name`・`Description`・`Results` (返しうる result 文字列の集合)・`CreateInstance` ファクトリ・デフォルト spec を持つ。resilience ポリシを受ける filter は加えて `Resiliencer.InjectResiliencePolicy` を実装する (`pkg/filters/filters.go:86`)。`Results` 集合は「filter が返せるもの」と「pipeline が分岐できるもの」を型レベルで結び付ける。

`pipeline.Pipeline` (`pkg/object/pipeline/pipeline.go:63`) は `filters` マップ、順序付き `flow`、resilience マップを保持する。spec は flow・filters・resilience・data を持つ (`pkg/object/pipeline/pipeline.go:73`)。肝心なのは `FlowNode` (`pkg/object/pipeline/pipeline.go:81`) だ。filter 名・alias・namespace・`JumpIf map[result]target`・解決済み filter からなる。`Spec.ValidateJumpIf` (`pkg/object/pipeline/pipeline.go:112`) は flow を後方から辿り、各 `JumpIf` が名指す result が filter の宣言した `Results` に含まれること、そして jump 先が存在することを検証する。

`cluster.Cluster` (`pkg/cluster/cluster_interface.go:33`) は etcd 上の KV・watch・syncer・STM を公開する。実体の `cluster` 構造体は `*embed.Etcd` サーバを保持し (`pkg/cluster/cluster.go:123`)、各サーバが内包する埋め込み etcd ノードである。

## 追う価値のあるパス

filter の result 文字列が pipeline をどう駆動するかを追う。ここが Easegress のオーケストレーションモデルの中核だからだ。

```text
Pipeline.Handle            pkg/object/pipeline/pipeline.go:357
  -> doHandle              pipeline.go:371
       node.filter.Handle  pipeline.go:390   filter が result 文字列を返す
       JumpIf[result]      pipeline.go:399   次ノードを選ぶ、または END
```

まず登録がある。各 filter パッケージの `init()` は `filters.Register(&Kind{...})` を呼び (`pkg/filters/registry.go:29`)、kind を名前をキーにグローバルマップへ格納する。重複はパニックになる (`pkg/filters/registry.go:34`)。`GetKind(name)` で引き戻せる (`pkg/filters/registry.go:76`)。

pipeline を構築するとき、`ValidateJumpIf` (`pkg/object/pipeline/pipeline.go:112`) は各ノードの kind を `filters.GetKind(spec.Kind()).Results` (`pkg/object/pipeline/pipeline.go:123`) で解決し、pipeline が分岐する result がすべて filter の宣言したものであることを検証する。`JumpIf` の result のタイプミスは、リクエスト時ではなく構築時に捕まる。

リクエスト時には `doHandle` (`pkg/object/pipeline/pipeline.go:371`) が flow を歩く。`node.filter.Handle(ctx)` を呼び (`pkg/object/pipeline/pipeline.go:390`)、filter の Duration と Result を `FilterStat` として記録し、次ノードを解決する。result が空なら順序上の次ノードへ進み、非空なら `node.JumpIf[result]` を引く (`pkg/object/pipeline/pipeline.go:399`)。result が非空で対応する `JumpIf` エントリが無ければ組み込みの END へ飛ぶ。これが宣言的オーケストレーションを成立させる。`invalid` を返す validator を fallback filter へ jump するよう配線でき、それがすべて設定内で完結する。

## 読んで驚いた点

resilience は pipeline のステージではない。v2.0 の設計はサーキットブレーカ・リトライ・タイムリミッタを Proxy filter に畳み込み、Proxy は `InjectResiliencePolicy` で受け取って (`pkg/filters/proxies/httpproxy/proxy.go:362`) main pool と candidate pool へ配る。コードを読むと、resilience を独立 filter から外す歴史的判断がそのまま見える。ポリシは独立したホップとしてではなく、proxy の pool に同乗する。

ハンドラの契約は 1 メソッドだ。`Handler` は `Handle(ctx) string` だけである (`pkg/context/context.go:35`)。HTTP サーバ側から見れば、pipeline 全体が文字列を返す 1 メソッドにすぎない。この継ぎ目こそ、同じ pipeline モデルで HTTP・gRPC・MQTT を、gate がどのプロトコルかを知らずに扱えるようにしている。

etcd はバイナリ内に同梱される。`pkg/cluster` は `go.etcd.io/etcd/server/v3/embed` を import し (`pkg/cluster/cluster.go:31`)、`embed.StartEtcd` で実際の etcd サーバを起動する (`pkg/cluster/cluster.go:586`)。デプロイすべき外部 etcd は無い。運用の単純さは、etcd サーバ丸ごとを内包するバイナリで支払われる。
