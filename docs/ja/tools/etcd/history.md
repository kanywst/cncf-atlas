# 歴史

## 起源

etcd は 2013 年に CoreOS で始まりました。最初のコミットは 2013-06-06、作者は Xiang Li です。Brandon Philips、Alex Polvi、Xiang Li はクラスタ協調のために Google Chubby と Apache ZooKeeper を検討しましたが、用途に合わず自作しました。設計は Chubby 論文を下敷きにしています [1] [2]。

名前は Unix の設定ディレクトリ `/etc` に「distributed」の `d` を足したもので、単一マシン向けの設定置き場を分散システム向けに安全にした、という含意です [2]。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2013 | CoreOS で最初のコミット (Xiang Li) [1] [2] |
| 2015 | 最初の安定版 v2.0.0 [2] |
| 2016 | v3.0.0 でストアを gRPC と MVCC バックエンドへ刷新 [2] |
| 2018 | CoreOS が Red Hat に買収。同年 CNCF へ寄贈し 2018-12-11 に Incubating として受理 [2] [3] |
| 2020 | 2020-11-24 に CNCF Graduated [1] [3] |

## どう進化したか

最大の転換は 2016 年の v2 から v3 へのリライトです。v3 は JSON over HTTP の API を gRPC に置き換え、ストアを bbolt 上の MVCC へ移しました。これが revision ベースの読み・watch・compaction を可能にしています [2]。Kubernetes が etcd を主キーバリューストアに採用したことで利用が急増し、コントロールプレーンのデータストアとして求められる規模と安定性へとプロジェクトを押し上げました [2]。

ガバナンスは所有権とともに動きました。CoreOS は 2018 年に Red Hat に買収され、同年プロジェクトは CNCF へ寄贈され、2018-12-11 に Incubating として参加しました [2] [3]。2020 年の卒業時にはメンテナは 10 名に増え、Alibaba、Amazon、Cockroach Labs、Google Cloud、IBM、Indeed、Red Hat などの組織に分散していました。これは CNCF の卒業基準が求める多様性です [1] [3]。

## 現在地

ドキュメント基準コミット時点で、リポジトリは Go 1.26 を対象とし (`go.mod:1-4`)、raft 実装は別モジュール `go.etcd.io/raft/v3` にあります (`go.mod:37`)。pin したコミット `61d518f` は `main` 上にあり、`v3.8.0-alpha.0` タグから 50 コミット先行しています。最新安定版は 3.6.x 系、3.7 系はリリース候補段階です。プロジェクトは CNCF Graduated で、複数企業にまたがるグループが維持しています [1] [3]。
