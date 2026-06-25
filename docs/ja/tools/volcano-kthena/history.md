# 歴史

## 起源

Kthena は CNCF のバッチスケジューラ [Volcano](https://www.cncf.io/projects/volcano/) から生まれた。Volcano の系譜は、Kubernetes に gang scheduling を足した kube-batch に遡る。kube-batch は 2019 年の KubeCon Shanghai で OSS 化され、2020 年 4 月に CNCF Sandbox 入りし、2022-03-21 に Incubating へ昇格した ([CNCF blog](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/))。

Volcano のスケジューリングは AI 学習向けに作られていた。Kthena はそれを推論まで広げ、学習だけでなく AI ライフサイクル全体をカバーする。Kthena のリポジトリは 2025-05-08 に作成され、Volcano コミュニティが 2026-01-28 に Kthena を正式発表した。Volcano の起案元である Huawei Cloud が主導している ([CNCF blog](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/))。

Kthena は単独の CNCF プロジェクトではない。Volcano のサブプロジェクトであり、成熟度は Volcano の Incubating に従う。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | kube-batch が KubeCon Shanghai で OSS 化、のちに Volcano へ改名 |
| 2020 | Volcano が CNCF Sandbox 受理 (4 月) |
| 2022 | Volcano が CNCF Incubating へ昇格 (2022-03-21) |
| 2025 | Kthena リポジトリ作成 (2025-05-08)、v0.1.0 (2025-10-31)、v0.2.0 (2025-12-10) |
| 2026 | Kthena を Volcano コミュニティが発表 (2026-01-28)、v0.3.0 (2026-01-31)、v0.4.0 (2026-04-21) |

## どう進化したか

Kthena は約半年で 4 つのリリースを出した。v0.1.0 が 2025-10-31、v0.2.0 が 2025-12-10、v0.3.0 が公開発表と同時の 2026-01-31、v0.4.0 が 2026-04-21。pin したコミット `affd5be` は 2026-06-24 の `main` HEAD で、v0.4.0 より約 2 ヶ月後にあたり、それ自体にタグは付いていない。

2026 年 3 月時点で、Volcano コミュニティは Volcano v1.14・Kthena v0.3.0・AgentCube を束ねた AI-Native な統合スケジューリング基盤を打ち出し、Kthena をその推論サービング担当として位置づけた ([Beyond Batch](https://www.cncf.io/blog/2026/03/23/beyond-batch-volcano-evolves-into-the-ai-native-unified-scheduling-platform/))。

## 現在地

リリースは v0.1.0 から v0.4.0 まで、おおむね 1〜2 ヶ月ごとと頻繁。プロジェクトは新しく、1.0 前。開発は Volcano コミュニティの下で Huawei Cloud が主導している ([CNCF blog](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/))。掲げる方向性は、Volcano の gang scheduling と Kthena の推論オーケストレーションを 1 つの AI-Native スケジューリング基盤の一部にすることだ ([Beyond Batch](https://www.cncf.io/blog/2026/03/23/beyond-batch-volcano-evolves-into-the-ai-native-unified-scheduling-platform/))。
