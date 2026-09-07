# 歴史

## 起源

Tekton は CI/CD のプロジェクトとして始まったわけではない。始まりは、Google が 2018 年にオープンソース化したサーバーレス基盤 Knative の中にあったビルド機構だった。Knative Build はソースからコンテナイメージを作るもので、そこから派生したパイプラインの作業は、それを任意のコンテナ処理の連鎖へと一般化することを狙っていた。

`tektoncd/pipeline` の最初のコミットは 2018-08-29、作者は Mark Chmarny。当時のリポジトリ名は `knative/build-pipeline`。続く 2 つのコミットは `Add pipeline strawman example` (2018-08-31) と `pipeline_strawman` ブランチのマージ (2018-09-05) で、どちらも Christie Wilson によるもの。コードよりも先に設計提案から始まったプロジェクトだった。

2019 年の初めには、独立した居場所が必要なことがはっきりしていた。Knative のブランドはサーバーレスと結びついていたが、パイプラインの部分は何をデプロイする人にとっても有用だったからだ [2]。2019 年 3 月、Google はこれを Tekton と改名し、発足したばかりの Continuous Delivery Foundation に寄贈した。Jenkins、Jenkins X、Spinnaker と並ぶ CDF の創立プロジェクトとして [3]。

## 年表

| 年 | 出来事 |
| --- | --- |
| 2018 | `knative/build-pipeline` として最初のコミット (2018-08-29)。strawman の設計文書から出発 |
| 2019 | `v0.1.0` を 2019-02-20 にタグ付け。3 月に Tekton へ改名し CD Foundation へ寄贈 [3] |
| 2020 | beta API (`v1beta1`) の時代。`v0.11.0` が 2020-03-30。beta リリースの解説が Google Open Source Blog に載る [4] |
| 2022 | `v1` API の型がツリーに入る (`pkg/apis/pipeline/v1/task_types.go` は 2022-06-29 追加)。2022-10-26 に CDF で graduated [5]。2022-10-31 の `v0.41.0` が最初の長期サポートリリース |
| 2023 | PipelineResources を 1 月から 3 月にかけて 3 コミットで削除 |
| 2025 | `v1.0.0` を 2025-02-27 にタグ付け |
| 2026 | 2026-03-13 に CNCF incubating として受け入れ、2026-03-24 に発表 [1]。CD Foundation 側も同日に引き継ぎを公表 [7]。`v1.16.0` を 2026-08-21 にタグ付け |

タグ・コミット・ファイル追加の日付は、ピン留めした clone の git 履歴から直接引いたもの。寄贈・graduation・受け入れの日付は、それぞれ挙げた発表記事による。

## どう変わってきたか

最大の変化は書き直しではなく削除だった。初期の Tekton には PipelineResources という概念があった。型付きの入出力で、タスクが「`git` リソースを消費し `image` リソースを生成する」と宣言でき、各型の実装を差し替えられる、というもの。プロジェクトの看板の機能だった。だが一般化するのが難しいことが分かり、2023 年に丸ごと削除された。コミットは `6ba1c48ed` (PullRequest リソース、2023-01-19)、`81876e6bc` (Git / Storage / Generic、2023-02-14)、`3ca844439` (Image、2023-02-23)。代わりに残ったのはもっと素朴なもの、つまりパラメータと result と workspace で、いずれも文字列とボリュームでしかない。

リポジトリの `README.md` は今も Tekton を "Typed" と謳い、`Image` リソースの裏側で kaniko と buildkit を差し替える例を載せている (`README.md:22-28`)。この段落は、それが説明している機能より 3 年長く生き延びている。

2 つ目の変化は、安定 API への緩やかな移行。`v1beta1` は 2020 年に登場し、その後何年も居座った。`v1` の型がツリーに現れるのは 2022 年半ばで、プロジェクトは変換 webhook (`pkg/apis/pipeline/v1/*_conversion.go`) で両方を生かし続けた。API の面はいまもコンパイル時ではなく実行時に絞られる。クラスタ全体の `enable-api-fields` フラグが alpha / beta / stable のどこまでを受け付けるかを決め、既定値は beta (`pkg/apis/config/feature_flags.go:73`)。

3 つ目はガバナンス。Tekton は 2022 年に CD Foundation 内で graduated し [5]、2026 年に CNCF へ移った [1], [7]。理由として挙げられたのは引力の話だった。採用者はすでに Tekton を Argo CD、SPIFFE/SPIRE、Sigstore と組み合わせて使っており、同じ財団に置けばよくあるスタックの真ん中から財団の境界線が消える [1]。

## 現在地

リリースは月次で、長期サポート版が年 4 回 (1 月・4 月・7 月・10 月)、それ以外はおよそ 1 か月のサポート (`releases.md`)。LTS の仕組みは 2022 年 10 月の `v0.41.0` から始まった。リリースのマニフェストは GitHub とオブジェクトストレージに公開され、コンテナイメージは Tekton Chains 経由の Sigstore で署名される。自分たちのツールで自分たちの成果物に署名しているわけだ (`releases.md`)。

Kubernetes の下限もリリースとともに上がる。`v0.59.x` は Kubernetes 1.27 以上、`v0.61.x` は 1.28 以上を要求する (`README.md`)。ガバナンスはマルチベンダで、Google・Red Hat・IBM などのメンテナがいる [1]。incubation 申請には Pipelines だけで 13 人のメンテナが記録されている [6]。
