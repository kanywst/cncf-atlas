# 歴史

## 起源

Rook は 2016-07-08 に GitHub プロジェクトとして始まった ([rook/rook](https://github.com/rook/rook))。創始者は後に Upbound を設立し率いる Bassam Tabbara で、初期は Quantum が支援した ([Upbound ブログ](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable))。方針は意図的だった。コンテナ向けの新しいストレージシステムを書くのではなく、長い本番実績を持つ分散ストレージシステムである Ceph を取り込み、Kubernetes が宣言的に運用できる第一級のクラウドネイティブサービスにする ([Upbound ブログ](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable), [rook.io](https://rook.io/))。

この選択がその後のすべてを形づくった。Rook はコントロールプレーン (Ceph デーモンをどう deploy・設定・アップグレードするか) を担い、データパスは Ceph とその CSI ドライバに委ねる。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | リポジトリ作成。Bassam Tabbara が創始、Quantum が初期スポンサー |
| 2018 | CNCF が 15 番目のホストプロジェクトとして受理。CNCF 初のストレージプロジェクト |
| 2019 | CNCF Security SIG の監査で 13 件 (High から Low) の指摘。すべて対応済み |
| 2020 | CNCF Graduated に昇格。block/file/object ストレージで初 |

## どう進化したか

初期の Rook は Ceph を超えて手を広げていた。v0.9 以前は CockroachDB と Minio もサポートし、その後のリリースで NFS・Cassandra・EdgeFS といったストレージプロバイダを追加した ([Upbound ブログ](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable))。この広がりは続かなかった。プロジェクトは唯一サポートするバックエンドとして Ceph に収斂し、Cassandra と NFS のプロバイダは別リポジトリへ分離された ([Upbound ブログ](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable))。今日のオペレータコードは Ceph 一本への集中を反映している。

成長はスコープの絞り込みと並行した。CNCF incubation の間に core リポジトリのコントリビュータ数は 90 から 279 へ、260% 増えた ([CNCF 卒業発表](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/))。2019 年の CNCF Security SIG による監査は High から Low の重大度の指摘を含み、卒業に先立って対応・修正された ([CNCF 卒業発表](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/))。

Rook は 2018 年 1 月に CNCF の 15 番目のホストプロジェクト、かつ財団初のストレージプロジェクトとして参加した ([CNCF ブログ](https://www.cncf.io/blog/2018/01/29/cncf-host-rook-project-cloud-native-storage-capabilities/))。2020-10-07 に Graduated に到達し、block・file・object ストレージで初の卒業プロジェクトとなった ([CNCF 卒業発表](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/))。

## 現在地

Rook は CNCF の卒業プロジェクトで、steering committee には Travis Nielsen (Red Hat) と Jared Watts (Independent/Upbound) が含まれ、leseb・BlaineEXE・satoru-takeuchi・subhamkrai・sp98 らがアクティブなメンテナである ([OWNERS.md](https://github.com/rook/rook/blob/master/OWNERS.md))。Rook は Red Hat OpenShift Data Foundation の基盤であるため、Red Hat の比重が大きい。リリースは定期的で、ここでドキュメント化したコミット `63eed4e` (2026-06-19) は `v1.20.1` タグ (2026-06-16) の直後に位置する ([rook/rook](https://github.com/rook/rook))。
