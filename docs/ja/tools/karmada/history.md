# 歴史

## 起源

Karmada は Huawei Cloud 主導のマルチクラスタの取り組みから生まれ、大規模ユーザー群と共同で発起された: First Automobile Works, ICBC, SPD Bank, Qutoutiao, VIPKid, xiaohongshu。非推奨となった Kubernetes KubeFed (federation v2) の後継と位置づけ、Kubernetes ネイティブ API を保ちつつ、独立した propagation/override ポリシーとクラスタ横断スケジューリングを追加した ([CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | プロジェクト発足。Huawei Cloud と複数の大規模ユーザーが共同発起。 |
| 2021 | CNCF Sandbox プロジェクトに採択 (2021-09-14)。 |
| 2023 | CNCF Incubating に昇格 (2023-12-12)。 |
| 2025 | 正式な Adopter Group プログラムを発足 (2025-03)。 |
| 2026 | `v1.18.0` をリリース (2026-05-30)。 |
| 2026 | `v1.19.0` をリリース (2026-08-31)。分散 AI 学習ジョブ向けのマルチコンポーネントスケジューリングが前進し、優先度ベースのスケジューリングが Beta に上がってデフォルト有効になった ([CNCF アナウンス](https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/))。 |
| 2026 | CNCF Graduated に。TOC 投票が 2026-09-03 に締切 ([cncf/toc#1572](https://github.com/cncf/toc/issues/1572))、昇格手続きが 2026-09-04 に完了 ([cncf/toc#2289](https://github.com/cncf/toc/issues/2289))、CNCF が 2026-09-08 に上海の KubeCon + CloudNativeCon China で発表。 |

## どう進化したか

Karmada は基本的な federation ツールから、自動化寄りのコントロールプレーンへ進んだ。スケジューラはレプリカを静的な重みや実残容量でクラスタ間に分割できるようになり、`karmada-scheduler-estimator` と `karmada-descheduler` が動的な再配置を支える。Lua ベースの Resource Interpreter Framework が追加され、任意の CRD を再コンパイルなしで Karmada に教えられるようになった。リポジトリには Flux, Argo, Ray, Kubeflow, Flink 向けのサードパーティインタプリタが同梱されている。Karmada インスタンスを `Karmada` CRD で宣言管理する `operator/` も導入された。これらの転換はコードベースの `pkg/scheduler`, `pkg/resourceinterpreter`, `operator/` に表れている ([karmada-io/karmada](https://github.com/karmada-io/karmada))。

## 現在地

Karmada は 2026 年 9 月に CNCF Graduated になった。そのために第三者によるセキュリティ監査を済ませ、正式な steering committee を設け、CNCF の Code of Conduct を採用した。発表では 292 組織にまたがる 1,214 人超の contributor がおり、maintainer は 6 組織から出ている ([CNCF アナウンス](https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/))。

ドキュメント基準コミット (`aad59e1`, 2026-11-13) 時点の最新 stable リリースは `v1.19.1` (2026-10-31)。同じ日にパッチリリース `v1.18.4` と `v1.17.7` も出ており、3 つのマイナーラインに並行して修正が入る。現在のプレリリースは `v1.20.0-beta.0`。`v1.19.0` の機能の裏にある feature gate は、このコミットでは次のとおり: `PriorityBasedScheduling` は Beta でデフォルト有効、`PriorityBasedPreemptiveScheduling` と `MultiplePodTemplatesScheduling` はまだ Alpha でデフォルト無効 (`pkg/features/features.go:186,187,192`)。2026-11-16 時点で GitHub リポジトリは 5,765 stars / 1,252 forks ([GitHub releases](https://github.com/karmada-io/karmada/releases), [GitHub API](https://api.github.com/repos/karmada-io/karmada))。
