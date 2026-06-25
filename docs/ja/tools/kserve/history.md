# 歴史

## 起源

KServe は 2018 年に KFServing として始まった。IBM は KubeCon + CloudNativeCon NA 2018 で Knative を使ったサーバレスな ML モデルサービングを提案し、同時期に Bloomberg も Knative での推論を実験していた。両者は Kubeflow Contributor Summit 2019 (Sunnyvale) で合流した。当時 Kubeflow にモデルサービングコンポーネントが無かったため、任意の ML フレームワーク向けの標準的かつ簡素なサービングの sub-project を立ち上げた ([CNCF blog, 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/))。

KFServing 自体は 2019 年に Google・IBM・Bloomberg・NVIDIA・Seldon の協働で開発され、OSS として公開された。KubeCon NA 2019 でデビューし、エンドユーザの関心を集めた ([CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/); [Kubeflow blog, 2021-09-27](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2018 | IBM が KubeCon NA で Knative ベースのサーバレス ML サービングを提案。Bloomberg も並行して実験 ([出典](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2019 | Google・IBM・Bloomberg・NVIDIA・Seldon が KFServing を開発し KubeCon NA でデビュー ([出典](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2021-09 | リポを `kubeflow/kfserving` から独立 org `kserve` に移管し KServe に改名。Bloomberg が主導 ([出典](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html)) |
| 2022-02 | LF AI & Data Foundation へ寄贈 ([出典](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2022-09 | standalone な KServe にリブランドし Kubeflow から卒業 ([出典](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2025-06 | v0.15 で生成 AI 向けを前進 (vLLM バックエンド、`LLMInferenceService`) ([出典](https://www.cncf.io/blog/2025/06/18/announcing-kserve-v0-15-advancing-generative-ai-model-serving/)) |
| 2025-09-29 | CNCF TOC が KServe を Incubating として受理 ([出典](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2025-11-11 | KubeCon NA で Incubating を公開アナウンス ([出典](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |

## どう進化したか

最初の大きな転機はガバナンス。2021 年 9 月、Kubeflow Serving WG はコントリビュータ層を広げるため `kubeflow/kfserving` リポを独立 org `kserve` に移し、KFServing を KServe に改名した。移管は Bloomberg が主導した ([Kubeflow blog](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html))。その後 2022 年 2 月に LF AI & Data へ寄贈され、2022 年 9 月までに Kubeflow から完全に分離した ([CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/))。

2 つ目の転機はスコープ。KServe は予測モデルのサービングとして始まり、2025 年の v0.15 で生成 AI に広がった。vLLM バックエンドの強化と、disaggregated serving と prefix caching を扱う新しい `LLMInferenceService` リソースである ([CNCF blog, v0.15](https://www.cncf.io/blog/2025/06/18/announcing-kserve-v0-15-advancing-generative-ai-model-serving/))。コードベースでは `v1alpha1`/`v1alpha2` の LLM CRD として現れる (`pkg/apis/serving/v1alpha1/llm_inference_service_types.go:60`)。

より静かな転機はデプロイのデフォルト。レガシーなモード名 `Serverless` と `RawDeployment` は `Knative` と `Standard` に改名され、デフォルトは `Standard` に倒れた (`pkg/constants/constants.go:550-554`)。KServe はもはや Knative の存在を前提にしない。

## 現状

最新のリリースタグは `v0.19.0` で、Python パッケージのバージョンも `0.19.0` (`python/kserve/pyproject.toml`)。本ディープダイブはそのリリース後の開発ライン `master` の `58d137d` を読む。KServe は 2025-09-29 に CNCF Incubation へ入り、TOC スポンサーは Faseela K と Kevin Wang で、中立ガバナンス下に置かれた。メンテナはリポの `MAINTAINERS.md` に列挙される ([CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/))。
