# 歴史

## 起源

OpenCost は Kubecost が作ったコスト按分エンジンから生まれた。リポジトリ自体は 2019-03-27 まで遡り、当時は Kubecost の `cost-model` リポジトリだった。2022 年にこのエンジンが切り出され、ベンダー中立なオープン標準として再出発した。文書化された仕様 (OpenCost Specification) と、そのリファレンス実装の組み合わせである。仕様は Adobe・AWS・Google・Microsoft・New Relic・SUSE・Mindcurv・D2iQ・Armory らの企業グループで策定された。狙いは、Kubernetes のコスト監視を特定ベンダーの定義に依存させないことだった。解こうとした課題は具体的だ。クラウドの請求書はアカウントが何を使ったかは教えてくれるが、ある namespace・チーム・1 つの pod がいくらかかったかは教えてくれない。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | リポジトリ作成 (2019-03-27)、当初は Kubecost の `cost-model` |
| 2022 | OpenCost をオープン仕様とエンジンとして発表、CNCF Sandbox 受理 (2022-06-17) |
| 2024 | Kubecost が IBM に買収、OpenCost が CNCF Incubating へ昇格 (2024-10-25、KubeCon NA で発表) |

## どう進化したか

Sandbox 期間中にスコープがクラスタ内按分を超えて広がった。Datadog・OpenAI・MongoDB Atlas などの外部コストを取り込むプラグインが追加された。Carbon (炭素) コスト監視と OCI サポートも続いた。データソース層も抽象化され、Prometheus はもはや唯一のバックエンドではなくなった。`collector-source` モジュールがその代わりを務められる。

ガバナンスの構図は 2024 年に変わった。Kubecost は IBM に買収され、Cloudability や Turbonomic とともに IBM FinOps Suite に組み込まれた。OpenCost は CNCF に残り、現在は IBM Kubecost・Randoli・クラウド各社にまたがるコミュニティが維持している。両者の本質的な関係は変わっていない。Kubecost 商用版の按分モデルは今も OpenCost エンジンの上に乗っており、OpenCost はその下にある仕様 + コアエンジンの層であり続けている。

## 現在地

OpenCost は CNCF Incubating プロジェクトだ。ドキュメント基準コミット時点の最新安定リリースは `v2.5.3` で、`v2.6.0-rc.0` 以降の作業は `develop` ブランチに入っている。コードベースは複数モジュールに分かれた Go workspace で (`github.com/opencost/opencost`・`/core`・`prometheus-source` と `collector-source` モジュール)、UI と Helm チャートは別リポジトリで管理される。プロジェクトが掲げる方向性は OpenCost Specification に固定されている。ベンダー中立でセルフホスト可能な Kubernetes コスト監視の定義であり、エンジンがそれを実装する、という姿勢だ。
