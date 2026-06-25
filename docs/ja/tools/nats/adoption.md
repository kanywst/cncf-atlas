# 採用事例・エコシステム

## 誰が使っているか

NATS の graduation 申請は、nats.io の adopters リストと CNCF ケーススタディに 2,000+ 組織が記載されているとしている ([cncf/toc#2042](https://github.com/cncf/toc/issues/2042))。以下の具体例は出典のある事例だ。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| AT&T | マイクロサービスとイベントストリーミング | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| Capital One | マイクロサービスとイベントストリーミング | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| Tinder | サービス間メッセージング | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| Walmart | イベントストリーミング | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| Volvo | IoT・コネクテッドビークルのメッセージング | [The Stack](https://www.thestack.technology/we-want-it-back-synadia-tries-to-claw-nats-back-from-a-shocked-cncf/) |
| DeFacto | イベント駆動アーキテクチャ | [cncf/toc#2042](https://github.com/cncf/toc/issues/2042) |
| Finleap Connect | mTLS を使う規制業種 fintech のメッセージング | [cncf/toc#2042](https://github.com/cncf/toc/issues/2042) |

## 採用のシグナル

2026-06-24 時点で `nats-io/nats-server` は stars 20,083・forks 1,846・open issues 508 (GitHub API)。リポジトリ作成は 2012-10-29。GitHub GraphQL の mentionable users はおよそ 190。graduation 申請は申請時点で contributors 169+・stars 18.3k+・Slack 11k+ と記載している ([cncf/toc#2042](https://github.com/cncf/toc/issues/2042))。直近リリースは `v2.14.2` (2026-06-02)。

## エコシステム

NATS クライアントは `nats-io` 組織配下の別リポジトリとして 40+ 言語に存在する。`nats.go`・`nats.js`・`nats.rs`・`nats.net`・`nats.java` などだ ([nats.io about](https://nats.io/about/))。エコシステムには `nats` CLI、JetStream の key/value とオブジェクトストア、leaf node によるエッジ接続、MQTT と WebSocket 対応、Kubernetes 向けの Helm chart と controller も含まれる ([nats.io about](https://nats.io/about/))。

## 代替候補

NATS は外部依存なしの単一バイナリで配布され、subject ベースのルーティングを用い、tail latency を締める ([Brave New Geek benchmark](https://bravenewgeek.com/benchmarking-message-queue-latency/))。Core NATS は at-most-once、JetStream が at-least-once と exactly-once 配送に加え key/value とオブジェクトストアを足す。Kafka の partition 中心モデルにはきれいに対応しないため、厳密な per-key 順序と水平スケールの両立には subject ベースのパーティショニングを自分で組むことになる ([dev.to comparison](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8))。

| 代替 | 違い |
| --- | --- |
| Apache Kafka | partition とオフセットが第一級。非常に高いスループットと強力なリプレイを持つが運用は重い ([dev.to comparison](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8)) |
| RabbitMQ | AMQP で broker 側ルーティングが豊富。スループットは毎秒数万件レンジと低め ([BackendBytes](https://backendbytes.com/articles/message-queue-comparison/)) |
| Redis Pub/Sub | インメモリでサブミリ秒だが永続性なし ([dev.to comparison](https://dev.to/mahdi0shamlou/message-brokers-comparison-2026-kafka-rabbitmq-nats-redis-streams-which-one-should-you-3ea8)) |
