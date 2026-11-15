# 歴史

## 起源

NATS は Derek Collison が作った。出発点は 2010 年頃、VMware の Cloud Foundry のメッセージング制御プレーンとして Ruby で実装されたものだ ([RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/)、[Wikipedia](https://en.wikipedia.org/wiki/NATS_Messaging))。狙いはプラットフォームの内部神経系、つまり中央に重いブローカを置かずにコンポーネント同士が高速かつシンプルに会話する仕組みだった。

Collison が Apcera を創業すると、NATS は Go へ書き直され `gnatsd` となった。Collison が挙げる動機は 2 つ。Ruby の依存管理の苦痛から逃れること、静的バイナリと実スタックを得て GC 圧を下げることだ。生の速度は主因ではなかった。Go 移行では正規表現パーサもやめ、near-zero-allocation の手書きパーサに置き換えた ([RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/))。そのパーサは今もプロトコルパスを駆動している ([`server/parser.go:139`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/parser.go#L139))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2010 | Cloud Foundry のメッセージング制御プレーンとして最初の Ruby 実装 ([RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/)) |
| 2012 | `nats-io/nats-server` リポジトリが GitHub に作成 (2012-10-29) ([repo](https://github.com/nats-io/nats-server)) |
| 2018 | CNCF に Incubating として受理 (2018-03-15) ([CNCF project page](https://www.cncf.io/projects/nats/)) |
| ~2021 | 2.2 系で JetStream が組み込み・推奨の永続化経路に ([JetStream docs](https://docs.nats.io/nats-concepts/jetstream)) |
| 2025 | Synadia とのガバナンス紛争が解決。商標は Linux Foundation に譲渡、Apache-2.0 を継続 ([CNCF announcement](https://www.cncf.io/announcements/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project/)) |
| 2026 | `v2.15.0` リリース (2026-09-17、[release](https://github.com/nats-io/nats-server/releases/tag/v2.15.0))、CNCF Graduated に (TOC 投票 2026-11-02 締切、[cncf/toc#2042](https://github.com/cncf/toc/issues/2042)、昇格手続き [cncf/toc#2354](https://github.com/cncf/toc/issues/2354)) |

## どう進化したか

大きな転換は 2 つ。1 つ目は Ruby から Go への書き直しで、これがプロジェクトの性能的性格を決めた。単一の静的バイナリ、手書きパーサ、tail latency 重視だ。Apcera が Ericsson に売却された後、Collison は Synadia を設立して NATS を継続し、サーバコードの大半を本人が書いたと述べている ([RedMonk interview](https://redmonk.com/blog/2025/02/10/rmc-derek-collison-the-forrest-gump-of-messaging/))。

2 つ目は永続化だ。初期の durable メッセージングは NATS Streaming (STAN) という別レイヤにあったが、後に deprecated となった。JetStream はこれを置き換え、永続化をサーバに直接組み込んだ。独自の追記型ファイルストアと Raft ベースの複製を備える ([JetStream docs](https://docs.nats.io/nats-concepts/jetstream))。これにより単一バイナリ・外部依存なしのモデルを保ったまま、at-least-once 配送・リプレイ・key/value・オブジェクトストレージを追加した。

## 現在地

2025 年、Synadia が NATS を CNCF から引き上げ BUSL へ再ライセンスする意向をコミュニティに通知し、ガバナンス紛争が表面化した。これは解決した。Synadia は NATS 商標 2 件を Linux Foundation に譲渡し、CNCF はドメインと GitHub 組織を保持し、コードは Apache-2.0 のままとなった ([CNCF announcement](https://www.cncf.io/announcements/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project/)、[CNCF blog](https://www.cncf.io/blog/2025/05/01/protecting-nats-and-the-integrity-of-open-source-cncfs-commitment-to-the-community/))。

NATS は Incubating 入りから 8 年後の 2026 年 11 月に CNCF Graduated になった ([cncf/toc#2042](https://github.com/cncf/toc/issues/2042))。直近リリースは `v2.15.3` と `v2.14.10` で、どちらも 2026-11-11 に出た。2 つのマイナー系列にまだパッチが出ている ([releases](https://github.com/nats-io/nats-server/releases))。default ブランチのソースは VERSION `2.16.0-dev` を持つ ([`server/const.go:69`](https://github.com/nats-io/nats-server/blob/6993500ca20a02d1f42be713ceac3887b3bf819c/server/const.go#L69))。
