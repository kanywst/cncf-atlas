# 歴史

## 起源

Microcks は Laurent Broudoux が 2015 年 2 月に個人のサイドプロジェクトとして開始した。GitHub リポジトリの `created_at` は `2015-02-23` で、開始時期に関する本人の説明と一致する (出典 1, 6)。当時 Broudoux は Red Hat に在籍しており、プロジェクトは長く Red Hat の開発者エコシステムと近い関係にあった (出典 6)。

当初のアイデアは、プロトコルを問わず、カスタムコードを 1 行も書かずに任意の API 依存をシミュレートすることだった。green-field でも legacy でも、全エンタープライズサービスのモックとテストを 1 つのツールに統合する狙いである (出典 6)。1.0.0 リリースは、18 ヶ月前に掲げたビジョンの実現だと Broudoux 本人が記している (出典 6)。

Yacine Kheddache が共同創業者兼コミュニティリードとして加わった。両創業者は現在 Postman がスポンサーであり、Postman がプロジェクトの主要スポンサーである (出典 1)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | 最初のコミット。個人のサイドプロジェクトとして開始 (出典 1, 6) |
| 2018 | 1.0.0 リリース。当初ビジョンの実現と位置づけ (出典 6) |
| 2023 | CNCF Sandbox 受理 (2023-06-22) (出典 2, 3) |
| 2026 | TOC 投票を経て CNCF Incubating へ昇格 (CNCF ブログ, 2026-05-07) (出典 2, 4) |

## どう進化したか

Microcks は REST/SOAP のモック生成器から多プロトコルプラットフォームへ成長した。コードベースは今や REST、SOAP、GraphQL、gRPC のモックコントローラに加え、Kafka、MQTT、AMQP、NATS、Google Pub/Sub、Amazon SNS、Amazon SQS をまたぐイベント駆動 (AsyncAPI) プロトコル専用の Quarkus 製 async minion を備える ([アーキテクチャ](./architecture) 参照)。

より新しい追加は API ツールの潮流を反映している。モックを Model Context Protocol サーバとして公開するコントローラ (`McpController`) と、OpenAI 連携の AI Copilot (`AICopilotController`) で、いずれも基準コミットの web レイヤに存在する。

ガバナンスは単独著者のプロジェクトからベンダー中立な CNCF モデルへ移行した。プロジェクトは Maintainer / Code Owner / Contributor / Adopter の 4 階層の役割と、3 名のトップレベルメンテナを文書化している: Laurent Broudoux と Yacine Kheddache (ともに Postman スポンサー)、Sebastien Degodez (AXA France) (出典 1, 10)。

## 現在地

基準コミットでの `pom.xml` の version は `1.15.0-SNAPSHOT` で、2026-06-22 付けの `1.15.0-rc1` タグの直前に位置する。当時の最新安定リリースは `1.14.0` だった。プロジェクトは 2026 年 5 月時点で CNCF Incubating である。CNCF の昇格ブログは累計 645 contributors、2025 年のコンテナイメージ DL が 250 万超 (2024 の 3 倍)、公開 adopter 34 組織を挙げている (出典 2)。活動と contributor の指標は DevStats ([microcks.devstats.cncf.io](https://microcks.devstats.cncf.io/)) で公開追跡されている (出典 10)。
