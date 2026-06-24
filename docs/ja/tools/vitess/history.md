# 歴史

## 起源

Vitess は 2010 年に YouTube 内部で始まった。MySQL はネイティブな水平シャーディングを持たず、YouTube の成長は単一 MySQL サーバの限界に当たっていた。発端は当時 YouTube のエンジニアだった Sugu Sougoumarane で、核となる発想はシャード選択ロジックをアプリから剥がし、アプリとデータベースの間に挟むプロキシへ寄せることだった ([出典 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/), [出典 7](https://vitess.io/docs/22.0/overview/history/))。

2011 年以降 Vitess は YouTube のデータベース基盤の中核となり、数万 MySQL ノード規模へ拡大した。GitHub への最初の公開コミットは 2012-02-24 である ([出典 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2010 | YouTube で MySQL を水平スケールさせるために発足 ([出典 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/)) |
| 2012 | GitHub への最初の公開コミット (2012-02-24) ([出典 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/)) |
| 2018 | CNCF に incubating プロジェクトとして受け入れ (2018-02-05) ([出典 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/)) |
| 2019 | CNCF 出資のセキュリティ監査を通過 (2019-02)、8 番目の卒業プロジェクトとして CNCF 卒業 (2019-11-05) ([出典 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/)) |

## どう進化したか

設計の中心は一貫して変わっていない。シャード選択をアプリから切り離し、ルーティングと管理をプロキシ層 (VTGate) に集約する点である ([出典 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/))。その周辺で育ったのがコントロールプレーンとデータ移動の仕組みだった。CNCF 卒業時点で v4.0 となり、実験的な VReplication サポートを同梱した。VReplication は現在リシャーディング・MoveTables・Materialize・オンライン DDL を支えるエンジンである ([出典 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/))。

コントリビュータも単一ベンダー起源から広がった。最初の 2 年はほぼすべてのコードが Google (YouTube) 由来だった。2020-04 時点では上位が Google 36%、PlanetScale 25% だった ([出典 5](https://www.cncf.io/reports/vitess-project-journey-report/))。

## 現在地

Vitess は CNCF Graduated プロジェクトである ([出典 4](https://www.cncf.io/projects/vitess/))。メジャーリリースにタグを付けており、本コミット直前の最新リリースタグは `v24.0.1` (2026-05-07) だった。pinned した `main` の HEAD は `go/vt/servenv/version.go:22` で `25.0.0-SNAPSHOT` を報告しており、v25 が開発中であることを示す。ガバナンスはリポジトリ内の `GOVERNANCE.md`・`STEERING.md`・`MAINTAINERS.md`・`GUIDING_PRINCIPLES.md` に文書化されており、卒業プロジェクトに CNCF が求める透明なガバナンス要件を満たす。
