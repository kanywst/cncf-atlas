# 歴史

## 起源

Longhorn は Rancher Labs で始まった。先に存在したのは data plane だ。`longhorn/longhorn-engine` リポジトリは 2016-04-08 に作られ、傘の `longhorn/longhorn` リポジトリは 2017-04-14 に続いた。Rancher は 2017 年 4 月、コンテナ向けの新しい分散ブロックストレージとして公に紹介し、共同創業者の Sheng Liang がそのアイデアを提示した ([出典 5](https://www.rancher.com/blog/2019/longhorn-accepted-into-cncf/)、[出典 4](https://www.cncf.io/projects/longhorn/))。

この系譜はコードを読むうえで重要だ。ストレージコントローラが先に存在し、Kubernetes 連携 (`longhorn-manager`) は後から CRD とコントローラ群として被せられた。だから manager の `README.md` は自身を "Manager for Longhorn" としか説明せず、data plane が manager 本体ではなく兄弟リポジトリに置かれている。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | `longhorn-engine` リポジトリ作成 (2016-04-08)、オリジナルのストレージコントローラ。 |
| 2017 | 傘の `longhorn/longhorn` リポジトリ作成 (2017-04-14)、Rancher が Longhorn を公に発表。 |
| 2019 | CNCF に寄贈され Sandbox プロジェクトとして受理 (2019-10-11)、version 0.6.2。 |
| 2020 | Rancher が SUSE に買収され、SUSE が主スポンサーに。 |
| 2021 | CNCF TOC が Incubating へ昇格 (2021-11-04)。 |
| 2026 | `v1.12.0` リリース (2026-06-02)、本ディープダイブ時点の最新リリース。 |

## どう進化したか

2019 年 10 月に CNCF Sandbox へ寄贈された時点で、v0.6.2 はすでにスナップショット、バックアップ/リストア、live upgrade、ディザスタリカバリ、ワンクリックインストール、GUI を備えていた ([出典 6](https://devclass.com/2019/10/29/cncf-welcomes-longhorn-to-its-sandbox/)、[出典 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/))。2020 年の SUSE による Rancher 買収でスポンサーシップが移り、商用版は現在 "SUSE Storage (powered by Longhorn)" となっている ([出典 7](https://www.suse.com/c/persistent-block-storage-for-kubernetes-suse-storage-powered-by-longhorn/))。

現在のソースで最も大きい技術的転換は v2 Data Engine だ。従来の v1 エンジンは iSCSI と `tgt` の上に構築される。近年のリリースは SPDK ベースの v2 data engine を加えた。分岐はコード全域に及び、`types.IsDataEngineV2(volume.Spec.DataEngine)` が別系統の teardown パスをゲートし (`controller/volume_controller.go:365`)、`ublk` frontend が従来の `blockdev` / `iscsi` frontend と並んでボリューム CRD に現れる (`k8s/pkg/apis/longhorn/v1beta2/volume.go:256`)。

## 現在地

Longhorn は 2021-11-04 に CNCF Incubating へ昇格した。CNCF は寄贈以降の成長を提示している。contributor は 30 社 200 名から 120 社以上 800 名超へ、committer は 3 社 14 名から 13 社以上 70 名超へ、稼働ノードは 2,700 から 34,000 以上へ ([出典 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/))。執筆時点の最新リリースは `v1.12.0` (2026-06-02)、ここで読んだコミット `3b8885a` はそれ以降の `master` 上の地点だ。SUSE が引き続き主要な企業スポンサーである。
