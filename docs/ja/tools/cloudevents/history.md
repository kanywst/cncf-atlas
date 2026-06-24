# 歴史

## 起源

CloudEvents は CNCF Serverless Working Group から生まれた。このグループは 2017 年初頭に CNCF 技術監督委員会 (TOC) が発足させたものだ。グループが取り組んだ課題は Function-as-a-Service プラットフォームのベンダーロックインだった。各プロバイダが独自のイベントペイロード形状で関数を提供していたため、あるクラウド向けに書いた関数は、グルーコードを書き直さない限り別のクラウドのイベントを消費できなかった。グループはこれを緩和する共通イベントフォーマットを提言し、具体的な仕様作業は Serverless WG 配下で 2017 年 12 月に始まった (出典 4、6)。

プロジェクトは 2018-05-15 に CNCF Sandbox に入り、CloudNativeCon EU 2018 で公表された。当初から Google・Microsoft・IBM・Red Hat・Oracle・Huawei らが参加した (出典 4)。Microsoft は 2018 年 4 月ごろ、Azure Event Grid で v0.1 ドラフトの最初の実装を出荷した (出典 9)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | CNCF Serverless WG 発足。12 月に仕様作業を開始 (出典 4、6) |
| 2018 | 2018-05-15 に CNCF Sandbox 受理。Azure Event Grid で最初の v0.1 実装 (出典 4、9) |
| 2019 | 6 月の v0.3 で属性モデルを簡素化。2019-10-28 に v1.0 リリースと同時に Incubation 昇格 (出典 4、6) |
| 2020 | v1.0.1 で WebSocket binding 追加 (2020-12-10) (出典 2) |
| 2022 | v1.0.2 で specs リポジトリ再編 (2022-02-05)。Trail of Bits がセキュリティ評価を実施 (出典 2) |
| 2024 | 2024-01-25 に CNCF Graduated 昇格。CloudEvents SQL (CESQL) が 2024-06-13 に V1 到達 (出典 2、3) |

## どう進化したか

仕様は実験的な属性モデルから安定したモデルへと移った。v0.3 はネストした属性 map を廃し、batching と error handling を簡素化した (出典 6)。v1.0 はコアのコンテキスト属性とプロトコルバインディング (HTTP ほか) を凍結し、これが今も実装が targets するコントラクトになっている (出典 4)。以降の 1.0.x リリースは、コアを変えずに WebSocket などのトランスポートバインディングを追加した (出典 2)。

スコープはエンベロープを超えて広がった。CloudEvents SQL (CESQL) はイベントをフィルタ・クエリするための SQL 風の式言語を加え、2024 年 6 月に V1 に到達した (出典 2)。Go SDK もこれを反映している。コアは `v2/` 配下にあり、CESQL はトップレベルに独自の `sql/` ツリーを持つ。

ガバナンスは仕様と歩調を合わせて成熟した。Incubation は 2019 年の v1.0 とともに来た。Graduation は 2024 年 1 月、仕様が安定し、複数の SDK が出荷され、外部セキュリティレビューが完了した後に続いた (出典 2、3)。

## 現在地

CloudEvents は CNCF Graduated プロジェクトだ。仕様リポジトリが真実の源泉であり、プロジェクトは Go・JavaScript/TypeScript・Java・C#・Python・Ruby・PHP・PowerShell・Rust の SDK を維持している (出典 1、5)。なかでも Go SDK が最も普及している。最新のリリースタグは `v2.16.2` (2025-09-22) で、本ディープダイブはそのタグより先の `main` のコミット `1e99396` (2026-06-19) を読む (出典 1)。CNCF Graduation 発表によれば、仕様には 122 組織から 340 名超の contributors が関与した (出典 3)。
