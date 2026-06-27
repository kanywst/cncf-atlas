# 歴史

## 起源

Armada は、量的研究を行う G-Research で生まれた。同社は機械学習・AI・データ解析といった非常に大規模なバッチワークロードを、数万ノードにまたがる Kubernetes 上で動かす必要があった。素の Kubernetes は 2 つの壁にぶつかる。単一クラスタは一定規模を超えるとスケールせず、クラスタ内 etcd ストアは数百万ジョブのバッチキューが要求するスループットを支えられない (README:20-21)。リポジトリの作成は 2019-06-19 (GitHub REST API)。

公開での紹介は、CNCF ブログ記事 "Armada - how to run millions of batch jobs over thousands of compute nodes using Kubernetes" (2021-01-25) で行われた。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | G-Research でリポジトリ作成 (2019-06-19、GitHub REST API)。 |
| 2021 | CNCF ブログで公開紹介 (2021-01-25)。 |
| 2022 | CNCF Sandbox プロジェクトとして受理 (2022-07-25、CNCF プロジェクトページ)。 |
| 2026 | 活発にリリース。v0.21.6 を 2026-06-26 に公開 (GitHub REST API)。 |

## どう進化したか

Armada が CNCF に参加した際、ソースは `G-Research` GitHub org から専用の `armadaproject` org へ移動した。旧パスからのリダイレクトは現在も `armadaproject/armada` に解決される。

内部設計は Apache Pulsar 上のイベントソーシングに落ち着いた。メッセージログが source of truth であり、各サブシステムはログを再生して状態を復元する (`docs/system_overview.md:62-70`)。submit パスがこれを体現している。ジョブ投入は直接 DB に書かず、Pulsar にイベントを publish し、後で scheduler が引き取る (`internal/server/submit/submit.go:141`)。scheduler は全ジョブのインメモリ・トランザクショナル複製 (`JobDb`) を持ち、スケジューリングのホットループを PostgreSQL I/O から切り離している (`internal/scheduler/jobdb/jobdb.go:68`)。

## 現在地

Armada は活発にメンテナンスされている CNCF Sandbox プロジェクトである (受理 2022-07-25、CNCF プロジェクトページ)。リリースは頻繁で、基準コミット `85b582d` はタグ v0.21.5 (2026-06-17 リリース) の直後に位置し、v0.21.6 が 2026-06-26 に続いた (GitHub REST API)。実装は Go (`go.mod` は `go 1.26.1` を宣言) で、ビルドは `magefiles/` 配下の `mage` ベース。方向性は引き続き高スループットなマルチクラスタバッチスケジューリングで、G-Research が本番運用している (ADOPTERS.md:9)。
