# 歴史

## 起源

Fluid は 2020 年に南京大学・Alibaba Cloud・Alluxio コミュニティの共同プロジェクトとして始まった。Kubernetes 上のクラウドネイティブな計算と、リモートのオブジェクトストアや分散ファイルシステムにあるデータとのギャップを埋めることが狙いだった。最初のリリース `v0.1.0` は 2020-08-30 に公開された ([releases](https://github.com/fluid-cloudnative/fluid/releases)、[CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/))。

解こうとした課題はこうだ。AI や分析ジョブは同じ大規模データセットを何度も読むのに、Kubernetes はストレージを静的なマウントとして扱う。Fluid の答えは、データセットを自前のキャッシュ・ライフサイクル・スケジューリングヒントを持つ Kubernetes オブジェクトにすることだった。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | プロジェクト発足。最初のリリース `v0.1.0` (2020-08-30)。 |
| 2021 | CNCF Sandbox 入り (CNCF プロジェクトページは受理日を 2021-04-28 と記載)。 |
| 2024 | CNCF 2024 Technology Landscape Radar で "Adopt" 区分。 |
| 2025 | リリース `v1.0.8` (2025-10-31) が ThinRuntime 経由で 3FS / Curvine ストレージ対応を追加。 |
| 2026 | CNCF Incubating へ昇格 (CNCF プロジェクトページ: 2026-01-08、告知 2026-03-24)。 |

## どう進化したか

Fluid は Alluxio 中心の単一オペレータから、マルチエンジンのフレームワークへ育った。`Runtime` 抽象は今や Alluxio・JuiceFS・JindoCache・Vineyard・EFC をカバーし、加えてサードパーティが自前のキャッシュやストレージを差し込める汎用の `ThinRuntime` を持つ。`v1.0.8` リリースは ThinRuntime を使って 3FS と Curvine を追加した。これは毎回新しい組み込みエンジンを必要とせず、拡張モデルが意図通り機能していることを示す ([CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/))。

キャッシュにとどまらず、スコープはデータ操作にも広がった。`DataLoad` (プリフェッチ)・`DataBackup`・`DataMigrate`・`DataProcess` といった専用 CRD (`api/v1alpha1/`) が、Fluid を「キャッシュをマウントする」ものから、データセットを移動・準備する小さなプラットフォームへ変えた。

## 現在地

Fluid は 2026 年 1 月時点で CNCF Incubating プロジェクトである ([CNCF プロジェクトページ](https://www.cncf.io/projects/fluid/))。CNCF の告知は昇格時点で 28 リリースと約 1.9k の GitHub スターを挙げている ([CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/))。最新タグは `v1.0.8` (2025-10-31)。ガバナンスの役割 (committer・maintainer) はリポジトリの `GOVERNANCE.md` に記載されている。
