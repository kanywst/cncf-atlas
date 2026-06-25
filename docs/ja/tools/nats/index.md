# NATS

> 単一の Go バイナリとして配布される高性能メッセージングシステム。fire-and-forget な中核の上に、JetStream による永続化を任意で追加できる。

- **カテゴリ**: Messaging & Streaming
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [nats-io/nats-server](https://github.com/nats-io/nats-server)
- **ドキュメント基準コミット**: `bd058fac` (default ブランチ HEAD、ソース VERSION は `2.15.0-dev`、直近リリースは `v2.14.2`)

## 何をするものか

NATS は publish/subscribe 型のメッセージングシステム。送信側は subject (`orders.eu.new` のようなドット区切り文字列) にメッセージを送り、サーバはその subject にマッチする interest を持つすべての購読者へ配送する。マッチングは subject トークンの木とワイルドカードで行うため、購読側は `orders.*.new` や `orders.>` といったパターンで interest を表現できる。

中核プロトコルは at-most-once。サーバはディスクに何も保持せず、購読者が現在いないメッセージは破棄される。この中核の上に JetStream が永続化・リプレイ・at-least-once 配送・key/value バケット・オブジェクトストレージを追加する。JetStream はデータを独自の追記型ファイル形式で保存し、クラスタ間を Raft で複製するため、外部 DB を必要としない。

単一の `nats-server` バイナリが配置形態の全レンジをカバーする。スタンドアロンプロセス、ルーティングされたサーバ群によるクラスタ、リージョン横断のゲートウェイによるスーパークラスタ、クラスタをエッジまで延ばす leaf node まで。同じ接続処理コードが、各接続に `kind` を付けることでこれらすべてを担う ([`server/client.go:259`](https://github.com/nats-io/nats-server/blob/bd058fac3d0c04398698b113e986b35065212fda/server/client.go#L259))。

## いつ使うか

- サービス間の request/reply や pub/sub で低い tail latency が欲しく、それを 1 バイナリ・外部依存なしで実現したい。
- リージョン横断やエッジデバイスへの展開があり、後付けではなく組み込みのトポロジ (ゲートウェイ、leaf node) が欲しい。
- at-least-once 配送・リプレイ・key/value ストアが必要で、それを同じシステムから JetStream 経由で得たい。
- Kafka 流のパーティション/オフセット意味論を第一級モデルとして求める場合は適合度が下がる。厳密な per-key 順序と水平スケールの両立は、subject ベースのパーティショニングを自分で組むことになる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [nats-io/nats-server (GitHub)](https://github.com/nats-io/nats-server)
2. [nats-io organization (GitHub)](https://github.com/nats-io)
3. [NATS project page (CNCF)](https://www.cncf.io/projects/nats/)
4. [NATS Graduation Application (cncf/toc#2042)](https://github.com/cncf/toc/issues/2042)
5. [CNCF and Synadia Align on Securing NATS.io](https://www.cncf.io/announcements/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project/)
6. [Protecting NATS and the integrity of open source (CNCF)](https://www.cncf.io/blog/2025/05/01/protecting-nats-and-the-integrity-of-open-source-cncfs-commitment-to-the-community/)
7. [RedMonk Conversation with Derek Collison](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/)
8. [NATS Messaging (Wikipedia)](https://en.wikipedia.org/wiki/NATS_Messaging)
9. [JetStream (NATS Docs)](https://docs.nats.io/nats-concepts/jetstream)
10. [Consumers (NATS Docs)](https://docs.nats.io/nats-concepts/jetstream/consumers)
11. [NATS.io About](https://nats.io/about/)
12. [Synadia tries to claw NATS back (The Stack)](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/)
13. [Benchmarking Message Queue Latency (Brave New Geek)](https://bravenewgeek.com/benchmarking-message-queue-latency/)
14. [Message Brokers Comparison 2026 (dev.to)](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8)
15. [Kafka vs RabbitMQ vs NATS vs SQS (BackendBytes)](https://backendbytes.com/articles/message-queue-comparison/)
