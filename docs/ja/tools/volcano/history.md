# 歴史

## 起源

Volcano は Huawei で Kubernetes 向けバッチスケジューラとして始まり、2019 年 6 月の KubeCon Shanghai で OSS 化された。経緯は [CNCF の Incubation 移行ブログ](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/)に書かれている。GitHub リポジトリの作成は 2019-03-14 (GitHub API)。スケジューラの中核は Kubernetes SIG-Scheduling のプロジェクト `kube-batch` (`kubernetes-sigs/kube-batch`) を土台にしており、[README](https://github.com/volcano-sh/volcano) に明記されている。Volcano は `kube-batch` を引き継ぎ、スケジューラの上にジョブライフサイクル CRD・コントローラ・admission Webhook を重ねた本格的なバッチシステムへと育った。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | KubeCon Shanghai で OSS 化。リポジトリ作成 2019-03-14 |
| 2020 | 2020-04-09 に CNCF Sandbox 受理。CNCF として最初のクラウドネイティブバッチコンピューティングプロジェクト |
| 2022 | 2022-03-21 の TOC 投票で CNCF Incubating に昇格、2022-04-07 にアナウンス |
| 2026 | v1.15.0 を 2026-06-01 にリリース |

## どう進化したか

[CNCF ブログ](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/)は Sandbox 受理から Incubation までの成長を記録している。コントリビュータは 70+ から 350+ へ、参加組織は 5 から 50+ へ増え、Amazon・HP・Huawei・Google・Oracle などが含まれる。普及の転機は Apache Spark が Kubernetes 上の built-in バッチスケジューラに Volcano を選んだことで、既存の大きなユーザー基盤に直接の統合をもたらした ([CNCF Spark ブログ](https://www.cncf.io/blog/2022/06/30/why-spark-chooses-volcano-as-built-in-batch-scheduler-on-kubernetes/))。

コードベースは当初のスケジューラを大きく超えて拡張されてきた。近年の追加には、ネットワークトポロジ対応・NUMA 対応のスケジューリングプラグイン、dynamic resource allocation サポート、サブジョブスケジューリング、オンライン・オフラインワークロード混載のためのノードエージェントがある。スケジューラは `kube-batch` から受け継いだ action と plugin の分離を今も保っている。

## 現在地

Volcano はリリースが活発な CNCF Incubating プロジェクトで、最新のタグ付きリリースは v1.15.0 (2026-06-01)、開発はそのタグの先の `master` で続いている。ビルドは 6 つのバイナリ (`vc-scheduler`, `vc-controller-manager`, `vc-webhook-manager`, `vc-agent`, `vc-agent-scheduler`, `vcctl`) を生成し、Go 1.25 を対象とする。CRD は別モジュール `volcano.sh/apis` に置かれ、`go.mod` の replace ディレクティブで参照される。

## 出典

1. [volcano-sh/volcano リポジトリ (README, ソース, git メタデータ)](https://github.com/volcano-sh/volcano)
2. [Cloud Native Batch System Volcano moves to the CNCF Incubator](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/)
3. [Volcano project page (CNCF)](https://www.cncf.io/projects/volcano/)
4. [Why Spark chooses Volcano as built-in batch scheduler on Kubernetes](https://www.cncf.io/blog/2022/06/30/why-spark-chooses-volcano-as-built-in-batch-scheduler-on-kubernetes/)
