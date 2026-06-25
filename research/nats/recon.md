# recon: NATS

調査メモ。自分用の密度。出典は URL を添える。

## 基本情報

- repo: `nats-io/nats-server` (primary implementation。クライアント 40+ 言語は別リポ群、組織 `nats-io`)
- pinned commit: `bd058fac3d0c04398698b113e986b35065212fda` (default branch HEAD, 2026-06-24)
- 近いタグ: `v2.14.2` (最新リリース 2026-06-02)。HEAD のソース内 VERSION は `2.15.0-dev` (`server/const.go:69`)
- 言語 / ビルド: Go (go.mod は `go 1.25.0` / toolchain `go1.25.11`)。ビルドは `go build` もしくは `make build`。エントリは `main.go`
- ライセンス: Apache-2.0 (`LICENSE` 冒頭 "Apache License Version 2.0" を確認。各 `.go` ヘッダも Apache-2.0)
- CNCF 成熟度: Incubating (2018-03-15 受理。現在 Graduation 申請中、cncf/toc#2042)
- カテゴリ: Messaging & Streaming

## 歴史の素材

- 作者は Derek Collison。元々 VMware の Cloud Foundry のメッセージング制御プレーンとして Ruby で実装 (2010 頃、初回 OSS commit 2010-10-30 とされる)。出典: [RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/), [Wikipedia](https://en.wikipedia.org/wiki/NATS_Messaging)
- Apcera 創業時に Go へ書き直し (`gnatsd`)。動機は性能より Ruby の依存管理の苦痛回避と静的バイナリ/実スタックによる GC 圧低減。Go 移行で正規表現パーサをやめ、near-zero-allocation の手書きパーサに。出典: [RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/)
- Apcera を Ericsson に売却後、Collison が Synadia を設立し NATS を継続。サーバコードの大半を本人が記述と主張。出典: [RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/)
- マイルストーン: NATS Streaming (STAN) は別レイヤだったが deprecated。2.2 で JetStream が組み込み永続化の推奨経路に。出典: [JetStream docs](https://docs.nats.io/nats-concepts/jetstream)
- 2025 ガバナンス紛争: Synadia が NATS を CNCF から「引き上げ」BUSL 化を通知 したが解決。Synadia が NATS 商標 2 件を Linux Foundation に譲渡、ドメイン/GitHub は CNCF 保持、Apache-2.0 継続。出典: [CNCF 2025-05-01 announcement](https://www.cncf.io/announcements/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project/), [CNCF blog](https://www.cncf.io/blog/2025/05/01/protecting-nats-and-the-integrity-of-open-source-cncfs-commitment-to-the-community/)

## アーキテクチャの素材

トップレベル構成 (`server/` パッケージが本体、`main.go` は薄い CLI)。

- 接続/プロトコル: `server/client.go` (client 構造体・readLoop・pub/sub 処理)、`server/parser.go` (手書きステートマシンパーサ)
- 購読マッチング: `server/sublist.go` (subject トークン木 + キャッシュ)。別実装 `server/gsl/` (generic sublist) も同居
- アカウント/マルチテナンシ: `server/accounts.go` (`Account` 構造体、import/export, 各アカウントが自前の sublist `acc.sl` を持つ)
- クラスタリング/接続種別: `server/route.go` (route)、`server/gateway.go` (super-cluster gateway)、`server/leafnode.go` (leaf node エッジ)
- JetStream 永続化: `server/jetstream*.go`, `server/stream.go` (`stream` 構造体)、`server/consumer.go` (`consumer`)、`server/filestore.go` (ファイルストア)、`server/memstore.go`。クラスタ合意は RAFT (`server/raft.go`)
- 認証: `server/auth.go`, `server/auth_callout.go` (JWT/nkeys ベース)
- サーバ本体: `server/server.go` (`Server` 構造体、起動・accept ループ)

接続種別が CLIENT / ROUTER / GATEWAY / LEAF / JETSTREAM / SYSTEM と多層で、同じ `client` 構造体を `kind` で多重化しているのが特徴 (`server/client.go`)。

## 内部実装の素材: core publish を端から端まで追う

代表操作: クライアントが `PUB subject reply size` 行と payload を送り、購読者へ配送されるまで。

1. `func (c *client) readLoop(pre []byte)` `server/client.go:1403` がソケットから読み、`func (c *client) parse(buf []byte)` `server/parser.go:137` に渡す。
2. パーサは手書きステートマシン。`OP_PUB` から `PUB_ARG` 状態で引数を蓄積し、引数完了で `processPub` を呼ぶ (`server/parser.go:408`-`442`、`if err := c.processPub(arg)`)。
3. `func (c *client) processPub(arg []byte)` `server/client.go:2880`。スタック上の固定長配列 `a := [MAX_PUB_ARGS][]byte{}` で引数を分割し heap 確保を避ける (`server/client.go:2882`)。subject/reply/size を `c.pa` (parseState) に格納し maxPayload 違反チェック (`server/client.go:2921`-)。
4. payload 受信完了後 `func (c *client) processInboundClientMsg(msg []byte)` `server/client.go:4311`。統計更新、予約 subject/権限チェック (`pubAllowedFullCheck` `server/client.go:4334`)、gateway reply mapping。
5. マッチング。L1 キャッシュを先に引く: `genid := atomic.LoadUint64(genidAddr)` で sublist の世代 ID を確認し、`c.in.results[string(c.pa.subject)]` に当たればロック無しで結果再利用 (`server/client.go:4421`-`4428`)。
6. ミス時に共有 sublist へ: `r = acc.sl.Match(string(c.pa.subject))` `server/client.go:4433`。`func (s *Sublist) Match` `server/sublist.go:532` から `match` `server/sublist.go:559`。まず `s.cache[subject]` を引き (`server/sublist.go:567`)、無ければ subject を `.` (btsep) でトークン分割し木を走査。結果を L1 キャッシュへ、上限 `maxResultCacheSize` 超でランダム prune (`server/client.go:4436`-`4446`)。
7. 配送。`didDeliver, qnames = c.processMsgResults(acc, r, msg, ...)` `server/client.go:4467` から `processMsgResults` `server/client.go:5127` が psubs (通常購読) と qsubs (キューグループ、ランダム 1 つ選択) を分け、各購読へ `func (c *client) deliverMsg(...)` `server/client.go:3690`。deliverMsg は echo 抑止 (`c == client && !client.echo` `server/client.go:3696`)、deny perms、`sub.isClosed()` チェック後、対象 client の書き込みバッファへ enqueue。

非自明な設計判断: ホットパスのスループット最適化として、共有 sublist の `sync.RWMutex` を publish ごとに取らない。各 client が自分専用の L1 結果キャッシュ `c.in.results` を持ち、sublist 側の atomic `genid` と自分の `c.in.genid` が一致する限りロックフリーで再利用する (`server/client.go:4421`-`4448`、`genidAddr := &acc.sl.genid` `server/client.go:4330`)。購読変更で genid が進むとキャッシュ全破棄。さらに sublist 内部にもグローバルキャッシュ (`s.cache`) があり二段キャッシュ構成。これで fan-out のたびの subject 木走査コストとロック競合を避けている。コメントもパフォーマンス計測由来だと明記 (例 `server/client.go:4371` "Doing this inline ... measured performance impact reported in our bench")。

中核データ構造:

- `client` `server/client.go:259`。全接続種別共通。`kind`・`pa` (parseState)・`in`/`out` バッファ・`perms` を保持。pub/sub の主処理メソッドが集中。
- `subscription` `server/client.go:638`。`client`, `subject []byte`, `queue []byte`, `sid []byte`, `max`/`nm` (auto-unsub 用カウンタ), `icb msgHandler` (内部購読コールバック), `shadow` (アカウント import 影), `closed int32` (atomic)。
- `Sublist` / `node` / `level` `server/sublist.go:65`,`87`,`96`。subject をトークン分割した木。`level` は通常ノード map と pwc(`*`)/fwc(`>`) ワイルドカードノードを持つ。`node.psubs` は通常購読の set、`qsubs` は queue 名から購読 set の二段 map。`SublistResult` `server/sublist.go:59` が psubs/qsubs の配列。
- `Account` `server/accounts.go:52`。マルチテナント境界。自前 sublist (`sl`)・import/export・gateway reply mapping を持つ。subject 名前空間はアカウント単位で隔離。
- `msgBlock` `server/filestore.go:220`。JetStream ファイルストアの追記ブロック。HighwayHash チェックサム (`hh`)・任意の per-block AEAD 暗号 (`aek`/`bek`)・subject ごとのインメモリ `stree.SubjectTree[SimpleState]` (`fss`) を持ち、外部 DB を使わず自前ブロック形式で永続化。

## 採用事例の素材

- nats.io の Adopters / CNCF ケーススタディに 2,000+ 社が記載とされる (graduation application の記述)。出典: [cncf/toc#2042](https://github.com/cncf/toc/issues/2042)
- 報道ベースの利用企業: AT&T, CapitalOne, Tinder, Walmart, Volvo (microservices / event streaming / IoT 用途)。出典: [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/)
- CNCF / nats.io ケーススタディ: DeFacto (event-driven), Finleap Connect (規制業種, mTLS)。出典: [cncf/toc#2042](https://github.com/cncf/toc/issues/2042)
- Mastercard は本調査の出典群では確認できず、記載しない。

## 代替・エコシステム

- 代替: Apache Kafka (パーティション/オフセットが第一級、>1M msg/s、replay とエコシステム強だが運用重い)、RabbitMQ (AMQP, broker 側ルーティング豊富, 50-100K msg/s)、Redis Pub/Sub (in-memory, sub-ms だが永続性なし)。出典: [BackendBytes](https://backendbytes.com/articles/message-queue-comparison/), [dev.to comparison](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8)
- 本質的差: NATS は単一バイナリ・外部依存なし・subject ベースのシンプルルーティング・tail latency が締まる。Core NATS は at-most-once、JetStream で at-least-once/exactly-once・KV・Object Store を追加。Kafka の partition-centric モデルには綺麗に対応せず、厳密 per-key 順序 + 水平スケールは subject ベース partition を自前構築になる。出典: [Brave New Geek benchmark](https://bravenewgeek.com/benchmarking-message-queue-latency/), [dev.to comparison](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8)
- エコシステム: クライアント 40+ 言語 (nats.go, nats.js, nats.rs, nats.net, nats.java 等)、`nats` CLI、JetStream KV/Object Store、leaf node によるエッジ接続、MQTT/WebSocket 対応、Kubernetes 向け Helm chart と controller。出典: [nats.io about](https://nats.io/about/)

## 採用規模の数値

- GitHub `nats-io/nats-server`: stars 20,083 / forks 1,846 / open issues 508 / 言語 Go (gh API, 2026-06-24)。リポジトリ作成 2012-10-29。
- mentionableUsers (おおよその関与ユーザ) 190 (GitHub GraphQL, 2026-06-24)。graduation application は contributors 169+, stars 18.3k+, Slack 11k+ と記載 (cncf/toc#2042, 申請時点)。
- 最新リリース v2.14.2 (2026-06-02)。

## インストール / 最小動作

- バイナリ: `go install github.com/nats-io/nats-server/v2@latest`、公式リリースバイナリ、または `docker run -p 4222:4222 nats`。
- JetStream 有効化: `nats-server -js`。デフォルトクライアントポート 4222、監視 HTTP は `-m 8222`。
- 最小確認: `nats-server` 起動、別端末で `nats sub foo`、続けて `nats pub foo hello` (nats CLI)。
- 出典: [nats.io about](https://nats.io/about/), [JetStream docs](https://docs.nats.io/nats-concepts/jetstream)

## タグライン

- EN: High-performance, single-binary messaging for cloud and edge, with optional JetStream persistence.
- JA: クラウドとエッジ向けの高速な単一バイナリ・メッセージング基盤。JetStream で永続化も選べる。
