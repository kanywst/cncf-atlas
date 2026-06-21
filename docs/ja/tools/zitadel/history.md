# 歴史

## 起源

ZITADEL は、2019 年にスイス St. Gallen で創業した CAOS AG が開発した。創業者は Florian Forster (CEO)、Fabienne Bühler、Maximilian Panne ら、identity / インフラ出身者 ([About ZITADEL](https://zitadel.com/about))。GitHub リポジトリの作成日は 2020-03-16 ([GitHub repo metadata](https://api.github.com/repos/zitadel/zitadel))。

掲げた目標は、Auth0 の開発者体験と Keycloak のセルフホスト自由度を両立させ、マルチテナンシーを後付けではなく初期からの第一級の設計性質にすること。これを実現するために Go とイベントソーシングのアーキテクチャを選んだ ([About ZITADEL](https://zitadel.com/about))。スイス本拠であること自体も、金融・医療・行政向けのデータ主権の訴求点になっている。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | CAOS AG をスイス St. Gallen で創業 ([About](https://zitadel.com/about)) |
| 2020 | GitHub リポジトリを 2020-03-16 に作成 ([repo metadata](https://api.github.com/repos/zitadel/zitadel)) |
| 2022 | Seed の後、Nexus Venture Partners リードで $9M の Series A (Floodgate 参加)。当時「150 社以上」「10k+ stars」を主張 ([Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a)) |
| 2025 | v3 (2025-03-31): ライセンスを Apache-2.0 から AGPL-3.0 へ変更し、CockroachDB サポートを廃止して PostgreSQL に一本化 ([v3 announcement](https://zitadel.com/blog/zitadel-v3-announcement)) |
| 2026 | main 上で活発にリリース。タグ `v4.15.2` を 2026-06-17 に公開 ([repo](https://github.com/zitadel/zitadel)) |

## どう進化したか

決定的な転換は 2025 年 3 月の v3 で、2 つの大きな変更を同時に行った。第一に、未払いの商用再利用から守るためライセンスを Apache-2.0 から AGPL-3.0-only へ変更。一方で生成された gRPC client コードに copyleft が伝播しないよう、`proto/` 定義と SDK は寛容なライセンスのまま残した ([Moving to AGPL](https://zitadel.com/blog/apache-to-agpl)、[LICENSING.md](https://github.com/zitadel/zitadel/blob/main/LICENSING.md))。第二に、CockroachDB サポートを廃止し PostgreSQL を唯一のサポート DB とした。既存の v2.x CockroachDB 構成は 2025-09-30 までメンテナンスのみの扱いとされた ([Key Changes in Version 3](https://github.com/zitadel/zitadel/discussions/9529))。

各ラウンドを通じた累計調達額は約 $15.5M ([Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a))。コードベースには `backend/v3/` 配下に進行中の次世代バックエンドも見え、`main.go` は既にその instrumentation を import している。完成したリライトというより、継続中の内部再構築だ。

## 現在地

ZITADEL は頻繁にリリースしており、2026 年半ばには v4 系のポイントリリースが続き、リポジトリには `v5.0.0-base` の version タグも存在する。開発は会社主導 (旧 CAOS AG、現 ZITADEL) で、中立的な財団ガバナンスを求めず、dual-license の商用自走モデルを採る。メンテナはこれを Keycloak の 2023 年 CNCF incubation 入りと明確に対比し、自走する OSS を自らの道として説明している ([Open Source in the AI Era](https://zitadel.com/blog/open-source-in-the-ai-era))。
