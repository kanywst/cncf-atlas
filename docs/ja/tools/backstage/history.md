# 歴史

## 起源

Backstage は 2016 年、Spotify 社内で "System Z" というツールとして始まった。狙いは狭く具体的だった。どのサービス・ドキュメント・API を誰が所有し、それらがどう依存し合っているかを、エンジニアが 1 画面で引けるようにすることだ。Spotify が大きくなるにつれ、こうしたオーナーシップと依存の情報は散在し、それを探すこと自体がエンジニアの時間を奪っていた (S3)。

Spotify が 2020-03-16 にプロジェクトを OSS 化した時点で、社内版はすでに実規模で動いていた。280+ チームが 2,000+ のバックエンドサービスなどを追跡するのに使っていた (S3)。公開版は alpha として始まった。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | Spotify 社内ツール "System Z" として開始 (S3) |
| 2020-03-16 | Spotify が alpha として OSS 化 (S3) |
| 2020-09-08 | CNCF Sandbox に受理 (S4, S5) |
| 2022-03-15 | TOC 投票で CNCF Incubating へ昇格 (S5, S9) |
| 2024 | フロント/バックエンドの再アーキテクチャが進行、ベンダー多様化が graduation の課題として挙がる (S6) |
| 2025-04 | 公開 5 周年。Spotify が OSS 本体上に商用 "Spotify Portal for Backstage" を提供 (S7) |

## どう進化したか

決定的な構造変化は新しいプラグインシステムへの移行である。リポジトリ自身の `.claude/CLAUDE.md` に記されているとおり、3 世代のパッケージがモノレポに同居している。`core-*` パッケージ (例 `@backstage/core-plugin-api`) は旧フロントエンドシステム、`frontend-*` パッケージ (例 `@backstage/frontend-plugin-api`) は新フロントエンドシステム、`backend-*` パッケージ (例 `@backstage/backend-plugin-api`) は新バックエンドシステムだ。この再アーキは graduation の取り組みと結びついている。graduation 前に、よりきれいな拡張面を手に入れるためのものだ (S6)。

もう 1 つの変化はガバナンスとコントリビュータ層だ。KubeCon EU 2024 で挙がった主な graduation の懸念は、貢献が Spotify に大きく偏っていることだった。Red Hat の参画が、ベンダー多様化が進んでいる証拠として引かれた (S6)。graduation はまだ実現していない。

カタログモデルも成長を続けている。`packages/catalog-model/src/kinds/` に最近追加された kind には `AiResourceEntityV1alpha1` と `McpServerApiEntity` があり、バックエンドにも `plugin-mcp-actions-backend` と `catalog-backend-module-ai-model` が入った。AI と MCP 連携への拡張を示している。

## 現在地

Backstage は頻繁にリリースする。pin したコミットでは root `package.json` の version が `1.53.0-next.0` (2026-06-23)、直近の安定版は `v1.52.0` (2026-06-16) で、minor バージョンはおよそ月次で出て、その間に `-next` プレリリースが挟まる (S1)。プロジェクトは引き続き CNCF Incubating で、プラットフォームエンジニアリングと社内開発者ポータルの事実上の OSS 標準として広く扱われている。CNCF の velocity ランキングでは、寄贈年の 2020 に 100+ プロジェクト中 8 位だったのが、2025 には 230+ 中 6 位まで上がった (S8)。
