# recon: BFE

調査メモ。BFE (Beyond Front End) は Baidu 由来の L7 (レイヤ 7、アプリケーション層) ロードバランサ兼リバースプロキシ。これは CNCF Sandbox プロジェクトの forward engine (転送エンジン) リポジトリで、データプレーンの中核を成す。

## 基本情報

- repo: `bfenetworks/bfe`
- pinned commit: `d8d6dcb5c49e586f19b433acfee57fb57412ea7a` (develop, 2026-05-08) / 近いタグ: v1.8.2 (`VERSION` が `1.8.2`、develop は v1.8.2 リリース直後の状態)
- 言語 / ビルド: Go (go.mod は `go 1.22`) / `make` または `make compile` (`go build -ldflags "-X main.version=... -X main.commit=..."`、`Makefile:81-89`)
- main エントリポイント: `bfe.go:52` の `main()`。フラグ解析 -> `bfe_conf.BfeConfigLoad` (`bfe.go:103`) -> `bfe_server.StartUp` (`bfe.go:124`)。
- ライセンス: Apache License 2.0 (`LICENSE` 冒頭で確認、`go.mod` の module path は `github.com/bfenetworks/bfe`)
- CNCF 成熟度: Sandbox (受理 2020-06-25、出典 [1])
- カテゴリ (この案件の選択肢から): API Gateway

メモ: BFE は memory-safe な言語 (Go) で書かれていることを売りにしている。バッファオーバーフロー耐性、runtime panic からの recover を強調 (README、出典 [2])。OS は Go がコンパイルできる全環境 (Linux/Windows/macOS)。

## 歴史の素材

- 2012 年頃から Baidu 社内で BFE プラットフォームの構築が始まった。2020 年末には 1 日あたり兆単位のリクエストを転送、ピークで毎秒 1000 万超 (README overview、出典 [2])。
- 2019 年 7 月に転送エンジンが OSS 化 (GitHub repo の created_at は `2019-07-31`、出典 [3])。
- 2020-06-25 に CNCF Sandbox として受理 (CNCF プロジェクトページ、出典 [1]。TOC 投票は 2020-06-24)。
- 書籍『深入理解 BFE』(In-depth Understanding of BFE) が `baidu/bfe-book` で英中両言語で公開されている (出典 [4])。設計思想の一次資料として有用。

## アーキテクチャの素材

BFE システムはデータプレーンとコントロールプレーンに分かれる (README、出典 [2])。

- データプレーン: 本リポジトリの BFE Server (転送エンジン)。content-based routing (内容ベースのルーティング)、ロードバランス、バックエンドへの転送を行う。
- コントロールプレーン: API-Server (設定の更新/保存/生成)、Conf-Agent (最新設定を取得し BFE Server にリロードを促す)、Dashboard (GUI)。これらは別リポジトリ (`bfenetworks/api-server`, `bfenetworks/conf-agent`, `bfenetworks/dashboard`)。Kubernetes Ingress 用に `bfenetworks/ingress-bfe` もある。

### トップレベルのコンポーネント (本リポジトリ)

- `bfe_server/`: サーバ起動、リスナー、HTTP コネクション処理、リバースプロキシ本体。
- `bfe_route/`: ホスト名 -> product -> cluster のルーティングテーブル。trie とルートルール木を保持。
- `bfe_balance/`: 二段階ロードバランス。`bal_gslb` (sub-cluster 単位、WRR/WLC)、`bal_slb` (sub-cluster 内 backend 選択、smooth weighted round robin)。
- `bfe_basic/`: リクエストの内部表現 (`request.go`)、condition DSL (`condition/`)、エラーコード。
- `bfe_module/` + `bfe_modules/`: プラグイン (module) フレームワークと 30 個の組み込みモジュール (mod_block, mod_rewrite, mod_waf, mod_trace, mod_compress 等)。
- プロトコル実装: `bfe_http`, `bfe_http2`, `bfe_spdy`, `bfe_stream`, `bfe_tls`, `bfe_websocket`, `bfe_fcgi`, `bfe_proxy` (PROXY protocol)。`bfe_wasmplugin` で proxy-wasm 拡張も持つ。

### リクエストの流れ (代表的な 1 操作を端から端まで)

中核は `bfe_server/reverseproxy.go:663` の `func (p *ReverseProxy) ServeHTTP(rw, basicReq)`。1 つの HTTP リクエストはここで処理される。

1. `setClientAddr(basicReq)` で実クライアント IP を確定 (`reverseproxy.go:689`)。

2. module コールバック `HandleBeforeLocation` を実行 (`reverseproxy.go:692`、`srv.CallBacks.GetHandlerList`)。返り値で close/finish/redirect/response に分岐。

3. `srv.findProduct(basicReq)` で product を確定 (`reverseproxy.go:718`)。実体は `bfe_server/find_location.go:36` -> `HostTable.LookupHostTagAndProduct` (`bfe_route/host_table.go:114`)。ホスト名を反転 FQDN (Fully Qualified Domain Name、完全修飾ドメイン名) にして trie 検索 (`host_table.go:259`)、失敗時は VIP テーブル、さらに default product にフォールバック (`host_table.go:121-130`)。

4. コールバック `HandleFoundProduct` (`reverseproxy.go:732`)。

5. `srv.findCluster(basicReq)` で cluster 名を確定 (`reverseproxy.go:758`)。実体は `find_location.go:49` -> `HostTable.LookupCluster` (`host_table.go:141`)。まず basic route の木 (host+path) を引き (`host_table.go:145-160`)、当たらなければ advanced route ルールを順に `rule.Cond.Match(req)` で評価 (`host_table.go:171-176`)。この `Cond` が condition DSL。

6. `serverConf.ClusterTable.Lookup(clusterName)` で cluster 設定を取得 (`reverseproxy.go:773`)。

7. コールバック `HandleAfterLocation` (`reverseproxy.go:804`)。

8. out request を組み立て (`reverseproxy.go:836`、`*outreq = *req` の shallow copy + hop-by-hop ヘッダ除去 `hopByHopHeaderRemove`)。

9. `p.clusterInvoke(srv, cluster, basicReq, rw)` で実際にバックエンドへ転送 (`reverseproxy.go:898`、定義は `reverseproxy.go:307`)。

    - `srv.balTable.Lookup(cluster.Name)` で balancer を取得 (`reverseproxy.go:323`)。
    - 最大 20 回のリトライループ内で `bal.Balance(request)` が backend を 1 つ選ぶ (`reverseproxy.go:349`)。
    - `transport.RoundTrip(outreq)` で backend へリクエスト送出 (`reverseproxy.go:403`)。失敗時は error 種別ごとに retry 可否を判定 (`reverseproxy.go:447-502`)。

10. `HandleReadResponse` コールバック後 (`reverseproxy.go:967`)、`p.sendResponse(rw, res, ...)` でクライアントへ応答をコピー (`reverseproxy.go:990` -> 定義 `reverseproxy.go:527`、`copyResponse` で `io.CopyBuffer`)。

module フックポイントは 9 段階の固定ステージ (`bfe_module/bfe_callback.go:33-41`): `HandleAccept`, `HandleHandshake`, `HandleBeforeLocation`, `HandleFoundProduct`, `HandleAfterLocation`, `HandleForward`, `HandleReadResponse`, `HandleRequestFinish`, `HandleFinish`。各モジュールは起動時にこれらへハンドラを登録する。

### 二段階ロードバランス

`bfe_balance` は GSLB (Global Server Load Balance、広域負荷分散) と SLB (Server Load Balance、サーバ負荷分散) の二段構成。

- GSLB 層 `bal_gslb/bal_gslb.go:48` の `BalanceGslb`: cluster 配下の sub-cluster 群を重み付きで選ぶ。`BalanceMode` は WRR (Weighted Round Robin) / WLC (Weighted Least Connection) / EPP (Envoy ext_proc 連携) を取る (`bal_gslb.go:61`、`SetGslbBasic` は `bal_gslb.go:88`)。assigned sub-cluster でのリトライ上限と cross-cluster リトライ上限を持つ (`DefaultRetryMax=3`, `DefaultCrossRetryMax=1`, `bal_gslb.go:43-44`)。
- SLB 層 `bal_slb/bal_rr.go`: sub-cluster 内の backend を選ぶ。`smoothBalance` (`bal_slb/bal_rr.go:251`) が nginx と同系の smooth weighted round robin を実装。各 backend の `current` に `weight` を足し込み、最大 `current` の backend を選んで `current -= total` する古典的アルゴリズム。

## 内部実装の素材

### 中核データ構造 (3-5 個)

1. `bfe_basic.Request` (`bfe_basic/request.go:60`): `bfe_http.Request` のラッパ。`HttpRequest`/`OutRequest`/`HttpResponse`、`Route RequestRoute` (product/cluster の確定結果)、`Trans RequestTransport` (選ばれた backend と transport)、`Stat *RequestStat` (各ステージのタイムスタンプ)、`Context map[interface{}]interface{}` (module 間の値受け渡し) を 1 つに集約。リクエスト処理中ずっと持ち回る state オブジェクト。

2. `bfe_route.HostTable` (`bfe_route/host_table.go:41`): ルーティングの心臓部。`hostTable`/`hostTagTable`/`vipTable` のマップ、`hostTrie *trie.Trie` (反転 FQDN の trie)、basic route の木 (`productBasicRouteTree`) と advanced route のルール表 (`productAdvancedRouteTable`) を保持。`Versions` で各設定のバージョンを記録しホットリロードに対応 (`host_table.go:57`)。

3. `condition.Condition` インタフェース (`bfe_basic/condition/condition.go:23`): `Match(req *bfe_basic.Request) bool` の 1 メソッド。advanced route とモジュール条件の評価単位。具体は `PrimitiveCond` (`bfe_basic/condition/primitive.go:59`)、`Fetcher` (`primitive.go:44`) と `Matcher` (`primitive.go:48`) の組で「値を取り出す」と「判定する」を分離。`UnaryCond`/`BinaryCond` で `&&`/`||`/`!` を合成。

4. `bal_gslb.BalanceGslb` (`bfe_balance/bal_gslb/bal_gslb.go:48`): cluster 単位の GSLB 状態。`subClusters SubClusterList`、`totalWeight`、`BalanceMode`、EPP クライアント関連を持つ。

5. `bfe_server.BfeServer` (`bfe_server/bfe_server.go:45`): プロセス全体の集約。リスナー群、`ReverseProxy`、TLS 関連 (`MultiCert`/`SessionCache`/`TLSServerRule`)、`CallBacks *bfe_module.BfeCallbacks`、`Modules`、`ServerConf *bfe_route.ServerDataConf`、`balTable *bfe_balance.BalTable` を束ねる。`confLock sync.RWMutex` で設定ホットリロードを保護。

### 非自明な設計判断: condition DSL を独自の yacc 文法で実装

advanced routing のルールは正規表現や JSON ではなく、独自のドメイン特化言語 (DSL, Domain-Specific Language) で書く。例: `req_host_in("example.org") && req_path_prefix_in("/api", false)`。

- `condition.Build(condStr)` (`bfe_basic/condition/build.go:29`) が入口。`parser.Parse` で AST (Abstract Syntax Tree、抽象構文木) を作り、未解決の変数 (識別子) が残れば error にする (`build.go:30-37`)。
- AST ノード種別 (`*parser.CallExpr` / `*parser.UnaryExpr` / `*parser.BinaryExpr` / `*parser.ParenExpr`) ごとに再帰的に `Condition` を組む (`build.go:42-55`)。
- パーサは goyacc 文法 (`bfe_basic/condition/parser/cond.y` と生成物 `y.go`)、独自 scanner/token (`scanner.go`, `token.go`)、semantic check (`semant.go`) まで持つ。`primitive_test.go` 等にテストあり。
- 各プリミティブは `Fetcher` (`req_host`, `req_path`, `req_cip` 等の取り出し) と `Matcher` (`_in`, `_prefix_in`, `_regmatch` 等の判定) の合成として表現される (`primitive.go:44-80`)。

これは「設定ファイルに人間可読な条件式を書かせ、それをパースしてオブジェクト木にする」という判断。正規表現マッチの羅列よりも可読で型チェックも効き、`HandleAfterLocation` のような module 条件にも同じ DSL を流用できる。BFE の差別化点として README やレビュー記事でも繰り返し言及される (出典 [2], [5])。

### 追う価値のあるパス

- 設定ホットリロード: `bfe_server/bfe_confdata_load.go` と `HostTable.Update` (`host_table.go:105`)。`confLock` でアトミックに差し替える。
- backend のヘルスと outlier detection: `reverseproxy.go:414` の `checkBackendStatus` と `backend.OnFailByCluster` / `OnSuccess`。
- EPP (Envoy ext_proc) 連携: `bal_gslb` の `BalanceModeEPP` と `reverseproxy.go:339-345`。Envoy の go-control-plane を import している (`bal_gslb.go:39`)。

## 採用事例の素材

`ADOPTERS.md` (本リポジトリ) に出典付きで列挙されている組織のみ採用。捏造なし。主なもの:

- Baidu ([baidu.com](https://www.baidu.com))
- CCTV、China Life、China Merchants Bank、Postal Savings Bank of China、SPD Bank、Yillion Bank (金融・メディア系、いずれも `ADOPTERS.md` にリンクあり)
- Shenzhen Stock Exchange ([szse.cn](http://www.szse.cn))、State Grid、Sichuan Airlines、Haier、USTC、360 など

注意: `ADOPTERS.md` は自己申告 (issue #748 経由) の一覧。CNCF ケーススタディや公開トークによる裏取りは別途必要。GitHub シグナル (下記) の方が定量的。

GitHub シグナル (gh API、2026-06-26 取得、出典 [3]):

- stars: 6,249
- forks: 942
- contributors: 約 102 (non-anonymous、contributors API の last page より) / anon 含め約 115
- commits (develop): 約 1,227
- 最新リリース: v1.8.2 (2026-05-08 公開)

## 代替・エコシステム

代替 (同じ L7 プロキシ / LB 領域):

- Envoy (CNCF Graduated): C++ 製、xDS (Discovery Service API 群) で動的設定、サービスメッシュのデータプレーン標準。BFE より広範だが設定は複雑。
- NGINX / OpenResty: C + Lua、最も普及。BFE は「Lua ではなく Go module で拡張」「人間可読な条件 DSL」を差別化に挙げる。
- HAProxy: C 製の高性能 LB。
- Traefik (Go)、Emissary-ingress / Contour (Envoy ベースの Kubernetes API Gateway): Go / クラウドネイティブ志向で BFE と最も比較されやすい。

BFE の本質的な差:

- メモリ安全な Go 実装 + panic recover による堅牢性を前面に出す。
- ルーティングを host -> product -> cluster -> sub-cluster -> backend の階層と、独自 condition DSL で表現する点 (Baidu 規模の多テナント運用に最適化された抽象)。
- GSLB + SLB の二段ロードバランスがコアに組み込まれている (zone-aware、overload protection)。

統合先 (README、出典 [2]): Kubernetes (`ingress-bfe` で Ingress Controller)、Prometheus (組み込みメトリクス)、Jaeger (`mod_trace` の分散トレーシング)、Fluentd (ログ)。L4 LB との併用も想定。

## 最小の動作セットアップ

ソースからビルドして付属の設定で起動する手順 (README / Makefile 準拠)。

1. リポジトリを取得してビルドする。

    ```bash
    git clone https://github.com/bfenetworks/bfe.git
    cd bfe
    make
    ```

2. 同梱の設定ディレクトリで起動する (`-c` が設定ルート、`-l` がログ出力先)。

    ```bash
    cd output/bin
    ./bfe -c ../conf -l ../log
    ```

3. 設定ファイルだけを検証して終了したい場合は `-t` を使う。

    ```bash
    ./bfe -t -c ../conf
    ```

Docker を使う場合は公式イメージ `bfenetworks/bfe` を `docker run` する手順も README にある (出典 [2])。
