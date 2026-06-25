# 歴史

## 起源

Strimzi は 2017 年に Red Hat 社内で始まった。3 人の開発者が、Apache Kafka のようなステートフルワークロードを Kubernetes でどう動かすかを検討した ([Red Hat Developer](https://developers.redhat.com/articles/2024/06/26/open-innovation-red-hats-impact-kafka-and-strimzi-ecosystem))。最初の公開リリース `0.1.0` は 2018 年 1 月で、実体は Docker イメージと Kubernetes YAML の集まりだった。2018 年 3 月の `0.2.0` で、現在の Operator パターンらしい形に初めてなった ([Strimzi incubation ブログ](https://strimzi.io/blog/2024/02/08/strimzi-incubation/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | Red Hat が 3 人の開発者で Kafka on Kubernetes の検討を開始 |
| 2018 | `0.1.0` (Docker イメージ + YAML)、`0.2.0` で Operator パターンを採用 |
| 2019 | CNCF に寄贈し、2019-08-28 に Sandbox として受理 |
| 2024 | 2024-02-08 に CNCF Incubating へ昇格 |

## どう進化したか

プロジェクトはイメージとマニフェストの集まりから、カスタムリソースから Kafka クラスタを reconcile する完全な Operator へと移行した。2019-08-28 に CNCF Sandbox として受理され ([CNCF projects](https://www.cncf.io/projects/strimzi/))、2024-02-08 に Incubating へ昇格した。昇格時点で、1600 名超のコントリビュータ、180 超の貢献組織、15 の public adopters を発表した ([CNCF ブログ](https://www.cncf.io/blog/2024/02/08/strimzi-joins-the-cncf-incubator/))。

直近の最大の転換は Apache Kafka 本体に追随したものだ。このコミットのコードは ZooKeeper を完全に廃止し KRaft only で動く。Kafka 4.x (ここでは 4.3.0、`pom.xml:87`) が KRaft only だからである。KRaft のメタデータ処理は `KRaftMetadataManager.java` と `KRaftVersionChangeCreator.java` が担う。`Kafka` カスタムリソースは `v1` API バージョンに到達しており (`api/src/main/java/io/strimzi/api/kafka/model/kafka/Kafka.java:80`)、以前の `v1beta2` から昇格した。これが 1.0 メジャーリリース系に対応する。

## 現在地

Strimzi は CNCF Incubating プロジェクトで、ガバナンスは独立した [governance リポジトリ](https://github.com/strimzi/governance/blob/main/GOVERNANCE.md) で中立的に定義されている。固定コミット `9505103` (2026-06-23) は、安定版 `1.0.1` (2026-06-17) の後、`1.1.0-rc1` (2026-06-22) 付近の `main` 上にある。リリースは upstream の Apache Kafka バージョンに追随する形で定期的に続いている。
