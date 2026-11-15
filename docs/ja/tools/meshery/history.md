# 歴史

## 起源

Meshery は 2019 年、サービスメッシュを中心に活動するコミュニティ Layer5 の Lee Calcote とチームが作った ([CNCF ブログ](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/))。GitHub リポジトリの作成は 2018-11-14、最初のタグ付きリリース `v0.0.1` は 2019-07-03 である ([GitHub API](https://api.github.com/repos/meshery/meshery)、[リリース](https://github.com/meshery/meshery/releases))。

出発点の課題は、サービスメッシュを選んで運用することだった。Istio、Linkerd、Consul などはそれぞれ独自のインストール手順と設定方法を持っていた。Layer5 は Meshery を「service mesh management plane」と呼び、IT チームがどのメッシュを使うか決めやすくすることを狙いに挙げた。Meshery が CNCF に入る際、Layer5 はメッシュのベンチマーク仕様である Service Mesh Performance (SMP) も寄贈した ([Layer5 ニュース、2021-10-14](https://layer5.io/company/news/cncf-adopts-meshery-to-advance-service-mesh-management/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | 最初のリリース `v0.0.1` (2019-07-03) |
| 2020 | CNCF Landscape に掲載 (2020-06-01、[Layer5 ブログ](https://layer5.io/blog/announcements/meshery-lands-in-the-cncf-landscape)) |
| 2021 | `v0.5.0` (2021-03-24)。2021-06-22 に CNCF Sandbox 受理、10 月の ServiceMeshCon で公表 |
| 2022 | `v0.6.0` (2022-08-24) |
| 2023 | `v0.7.0` (2023-12-08) |
| 2024 | 2024-03-01 に Incubation 申請 ([cncf/toc#1264](https://github.com/cncf/toc/issues/1264))、2024-07-31 に [cncf/toc#1386](https://github.com/cncf/toc/issues/1386) として出し直し。`v0.8.0` (2024-12-20) |
| 2026 | 2026-03-23 に KubeCon EU で v1.0 を発表 ([Meshery ブログ](https://meshery.io/blog/meshery-v1.0-general-availability/))。GitHub リリース `v1.0.0` の公開は 2026-03-24 |
| 2026 | 2026-09-14 に Incubating への TOC 投票が可決。CNCF の発表は 2026-10-07 |

リリース日は [GitHub のリリースページ](https://github.com/meshery/meshery/releases) による。Sandbox と Incubating の日付は [CNCF プロジェクトページ](https://www.cncf.io/projects/meshery/) と [`landscape.yml`](https://github.com/cncf/landscape/blob/master/landscape.yml) の Meshery 項目と一致する。

## どう進化したか

対象範囲はメッシュからインフラ全般へ広がった。技術ごとの **adapter** (meshery-istio のような別の gRPC サービスで、メッシュごとにポートを持つ) は単一の技術向けの操作を受け持つ ([Architecture docs](https://docs.meshery.io/concepts/architecture))。一方で、ほとんどのリソース種別はデータとして記述される。**model** は、ある技術のコンポーネントとその間の関係を定義する JSON ファイルのディレクトリである。基準コミットのリポジトリは `models/` 以下に 479 個の model ディレクトリを同梱し、その多くは Artifact Hub 上の Helm chart から生成されている ([内部実装](./internals) を参照)。README は今、Meshery を Kubernetes ベースのインフラ向けの「self-service engineering platform」「cloud native manager」と紹介している ([README](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/README.md))。

v1.0 ではプロジェクトの組織の仕方も変わった。コードは 2 つの GitHub organization に分かれた。`meshery` はコアプラットフォーム (サーバ、UI、CLI、Operator、MeshSync)、`meshery-extensions` は 300 以上の統合、adapter、ツールの置き場である。同じリリースで Certified Meshery Contributor プログラムも始まった ([Meshery ブログ](https://meshery.io/blog/meshery-v1.0-general-availability/))。`GOVERNANCE.md` は両 organization にまたがる役割を定めている ([GOVERNANCE.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/GOVERNANCE.md))。

サーバ内部では、design 内の関係を評価するエンジンが Open Policy Agent (Rego) のポリシーとして書かれていた。2026 年 4 月にこれが Go ネイティブに移植された ([コミット `31b22b91`](https://github.com/meshery/meshery/commit/31b22b91c95a72df2fc456a8a45694ddcafc08d2))。両エンジンは今も共存し、環境変数で選ぶ。[内部実装](./internals) で両方を追う。

Incubating までは約 2 年半かかった。2025 年 1 月、TOC のレビュアは申請の未解決事項として、adopter のインタビュー用の提出がまだであることや、ロードマップが公開されていないことを挙げた ([cncf/toc#1386](https://github.com/cncf/toc/issues/1386))。投票は 2026-09-14 に締め切られ、binding 票は賛成 8、反対 0、棄権 1 だった。

## 現在地

Meshery は CNCF の Incubating プロジェクトである。リリースの周期は決まっていない。`master` への push のたびに下書きのリリースが更新され、それを手で公開する。そのため `v1.0.x` 系は 2026-11-13 の時点で `v1.0.79` まで進んでいる ([AGENTS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/AGENTS.md)、[リリース](https://github.com/meshery/meshery/releases))。`MAINTAINERS.md` のコアメンテナには Lee Calcote (Layer5) と、他の組織のメンテナが並ぶ ([MAINTAINERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/MAINTAINERS.md))。

CNCF の発表は今後の方向を次のように挙げる。より細かい Kubernetes RBAC を伴うマルチクラスタ・フリート管理、レジストリとクラスタ状態に読み取り専用でアクセスする Meshery MCP サーバ、分散性能試験、そしてポリシー駆動の構成管理のためのワークフローエンジンを備えた、より統制されたレジストリである ([CNCF ブログ](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/))。
