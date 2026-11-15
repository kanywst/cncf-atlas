# 内部実装

> コミット `6993500c` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `server/client.go` | `client` 構造体・read ループ・全接続種別の publish/subscribe 処理 |
| `server/parser.go` | 手書きのプロトコルステートマシン |
| `server/sublist.go` | subject トークンの interest 木と結果キャッシュ |
| `server/accounts.go` | 自前 sublist を持つマルチテナント境界 `Account` |
| `server/route.go`, `server/gateway.go`, `server/leafnode.go` | クラスタ route・スーパークラスタ gateway・エッジ leaf node |
| `server/stream.go`, `server/consumer.go`, `server/jetstream*.go` | JetStream の stream と consumer |
| `server/filestore.go`, `server/memstore.go`, `server/raft.go` | JetStream ストレージバックエンドと Raft 合意 |
| `server/auth.go`, `server/auth_callout.go` | JWT/nkey 認証と auth callout |

## 中核データ構造

`client` ([`server/client.go:260`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L260)) は全接続種別で共有される。`kind`・`pa` (parse 状態)・in/out バッファ・権限を持ち、pub/sub の処理メソッドが集中している。

`subscription` ([`server/client.go:648`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L648)) は所有者の `client`、subject と任意の queue 名、subscription id、auto-unsubscribe 用カウンタ、任意の内部コールバック、アカウント import 用の shadow 購読、atomic な closed フラグを持つ。

`Sublist` ([`server/sublist.go:71`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L71)) は subject トークンの木だ。`node` ([`server/sublist.go:93`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L93)) は `psubs` (通常購読の set) と `qsubs` (queue 名から購読 set への map) を持つ。`level` ([`server/sublist.go:102`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L102)) は通常の子ノードに加え、`*` (pwc) と `>` (fwc) のワイルドカードノードを持つ。`Match` は照合した psubs/qsubs を運ぶ `SublistResult` ([`server/sublist.go:60`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L60)) を返す。

`Account` ([`server/accounts.go:51`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/accounts.go#L51)) はテナント境界だ。自前 sublist (`sl`)・import/export ルール・gateway reply mapping を持ち、subject 名はアカウント単位でスコープされる。

`msgBlock` ([`server/filestore.go:231`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/filestore.go#L231)) は JetStream ファイルストアの追記ブロックだ。HighwayHash チェックサム、任意の per-block AEAD 暗号鍵、subject ごとのインメモリインデックスを持ち、JetStream は外部 DB ではなく独自のブロック形式へ永続化する。

## 追う価値のあるパス

core publish をソケットのバイト列から購読者まで追う。

1. `readLoop` がソケットから読み ([`server/client.go:1514`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L1514))、`parse` を呼ぶ ([`server/parser.go:139`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/parser.go#L139))。
2. パーサは `PUB` の引数を集め、完了すると `processPub` を呼ぶ ([`server/parser.go:455`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/parser.go#L455))。
3. `processPub` ([`server/client.go:3027`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L3027)) は引数を固定長のスタック配列へ分割して heap 確保を避け、subject/reply/size を parse 状態へ格納し、payload サイズを `maxPayload` と照合する ([`server/client.go:3068`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L3068))。
4. payload が揃うと `processInboundClientMsg` ([`server/client.go:4556`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4556)) が統計を更新し publish 権限を確認する。
5. マッチングはまず per-client の L1 キャッシュを読み、アカウント sublist の世代カウンタで検証し、ミス時のみ `acc.sl.Match` へフォールバックする ([`server/client.go:4663`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4663))。
6. `Match` ([`server/sublist.go:555`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L555)) は `match` ([`server/sublist.go:582`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L582)) を呼び、トークン木を走査する前に sublist 自身の `s.cache` ([`server/sublist.go:590`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L590)) を引く。
7. `processMsgResults` ([`server/client.go:5490`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L5490)) は通常購読と queue グループを分け、グループごとに 1 メンバを選ぶ。この選択には重みが付く。route や leaf node 経由で届いた queue 購読はリモート側の複数メンバを代表するので、その数だけ抽選の持ち分を得る ([`server/sublist.go:731`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L731)、[`server/sublist.go:742`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L742))。そのうえで各々に `deliverMsg` ([`server/client.go:3866`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L3866)) を呼び、echo と権限チェックの後に対象の書き込みバッファへ enqueue する。

```text
readLoop -> parse -> processPub -> processInboundClientMsg
  -> [L1 キャッシュヒット] processMsgResults -> deliverMsg
  -> [L1 ミス]            acc.sl.Match -> match -> processMsgResults -> deliverMsg
```

## 読んで驚いた点

publish のホットパスは heap 確保とロック競合の両方を避けるように作られている。`processPub` は引数分割を固定長スタック配列 `a := [MAX_PUB_ARGS][]byte{}` にアンロールし ([`server/client.go:3029`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L3029))、通常の publish では引数のために何も確保しない。

マッチングは 2 段キャッシュだ。各 client が自前の L1 結果 map `c.in.results` を持ち、それを使う前にサーバはアカウント sublist の atomic 世代カウンタ `genidAddr := &acc.sl.genid` をロードする ([`server/client.go:4575`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4575))。カウンタが client 側に保存した `genid` と一致する限り、共有ロックに触れずキャッシュ結果を再利用する。購読が変わればカウンタが進み、L1 キャッシュ全体が破棄される ([`server/client.go:4663`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4663))。このキャッシュは上限付きで、`maxResultCacheSize` を超えると recency を追わずランダムにまとめて削除する ([`server/client.go:4678`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4678))。その背後で sublist は自前の共有 `s.cache` ([`server/sublist.go:590`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/sublist.go#L590)) を持つため、トークン木を一切走査せずに subject を処理できる場合がある。コメントはこのインライン手法が計測されたベンチマーク影響に基づくと明記している ([`server/client.go:4613`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/client.go#L4613))。
