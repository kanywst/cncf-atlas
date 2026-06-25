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
| 2026 | `v1.18.0` を直近の stable ラインとしてリリース。`v1.19.0-alpha.0` を master で cut。 |

## どう進化したか

Karmada は基本的な federation ツールから、自動化寄りのコントロールプレーンへ進んだ。スケジューラはレプリカを静的な重みや実残容量でクラスタ間に分割できるようになり、`karmada-scheduler-estimator` と `karmada-descheduler` が動的な再配置を支える。Lua ベースの Resource Interpreter Framework が追加され、任意の CRD を再コンパイルなしで Karmada に教えられるようになった。リポジトリには Flux, Argo, Ray, Kubeflow, Flink 向けのサードパーティインタプリタが同梱されている。Karmada インスタンスを `Karmada` CRD で宣言管理する `operator/` も導入された。これらの転換はコードベースの `pkg/scheduler`, `pkg/resourceinterpreter`, `operator/` に表れている ([karmada-io/karmada](https://github.com/karmada-io/karmada))。

## 現在地

ドキュメント基準コミット (`658499d`, 2026-06-22) 時点で、Karmada は CNCF Incubating プロジェクトであり、リリースは活発: `v1.18.0` が直近の stable リリース (2026-05-30)、`v1.19.0-alpha.0` が進行中。incubation 時点では CNCF が 20+ 国・60+ 組織から 500+ contributor、maintainer 7 名と公表していた。2026-06-24 時点で GitHub リポジトリは 5,503 stars / 1,149 forks ([CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/), [GitHub API](https://api.github.com/repos/karmada-io/karmada))。
