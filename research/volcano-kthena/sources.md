# sources: volcano-kthena (Kthena)

各出典に番号を振り、recon の引用と対応させる。アクセス日は 2026-06-24 から 2026-06-25。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | volcano-sh/kthena (GitHub) | <https://github.com/volcano-sh/kthena> | 2026-06-25 |
| 2 | blog | Introducing Kthena: LLM inference for the cloud native era (CNCF) | <https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/> | 2026-06-24 |
| 3 | blog | Cloud Native Batch System Volcano moves to the CNCF Incubator | <https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/> | 2026-06-24 |
| 4 | project | Volcano (CNCF project page) | <https://www.cncf.io/projects/volcano/> | 2026-06-24 |
| 5 | blog | Beyond Batch: Volcano Evolves into the AI-Native Unified Scheduling Platform | <https://www.cncf.io/blog/2026/03/23/beyond-batch-volcano-evolves-into-the-ai-native-unified-scheduling-platform/> | 2026-06-24 |
| 6 | blog | How to choose the inference orchestration solution? AIBrix or Kthena or Dynamo? (pacoxu) | <https://pacoxu.wordpress.com/2025/12/03/how-to-choose-the-inference-orchestration-solution-aibrix-or-kthena-or-dynamo/> | 2026-06-25 |
| 7 | docs | Kthena integration (vLLM docs) | <https://docs.vllm.ai/en/stable/deployment/integrations/kthena/> | 2026-06-25 |
| 8 | docs | Using Volcano Kthena (vllm-ascend) | <https://docs.vllm.ai/projects/ascend/en/main/user_guide/deployment_guide/using_volcano_kthena.html> | 2026-06-25 |
| 9 | blog | Introducing Gateway API Inference Extension (Kubernetes) | <https://kubernetes.io/blog/2025/06/05/introducing-gateway-api-inference-extension/> | 2026-06-25 |
| 10 | blog | Best of Both Worlds: Cloud-Native AI Inference using KServe and llm-d | <https://kserve.github.io/website/blog/cloud-native-ai-inference-kserve-llm-d> | 2026-06-25 |
| 11 | paper | AIBrix: Towards Scalable, Cost-Effective LLM Inference Infrastructure (arXiv) | <https://arxiv.org/html/2504.03648v1> | 2026-06-25 |
| 12 | repo | Kthena quick-start guide | <https://github.com/volcano-sh/kthena/blob/main/docs/kthena/docs/getting-started/quick-start.md> | 2026-06-25 |
| 13 | repo | volcano-sh/volcano (parent project) | <https://github.com/volcano-sh/volcano> | 2026-06-25 |

## コード参照（pinned commit `affd5be8b40aca466c7e39fb8fe41ed6e6ce3b44`）

- ルータ入口: `pkg/kthena-router/router/router.go:210` (`HandlerFunc`), `:335` (`doLoadbalance`), `:491` (`ParseModelRequest`), `:682` (`proxyModelEndpoint`), `:943` (`proxyToPDDisaggregated`)
- スケジューラ: `pkg/kthena-router/scheduler/scheduler_impl.go:119` (`Schedule`), `:62` (`NewScheduler` デフォルト plugin), `:255` (`TopNPodInfos`)
- prefix キャッシュ: `pkg/kthena-router/scheduler/plugins/prefix_cache.go:162` (`Score`), `pkg/kthena-router/scheduler/plugins/cache/prefix_store.go:141` (`FindTopMatches`)
- データ構造: `pkg/kthena-router/datastore/store.go:282` (`PodInfo`), `pkg/kthena-router/scheduler/framework`（`Context` 構造体 `:29`）
- CRD: `pkg/apis/workload/v1alpha1/model_serving_types.go:36`, `servinggroup_types.go:110`, `model_booster_types.go:200`, `autoscalingpolicy_types.go:25`; `pkg/apis/networking/v1alpha1/modelroute_types.go:26`, `modelserver_types.go:24`
- controller: `pkg/model-serving-controller/controller/model_serving_controller.go:72`（`PodGroupManager`）, `:194`（Volcano client）
- エントリポイント: `cmd/kthena-router/main.go:40`, `cmd/kthena-controller-manager/main.go:54`
- ライセンス: `LICENSE`（Apache-2.0）, `README.md:104`
