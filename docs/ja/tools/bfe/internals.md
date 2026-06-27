# 内部実装

> コミット `d8d6dcb` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `bfe.go` | プロセス入口: フラグ解析、設定ロード、サーバ起動 |
| `bfe_server/` | リスナー、コネクション処理、リバースプロキシループ |
| `bfe_route/` | host から product そして cluster へのルーティングテーブル |
| `bfe_balance/bal_gslb/` | GSLB: sub-cluster を選ぶ |
| `bfe_balance/bal_slb/` | SLB: sub-cluster 内の backend を選ぶ |
| `bfe_basic/` | 内部リクエスト型と条件 DSL |
| `bfe_module/` | モジュールフレームワークと 9 つのコールバックポイント |
| `bfe_modules/` | 30 個の組み込みモジュール |

## 中核データ構造

`bfe_basic.Request` (`bfe_basic/request.go:60`) はパイプライン全体を持ち回る state オブジェクトである。受信した `HttpRequest`、転送用 `OutRequest`、`HttpResponse` をラップし、`Route` (解決済みの product と cluster)、`Trans` (選ばれた backend と transport)、`Stat` (各ステージのタイムスタンプ) を併せ持つ。さらにモジュール間で値を受け渡す `Context` マップを持つ (`bfe_basic/request.go:100`)。

`bfe_route.HostTable` (`bfe_route/host_table.go:41`) はルーティングの中核である。host マップ、反転 FQDN (完全修飾ドメイン名) の `hostTrie`、basic route の木、advanced route のルール表を保持する。設定のバージョンを `Versions` 構造体に記録し (`bfe_route/host_table.go:57`)、テーブルを 1 単位でホットリロードできるようにする。

`condition.Condition` (`bfe_basic/condition/condition.go:23`) は advanced routing とモジュール条件の評価単位である。1 メソッドのインタフェースだ。

```go
type Condition interface {
    Match(req *bfe_basic.Request) bool
}
```

具体的な条件は `Fetcher` と `Matcher` から組み立てられる (`bfe_basic/condition/primitive.go:44` と `bfe_basic/condition/primitive.go:48`)。fetcher がリクエストから値を取り出し、matcher が判定する。この組は `PrimitiveCond` が保持する (`bfe_basic/condition/primitive.go:59`)。

```go
type Fetcher interface {
    Fetch(req *bfe_basic.Request) (interface{}, error)
}

type Matcher interface {
    Match(interface{}) bool
}
```

`bal_gslb.BalanceGslb` (`bfe_balance/bal_gslb/bal_gslb.go:48`) は 1 つの cluster の GSLB 状態を持つ。`subClusters`、`totalWeight`、`BalanceMode`、EPP クライアントのフィールドである。`BalanceMode` はフィールドのコメント上 WRR (Weighted Round Robin) か WLC (Weighted Least Connection) であり (`bfe_balance/bal_gslb/bal_gslb.go:61`)、リトライ上限は `DefaultRetryMax = 3` と `DefaultCrossRetryMax = 1` から初期化される (`bfe_balance/bal_gslb/bal_gslb.go:43-44`)。

`bfe_server.BfeServer` (`bfe_server/bfe_server.go:45`) はプロセス全体の集約である。リスナー群、`ReverseProxy`、TLS 状態、`CallBacks`、`Modules`、`ServerConf`、`balTable` をまとめる。`confLock sync.RWMutex` が設定ホットリロードを保護する (`bfe_server/bfe_server.go:87`)。

## 追う価値のあるパス

条件 DSL は設定文字列をオブジェクト木に変える。入口は `condition.Build(condStr)` (`bfe_basic/condition/build.go:29`) である。文字列を抽象構文木 (AST、Abstract Syntax Tree) にパースし、未解決の識別子が残れば組み立て前に error にする。

```go
func Build(condStr string) (Condition, error) {
    node, identList, err := parser.Parse(condStr)
    if err != nil {
        return nil, err
    }

    if len(identList) != 0 {
        return nil, fmt.Errorf("found unresolved variable %s %d", identList[0].Name, identList[0].Pos())
    }

    return build(node)
}
```

非公開の `build` が AST ノード種別を再帰的にたどり、各々を `Condition` にマップする (`bfe_basic/condition/build.go:42-55`)。`*parser.CallExpr` はプリミティブに、`*parser.UnaryExpr` と `*parser.BinaryExpr` は合成条件に、`*parser.ParenExpr` は内側のノードに展開される。パーサは `bfe_basic/condition/parser/` の goyacc 文法で、独自の scanner と semantic check を持つ。つまりこの DSL は文字列マッチではなく実際にコンパイルされる言語である。

## 読んで驚いた点

SLB 層は NGINX が使う smooth weighted round robin を手書きで `smoothBalance` に実装している (`bfe_balance/bal_slb/bal_rr.go:251`)。各 backend の `current` に `weight` を足し込み、最大の `current` を持つ backend を選び、選択を呼び出しをまたいで滑らかに保つため `current -= total` する。

```go
func smoothBalance(backs BackendList) (*backend.BfeBackend, error) {
    var best *BackendRR
    total, max := 0, 0

    for _, backendRR := range backs {
        backend := backendRR.backend
        // skip ineligible backend
        if !backend.Avail() || backendRR.weight <= 0 {
            continue
        }

        // select backend with the greatest current weight
        if best == nil || backendRR.current > max {
            best = backendRR
            max = backendRR.current
        }
        total += backendRR.current

        // update current weight
        backendRR.current += backendRR.weight
    }
```

転送のリトライループは設定上のリトライ回数だけに頼らず、ハードな上限を持つ。無限ループを避けるためループは 20 回に制限される (`bfe_server/reverseproxy.go:336`)。

```go
    for i := 0; i < 20; i++ {
```

そのループ内で GSLB モードが EPP のとき (`bfe_config/bfe_cluster_conf/cluster_conf/cluster_conf_load.go:62` の `BalanceModeEPP` 定数、判定は `bfe_server/reverseproxy.go:339`)、backend は `bal.BalanceEpp(request)` で選ばれ、それ以外は `bal.Balance(request)` で選ばれる (`bfe_server/reverseproxy.go:349`)。選ばれた backend へは `transport.RoundTrip(outreq)` でリクエストが送られ (`bfe_server/reverseproxy.go:403`)、不良応答のときは `checkBackendStatus` が backend の outlier カウンタを発火させるか判定する (`bfe_server/reverseproxy.go:414`)。
